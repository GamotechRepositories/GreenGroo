import ImageUploadField from "../ui/ImageUploadField";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_INPUT } from "../../utils/excelStyles";

const MAX_SLOT = 4;
const MAX_VIDEO = 2;
const MAX_VIDEO_MB = 15;

export const PHOTO_GUIDELINES = [
  "Use clear photos",
  "Product should be clearly visible",
  "Avoid blurry images",
  "Use natural/adequate lighting",
  "Farm/harvest photos should be relevant to the product",
];

function PhotoList({ label, values, onChange, max = MAX_SLOT }) {
  const photos = values?.length ? values : [""];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <div key={`${label}-${index}`} className="space-y-1">
            <ImageUploadField
              label={`${label} ${index + 1}`}
              value={photo}
              showPresets={false}
              maxSizeMb={2}
              onChange={(value) => {
                const next = [...photos];
                next[index] = value;
                onChange(next.filter((p, i) => p || i === 0 || i < next.length - 1));
              }}
            />
            {photo ? (
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {photos.filter(Boolean).length < max ? (
        <button type="button" className={EXCEL_BTN} onClick={() => onChange([...photos, ""])}>
          Add Photo
        </button>
      ) : (
        <p className="text-[11px] text-[#6B7280]">Maximum {max} photos.</p>
      )}
    </div>
  );
}

function VideoList({ values, onChange }) {
  const videos = values?.length ? values : [""];

  const onFile = (file, index) => {
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
      const next = [...videos];
      next[index] = reader.result;
      onChange(next);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">Optional Short Video</p>
      {videos.map((video, index) => (
        <div key={`video-${index}`} className="space-y-1 border border-[#D4D4D4] p-2">
          {video ? (
            <video src={video} controls className="h-36 w-full bg-black object-contain" />
          ) : (
            <input className={EXCEL_INPUT} type="file" accept="video/mp4,video/webm" onChange={(e) => onFile(e.target.files?.[0], index)} />
          )}
          <div className="flex flex-wrap gap-1">
            {video ? (
              <button type="button" className={EXCEL_BTN} onClick={() => document.getElementById(`video-replace-${index}`)?.click()}>
                Upload Video
              </button>
            ) : null}
            <input
              id={`video-replace-${index}`}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0], index)}
            />
            {video ? (
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                onClick={() => onChange(videos.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {videos.filter(Boolean).length < MAX_VIDEO ? (
        <button type="button" className={EXCEL_BTN} onClick={() => onChange([...videos, ""])}>
          Add Video
        </button>
      ) : (
        <p className="text-[11px] text-[#6B7280]">Maximum {MAX_VIDEO} videos. MP4/WebM up to {MAX_VIDEO_MB} MB.</p>
      )}
    </div>
  );
}

export default function ProductMediaFields({ media, onChange, mainPhotoError }) {
  const setMedia = (patch) => onChange({ ...media, ...patch });
  const allPhotos = [
    media.mainPhoto,
    ...(media.farmPhotos || []),
    ...(media.cropPhotos || []),
    ...(media.harvestPhotos || []),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="border border-[#D4D4D4] bg-[#F9F9F9] p-3 text-[11px] text-[#4B5563]">
        <p className="mb-1 font-semibold text-[#1F2937]">Photo guidelines</p>
        <ul className="list-disc space-y-0.5 pl-4">
          {PHOTO_GUIDELINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div>
        <ImageUploadField
          label="Product Main Photo *"
          value={media.mainPhoto || ""}
          showPresets={false}
          maxSizeMb={2}
          error={mainPhotoError}
          onChange={(value) => setMedia({ mainPhoto: value })}
        />
        {media.mainPhoto ? (
          <button type="button" className={`${EXCEL_BTN_DANGER} mt-1`} onClick={() => setMedia({ mainPhoto: "" })}>
            Remove
          </button>
        ) : null}
      </div>

      <PhotoList label="Farm Photo" values={media.farmPhotos} onChange={(farmPhotos) => setMedia({ farmPhotos })} />
      <PhotoList label="Crop Photo" values={media.cropPhotos} onChange={(cropPhotos) => setMedia({ cropPhotos })} />
      <PhotoList label="Harvest Photo" values={media.harvestPhotos} onChange={(harvestPhotos) => setMedia({ harvestPhotos })} />
      <VideoList values={media.videos} onChange={(videos) => setMedia({ videos })} />

      {allPhotos.length ? (
        <div>
          <p className="mb-1 text-xs font-semibold">Set as Main Photo</p>
          <div className="flex flex-wrap gap-2">
            {allPhotos.map((src) => (
              <button
                key={src.slice(0, 40)}
                type="button"
                className={`h-14 w-14 overflow-hidden border ${media.mainPhoto === src ? "border-[#217346]" : "border-[#D4D4D4]"}`}
                onClick={() => setMedia({ mainPhoto: src })}
                title="Set as main photo"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
