import { useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 8;
const LABELS = [
  "Product condition",
  "Freshness",
  "Size",
  "Colour",
  "Damage",
  "Weight",
  "Packaging",
  "Overall batch",
];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl, maxW = 1280, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function QualityPhotos({ photos, onChange, disabled }) {
  const [mode, setMode] = useState("upload");
  const [camError, setCamError] = useState("");
  const [label, setLabel] = useState(LABELS[0]);
  const [preview, setPreview] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (mode !== "camera" || disabled) return undefined;
    let active = true;
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera not available. Use Upload Photo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCamError("");
      } catch {
        setCamError("Camera permission denied. Use Upload Photo.");
      }
    };
    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, disabled]);

  const addPhoto = async (dataUrl) => {
    if (!dataUrl || photos.length >= MAX_PHOTOS) return;
    const compressed = await compressDataUrl(dataUrl);
    onChange([...photos, { url: compressed, label }]);
  };

  const captureLive = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    await addPhoto(canvas.toDataURL("image/jpeg", 0.8));
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files.slice(0, MAX_PHOTOS - photos.length)) {
      if (!file.type.startsWith("image/")) continue;
      const raw = await readFileAsDataUrl(file);
      await addPhoto(raw);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] font-semibold text-gray-600">
          Photo type
          <select
            className="mt-1 block border border-gray-200 px-2 py-1.5 text-xs"
            value={label}
            disabled={disabled}
            onChange={(e) => setLabel(e.target.value)}
          >
            {LABELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={disabled}
          className={`px-3 py-1.5 text-xs font-semibold ${mode === "upload" ? "bg-[#217346] text-white" : "border border-gray-200"}`}
          onClick={() => setMode("upload")}
        >
          Upload Photo
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`px-3 py-1.5 text-xs font-semibold ${mode === "camera" ? "bg-[#217346] text-white" : "border border-gray-200"}`}
          onClick={() => setMode("camera")}
        >
          Take Photo
        </button>
      </div>

      {mode === "camera" ? (
        <div className="space-y-2">
          <video ref={videoRef} className="h-44 w-full bg-black object-cover" muted playsInline autoPlay />
          {camError ? <p className="text-[11px] text-amber-700">{camError}</p> : null}
          <button
            type="button"
            disabled={disabled || photos.length >= MAX_PHOTOS || Boolean(camError)}
            className="border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            onClick={captureLive}
          >
            Capture Photo
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-600">
          Upload quality inspection photos
          <input type="file" accept="image/*" multiple className="hidden" disabled={disabled} onChange={onUpload} />
        </label>
      )}

      {photos.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={`${i}-${(p.url || "").slice(-12)}`} className="border border-gray-200 p-1">
              <img src={p.url} alt={p.label || "Quality"} className="h-20 w-full object-cover" />
              <p className="mt-1 truncate text-[10px] text-gray-500">{p.label || "Photo"}</p>
              <div className="mt-1 flex gap-1">
                <button type="button" className="flex-1 border border-gray-200 py-0.5 text-[10px]" onClick={() => setPreview(p)}>
                  Preview
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex-1 border border-gray-200 py-0.5 text-[10px] text-red-600 disabled:opacity-50"
                  onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">No quality photos yet.</p>
      )}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-full max-w-3xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-xs font-semibold">{preview.label || "Preview"}</p>
            <img src={preview.url} alt="" className="max-h-[70vh] max-w-full" />
            <button type="button" className="mt-2 border border-gray-200 px-3 py-1 text-xs" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
