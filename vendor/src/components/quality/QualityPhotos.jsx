import { useEffect, useRef, useState } from "react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_SELECT } from "../../utils/excelStyles";

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

export default function QualityPhotos({ photos, onChange, disabled, compact = false }) {
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
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <div className={`flex ${compact ? "flex-wrap items-end gap-1.5" : "flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"}`}>
        <label className={`${compact ? "text-[10px]" : "text-[11px]"} font-semibold text-[#6B7280]`}>
          Photo type
          <select className={`mt-0.5 block ${compact ? "w-full rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] sm:w-auto" : `w-full sm:w-auto ${EXCEL_SELECT}`}`} value={label} disabled={disabled} onChange={(e) => setLabel(e.target.value)}>
            {LABELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <div className={`grid grid-cols-2 ${compact ? "gap-1" : "gap-2 sm:flex sm:flex-wrap"}`}>
          <button type="button" disabled={disabled} className={`${mode === "upload" ? EXCEL_BTN_PRIMARY : EXCEL_BTN} ${compact ? "!min-h-8 !rounded-lg !px-2 !py-1 !text-[11px]" : "w-full sm:w-auto"}`} onClick={() => setMode("upload")}>
            {compact ? "Upload" : "Upload Photo"}
          </button>
          <button type="button" disabled={disabled} className={`${mode === "camera" ? EXCEL_BTN_PRIMARY : EXCEL_BTN} ${compact ? "!min-h-8 !rounded-lg !px-2 !py-1 !text-[11px]" : "w-full sm:w-auto"}`} onClick={() => setMode("camera")}>
            {compact ? "Camera" : "Take Photo"}
          </button>
        </div>
      </div>

      {mode === "camera" ? (
        <div className={compact ? "space-y-1.5" : "space-y-2"}>
          <video ref={videoRef} className={`${compact ? "h-32" : "h-52 sm:h-44"} w-full rounded-xl bg-black object-cover`} muted playsInline autoPlay />
          {camError ? <p className="text-[11px] text-amber-700">{camError}</p> : null}
          <button type="button" disabled={disabled || photos.length >= MAX_PHOTOS || Boolean(camError)} className={`${EXCEL_BTN} ${compact ? "!min-h-8 !rounded-lg !px-2 !py-1 !text-[11px] w-full sm:w-auto" : "w-full sm:w-auto"}`} onClick={captureLive}>
            Capture Photo
          </button>
        </div>
      ) : (
        <label className={`block cursor-pointer border border-dashed border-[#D4D4D4] ${compact ? "px-2 py-3" : "px-3 py-6"} text-center text-[11px] text-[#6B7280]`}>
          {compact ? "Upload photos" : "Upload quality inspection photos"}
          <input type="file" accept="image/*" multiple className="hidden" disabled={disabled} onChange={onUpload} />
        </label>
      )}

      {photos.length ? (
        <div className={`grid ${compact ? "grid-cols-3 gap-1.5" : "grid-cols-2 gap-2 sm:grid-cols-4"}`}>
          {photos.map((p, i) => (
            <div key={`${i}-${(p.url || "").slice(-12)}`} className={`border border-[#D4D4D4] ${compact ? "p-0.5" : "p-1"}`}>
              <img src={p.url} alt={p.label || "Quality"} className={`${compact ? "h-14" : "h-20"} w-full object-cover`} />
              <p className={`truncate text-[#6B7280] ${compact ? "mt-0.5 text-[9px]" : "mt-1 text-[10px]"}`}>{p.label || "Photo"}</p>
              <div className={`grid grid-cols-2 ${compact ? "mt-0.5 gap-0.5" : "mt-1 gap-1"}`}>
                <button type="button" className={`${EXCEL_BTN} ${compact ? "!min-h-6 !rounded-md !px-1 !py-0.5 !text-[9px]" : "px-1 text-[11px]"}`} onClick={() => setPreview(p)}>{compact ? "View" : "Preview"}</button>
                <button type="button" disabled={disabled} className={`${EXCEL_BTN} ${compact ? "!min-h-6 !rounded-md !px-1 !py-0.5 !text-[9px]" : "px-1 text-[11px]"}`} onClick={() => onChange(photos.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-[#9CA3AF]`}>{compact ? "No photos yet." : "No quality photos yet."}</p>
      )}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-full max-w-3xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-xs font-semibold">{preview.label || "Preview"}</p>
            <img src={preview.url} alt="" className="max-h-[70vh] max-w-full" />
            <button type="button" className={`mt-2 ${EXCEL_BTN}`} onClick={() => setPreview(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
