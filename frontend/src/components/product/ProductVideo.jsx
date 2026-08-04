import { useEffect, useState } from "react";

function ProductVideo({ url, className = "", embedded = false }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const trimmed = typeof url === "string" ? url.trim() : "";

  useEffect(() => {
    setPreviewFailed(false);
  }, [trimmed]);

  if (!trimmed) return null;

  const shellClass = embedded
    ? `overflow-hidden bg-black ${className}`
    : `overflow-hidden rounded-lg border border-border-light bg-mobile-surface ${className}`;

  const videoClass = embedded
    ? "max-h-[min(70vh,520px)] w-full bg-black object-contain"
    : "aspect-video w-full bg-black";

  const fallbackClass = embedded
    ? "flex max-h-[min(70vh,520px)] min-h-[240px] w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-text-secondary"
    : "flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center text-sm text-text-secondary";

  return (
    <div className={shellClass}>
      {!previewFailed ? (
        <video
          key={trimmed}
          src={trimmed}
          controls
          playsInline
          preload="metadata"
          className={videoClass}
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <div className={fallbackClass}>
          <p>Video preview is unavailable in the browser.</p>
          <a
            href={trimmed}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Open video
          </a>
        </div>
      )}
    </div>
  );
}

export default ProductVideo;
