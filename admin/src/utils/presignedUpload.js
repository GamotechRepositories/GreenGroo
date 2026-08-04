export function formatUploadSpeed(bytesPerSecond) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "—";
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadFileWithProgress({ url, file, contentType, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;

      const elapsedSec = Math.max((Date.now() - startTime) / 1000, 0.001);
      onProgress({
        percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        loaded: event.loaded,
        total: event.total,
        speed: event.loaded / elapsedSec,
      });
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({
          percent: 100,
          loaded: file.size,
          total: file.size,
          speed: 0,
        });
        resolve();
        return;
      }
      reject(new Error(`S3 upload failed (${xhr.status}). Check your S3 CORS configuration.`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("S3 upload failed. Check your network or S3 CORS configuration."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.send(file);
  });
}
