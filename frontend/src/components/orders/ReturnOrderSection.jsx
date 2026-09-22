import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImageFile } from "../../api/api";
import { UPLOAD_FOLDERS } from "../../utils/uploadFolders";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Multi-step return flow: reason → product photo → success popup → Orders.
 * onSubmit({ reason, imageUrl }) => Promise
 */
export default function ReturnOrderSection({
  order,
  onSubmit,
  returning = false,
  returnError = "",
  variant = "mobile",
}) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("reason"); // reason | photo | success
  const [reason, setReason] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!order || order.status !== "delivered") return null;

  const reset = () => {
    setOpen(false);
    setStep("reason");
    setReason("");
    setImageUrl("");
    setImagePreview("");
    setLocalError("");
    setUploading(false);
  };

  const goToPhoto = (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setLocalError("Please enter a short reason for the return");
      return;
    }
    setLocalError("");
    setStep("photo");
  };

  const processImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please upload an image (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    setLocalError("");
    try {
      const { data } = await uploadImageFile(file, UPLOAD_FOLDERS.RETURNS);
      const url = data?.data?.url || "";
      if (!url) throw new Error("Upload failed");
      setImageUrl(url);
      setImagePreview(url);
    } catch (err) {
      setLocalError(err.response?.data?.message || "Failed to upload image");
      setImageUrl("");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setLocalError("Please upload a photo of the product");
      return;
    }
    if (!onSubmit) return;
    setLocalError("");
    try {
      await onSubmit({ reason: reason.trim(), imageUrl });
      setStep("success");
    } catch {
      // parent sets returnError
    }
  };

  const shell =
    variant === "desktop"
      ? "rounded-xl border border-amber-100 bg-white p-5 shadow-sm"
      : "";

  const errorText = localError || returnError;

  return (
    <div className={shell}>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setStep("reason");
          }}
          className="w-full rounded-lg border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          Request return
        </button>
      ) : null}

      {open && step === "reason" ? (
        <form onSubmit={goToPhoto} className="space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Request a return</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Step 1 of 2 — Tell us why you want to return this order.
            </p>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            placeholder="Reason for return (e.g. damaged item, wrong product…)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
          />
          {errorText ? <p className="text-xs font-medium text-rose-600">{errorText}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!reason.trim()}
              className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next: add product photo
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {open && step === "photo" ? (
        <form onSubmit={handleFinalSubmit} className="space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Product photo</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Step 2 of 2 — Upload a clear photo of the product you want to return.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImage(file);
              e.target.value = "";
            }}
          />

          {imagePreview ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={imagePreview}
                alt="Product for return"
                className="mx-auto max-h-48 object-contain"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600 transition hover:border-amber-400 hover:bg-amber-50/40"
            >
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.055-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
              <span className="font-semibold text-slate-800">
                {uploading ? "Uploading…" : "Tap to upload product image"}
              </span>
              <span className="text-xs text-slate-400">JPG, PNG or WEBP · max 5 MB</span>
            </button>
          )}

          {imagePreview ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-semibold text-amber-800 underline"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          ) : null}

          {errorText ? <p className="text-xs font-medium text-rose-600">{errorText}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={returning || uploading || !imageUrl}
              className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {returning ? "Sending…" : "Send return request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("reason");
                setLocalError("");
              }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              Back
            </button>
          </div>
        </form>
      ) : null}

      {step === "success" ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Request sent</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your return request has been submitted successfully. Our team will review it and get back
              to you soon.
            </p>
            <button
              type="button"
              onClick={() => {
                reset();
                navigate("/orders");
              }}
              className="mt-5 w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Back to orders
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
