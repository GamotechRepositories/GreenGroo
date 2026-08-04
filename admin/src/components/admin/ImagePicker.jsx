import { useState } from "react";
import { uploadImageFile } from "../../api/api";
import {
  DEFAULT_MAX_UPLOAD_BYTES,
  formatMaxUploadMb,
  getMaxUploadBytes,
  UPLOAD_FOLDER_LABELS,
} from "../../utils/uploadFolders";
import { labelClass } from "./adminStyles";

function ImagePicker({
  label,
  value,
  onChange,
  folder,
  required = false,
  maxBytes,
  hint,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const folderLabel = UPLOAD_FOLDER_LABELS[folder] || folder;
  const limitBytes = maxBytes ?? getMaxUploadBytes(folder) ?? DEFAULT_MAX_UPLOAD_BYTES;
  const sizeHint = hint || `JPG, PNG, WEBP or GIF · Max ${formatMaxUploadMb(limitBytes)}`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }

    if (file.size > limitBytes) {
      setError(`Image must be under ${formatMaxUploadMb(limitBytes)}`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const { data } = await uploadImageFile(file, folder);
      onChange(data.data.url);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <label className={labelClass}>
          {label}
          {required ? " *" : ""}
        </label>
      )}

      {value ? (
        <div className="mt-2 space-y-2">
          <div className="product-image product-image--contain mx-auto max-w-sm overflow-hidden rounded-lg border border-border-light">
            <img src={value} alt="Uploaded preview" />
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-orange-50">
              {uploading ? "Uploading..." : "Change image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFile}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setError("");
              }}
              disabled={uploading}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-light bg-white px-4 py-6 transition hover:border-primary/40 hover:bg-orange-50/30">
          <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="mt-2 text-sm font-medium text-text-primary">
            {uploading ? "Uploading to S3..." : "Choose from gallery"}
          </span>
          <span className="mt-1 text-center text-xs text-text-muted">
            {sizeHint} · Saves to <span className="font-medium">{folder}/</span>
          </span>
          <span className="mt-0.5 text-[10px] text-text-muted">{folderLabel}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {required && !value && (
        <p className="mt-1 text-xs text-text-muted">Upload an image to continue</p>
      )}
    </div>
  );
}

export default ImagePicker;
