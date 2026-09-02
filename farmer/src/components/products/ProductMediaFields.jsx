import { useRef } from "react";

const MAX_SLOT = 4;
const MAX_VIDEO = 1;
const MAX_VIDEO_MB = 15;
const MAX_IMAGE_MB = 2;

export const PHOTO_GUIDELINES = [
  "Use clear photos",
  "Product should be clearly visible",
  "Avoid blurry images",
  "Use natural/adequate lighting",
  "Farm/harvest photos should be relevant to the product",
];

function readImageFile(file, onDone) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please select a JPG or PNG image.");
    return;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    alert(`Image must be under ${MAX_IMAGE_MB} MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onDone(reader.result);
  };
  reader.readAsDataURL(file);
}

function PhotoTile({ label, required, value, error, onChange }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </p>
      <div
        className={`relative overflow-hidden rounded-lg border ${
          error ? "border-red-400" : "border-slate-200"
        } bg-slate-50`}
      >
        <div className="h-[72px] w-full sm:h-24">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-0.5 px-1 text-center">
              <span className="text-sm leading-none text-slate-400">+</span>
              <span className="text-[9px] font-medium text-slate-500">Add photo</span>
            </div>
          )}
        </div>
        {value ? (
          <button
            type="button"
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-xs font-semibold text-slate-700 shadow"
            aria-label={`Remove ${label}`}
            onClick={() => onChange("")}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          className="h-7 rounded-md border border-emerald-700 bg-emerald-700 text-[10px] font-semibold text-white"
          onClick={() => galleryRef.current?.click()}
        >
          Upload
        </button>
        <button
          type="button"
          className="h-7 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700"
          onClick={() => cameraRef.current?.click()}
        >
          Camera
        </button>
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : null}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          readImageFile(e.target.files?.[0], onChange);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          readImageFile(e.target.files?.[0], onChange);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ExtraThumbs({ photos, onChange, max = MAX_SLOT }) {
  const addRef = useRef(null);
  const filled = (photos || []).filter(Boolean);
  if (!filled.length) return null;

  const extras = filled.slice(1);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {extras.map((src, index) => (
        <div key={`${src.slice(0, 24)}-${index}`} className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-200">
          <img src={src} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-white/90 text-[10px] font-bold text-slate-700"
            onClick={() => onChange([filled[0], ...extras.filter((_, i) => i !== index)])}
          >
            ×
          </button>
        </div>
      ))}
      {filled.length < max ? (
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400"
          onClick={() => addRef.current?.click()}
        >
          +
        </button>
      ) : null}
      <input
        ref={addRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          readImageFile(e.target.files?.[0], (url) => onChange([...filled, url]));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function VideoTile({ value, onChange }) {
  const fileRef = useRef(null);

  const onFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please select an MP4 or WebM video.");
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`Video must be under ${MAX_VIDEO_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold text-slate-700">Video</p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {value ? (
          <video src={value} controls className="h-24 w-full bg-black object-contain" />
        ) : (
          <button
            type="button"
            className="flex h-16 w-full flex-col items-center justify-center gap-0.5 text-slate-500"
            onClick={() => fileRef.current?.click()}
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-[10px] font-medium">Add short video (optional)</span>
          </button>
        )}
      </div>
      <div className="mt-1 flex gap-1">
        <button
          type="button"
          className="h-7 flex-1 rounded-md border border-emerald-700 bg-emerald-700 text-[10px] font-semibold text-white"
          onClick={() => fileRef.current?.click()}
        >
          {value ? "Replace" : "Upload"}
        </button>
        {value ? (
          <button
            type="button"
            className="h-7 flex-1 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-red-600"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function firstPhoto(list) {
  return (list || []).find(Boolean) || "";
}

function setFirstPhoto(list, value) {
  const rest = (list || []).filter(Boolean).slice(1);
  if (!value) return rest.length ? rest : [""];
  return [value, ...rest];
}

export default function ProductMediaFields({ media, onChange, mainPhotoError }) {
  const setMedia = (patch) => onChange({ ...media, ...patch });

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-snug text-slate-500">Clear, well-lit photos. Product should be clearly visible.</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <PhotoTile
            label="Main"
            required
            value={media.mainPhoto || ""}
            error={mainPhotoError}
            onChange={(value) => setMedia({ mainPhoto: value })}
          />
        </div>
        <div>
          <PhotoTile
            label="Farm"
            value={firstPhoto(media.farmPhotos)}
            onChange={(value) => setMedia({ farmPhotos: setFirstPhoto(media.farmPhotos, value) })}
          />
          <ExtraThumbs photos={media.farmPhotos} onChange={(farmPhotos) => setMedia({ farmPhotos })} />
        </div>
        <div>
          <PhotoTile
            label="Crop"
            value={firstPhoto(media.cropPhotos)}
            onChange={(value) => setMedia({ cropPhotos: setFirstPhoto(media.cropPhotos, value) })}
          />
          <ExtraThumbs photos={media.cropPhotos} onChange={(cropPhotos) => setMedia({ cropPhotos })} />
        </div>
        <div>
          <PhotoTile
            label="Harvest"
            value={firstPhoto(media.harvestPhotos)}
            onChange={(value) => setMedia({ harvestPhotos: setFirstPhoto(media.harvestPhotos, value) })}
          />
          <ExtraThumbs photos={media.harvestPhotos} onChange={(harvestPhotos) => setMedia({ harvestPhotos })} />
        </div>
      </div>

      <VideoTile
        value={(media.videos || []).find(Boolean) || ""}
        onChange={(value) => setMedia({ videos: value ? [value] : [""] })}
      />
    </div>
  );
}
