const PASSTHROUGH_TYPES = /^image\/(gif|svg\+xml)$/i;
const SMALL_FILE_BYTES = 300 * 1024;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/**
 * Reads a photo as a data URL, downscaled so its longer side is at most
 * `maxDim` px. The original is returned unchanged when it is already small,
 * animated/vector, undecodable by the browser, or when re-encoding would not
 * make it smaller. Not meant for KYC/document scans.
 */
export async function fileToCompressedImageDataUrl(file, { maxDim = 1600, quality = 0.82 } = {}) {
  const original = await readAsDataUrl(file);
  if (PASSTHROUGH_TYPES.test(file.type || "")) return original;

  let img;
  try {
    img = await loadImage(original);
  } catch {
    return original;
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (!longest) return original;
  const scale = Math.min(1, maxDim / longest);
  if (scale === 1 && file.size <= SMALL_FILE_BYTES) return original;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const compressed = canvas.toDataURL(type, quality);
  return compressed.length < original.length ? compressed : original;
}
