import { formatBytes, formatUploadSpeed } from "../../utils/presignedUpload";

function UploadProgressBar({
  percent = 0,
  loaded = 0,
  total = 0,
  speed = 0,
  label = "Uploading...",
}) {
  return (
    <div className="rounded-lg border border-border-light bg-orange-50/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="font-semibold text-primary">{percent}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-muted">
        <span>
          {formatBytes(loaded)} / {formatBytes(total)}
        </span>
        <span className="font-medium text-text-secondary">
          {formatUploadSpeed(speed)}
        </span>
      </div>
    </div>
  );
}

export default UploadProgressBar;
