import { useEffect, useState } from "react";

function VideoUrlPreview({ url, onRemove }) {
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewFailed(false);
  }, [url]);

  if (!url) return null;

  return (
    <div className="rounded-lg border border-border-light p-3">
      {!previewFailed ? (
        <video
          key={url}
          src={url}
          controls
          preload="metadata"
          className="max-h-52 w-full rounded"
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <div className="rounded-lg bg-mobile-surface px-3 py-4 text-sm text-text-secondary">
          Preview is not available for this URL, but it will still be saved with the product.
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-3">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open video URL
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Remove video
        </button>
      </div>
    </div>
  );
}

export default VideoUrlPreview;
