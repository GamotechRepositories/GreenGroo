const MIN_ASPECT_RATIO = 0.65;
const MAX_ASPECT_RATIO = 1.45;

export function normalizeProductImages(productImages) {
  if (!productImages) return [];

  if (Array.isArray(productImages)) {
    return productImages
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter(Boolean);
  }

  if (typeof productImages === "string") {
    return productImages
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean);
  }

  if (typeof productImages === "object") {
    return Object.values(productImages)
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter(Boolean);
  }

  return [];
}

export function clampImageAspectRatio(width, height, fallback = 1) {
  if (!width || !height) return fallback;
  const ratio = width / height;
  return Math.min(Math.max(ratio, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO);
}

export function getDisplayHeightForWidth(width, aspectRatio, maxHeight) {
  if (!width || !aspectRatio) return maxHeight;
  return Math.min(Math.round(width / aspectRatio), maxHeight);
}

export function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Missing image source"));
      return;
    }

    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        aspectRatio: clampImageAspectRatio(image.naturalWidth, image.naturalHeight),
      });
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}
