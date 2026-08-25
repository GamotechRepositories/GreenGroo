import { useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 4;

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

export default function ConfirmPickupPhotos({ photos, onChange, disabled }) {
  const [mode, setMode] = useState("live");
  const [camError, setCamError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (mode !== "live" || disabled) return undefined;
    let active = true;
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera not available. Use Upload Photo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
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
    onChange([...photos, compressed]);
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
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold text-gray-900">Pickup photo</p>
      <p className="text-[11px] text-gray-500">Take a live photo of the packed order, or upload from gallery. At least one photo is required.</p>
      <div className="grid grid-cols-2 border border-gray-200">
        <button
          type="button"
          className={`py-1.5 text-[11px] font-semibold ${mode === "live" ? "bg-[#217346] text-white" : "bg-white text-gray-600"}`}
          onClick={() => setMode("live")}
        >
          Live Photo
        </button>
        <button
          type="button"
          className={`py-1.5 text-[11px] font-semibold ${mode === "upload" ? "bg-[#217346] text-white" : "bg-white text-gray-600"}`}
          onClick={() => setMode("upload")}
        >
          Upload Photo
        </button>
      </div>

      {mode === "live" ? (
        <div className="space-y-2">
          <video ref={videoRef} className="h-44 w-full bg-black object-cover" muted playsInline autoPlay />
          {camError ? <p className="text-[11px] text-amber-700">{camError}</p> : null}
          <button
            type="button"
            disabled={disabled || photos.length >= MAX_PHOTOS || Boolean(camError)}
            className="w-full border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            onClick={captureLive}
          >
            Capture Photo
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-600">
          Tap to upload from gallery
          <input type="file" accept="image/*" capture="environment" multiple className="hidden" disabled={disabled} onChange={onUpload} />
        </label>
      )}

      {photos.length ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((src, i) => (
            <div key={`${i}-${src.slice(-12)}`} className="relative">
              <img src={src} alt={`Pickup ${i + 1}`} className="h-16 w-full object-cover" />
              <button
                type="button"
                className="absolute right-0 top-0 bg-black/70 px-1 text-[10px] text-white"
                onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-red-600">No photo yet.</p>
      )}
    </div>
  );
}
