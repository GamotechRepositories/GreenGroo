import { buildCdnUrl, isS3Configured, uploadDataUrlToS3 } from "./s3Upload.js";
import { normalizeUploadFolder } from "./uploadFolders.js";

export const MAX_IMAGE_DATA_URL_LENGTH = 2_500_000;
export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_HERO_BANNER_BYTES = 15 * 1024 * 1024;

export function getMaxUploadBytesForFolder(folder) {
  if (folder === "hero-banners" || folder === "offer-banners") {
    return MAX_HERO_BANNER_BYTES;
  }
  return MAX_IMAGE_FILE_BYTES;
}

export function formatMaxUploadMb(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const IMAGE_URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;

export function isValidImageDataUrl(value) {
  return (
    typeof value === "string" &&
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(value)
  );
}

export function isValidImageHttpUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const cloudfrontBase = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");
  if (cloudfrontBase && trimmed.startsWith(`${cloudfrontBase}/`)) {
    return true;
  }

  return IMAGE_URL_REGEX.test(trimmed);
}

export async function resolveImageForStorage(value, folder) {
  const raw = typeof value === "string" ? value.trim() : "";
  const normalizedFolder = normalizeUploadFolder(folder);

  if (!raw) {
    return { error: "Image is required" };
  }

  if (isValidImageHttpUrl(raw)) {
    return { url: raw };
  }

  if (isValidImageDataUrl(raw)) {
    if (raw.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return { error: "Image is too large. Please upload an image under 5 MB" };
    }

    if (!isS3Configured()) {
      return { error: "Image upload is not configured on the server" };
    }

    if (!normalizedFolder) {
      return { error: "Invalid upload folder" };
    }

    const uploaded = await uploadDataUrlToS3(raw, normalizedFolder);
    return { url: uploaded.url, key: uploaded.key, folder: uploaded.folder };
  }

  return { error: "Invalid image. Upload a JPG, PNG, WEBP, or GIF" };
}

export function getCdnUrlForKey(key) {
  return buildCdnUrl(key);
}
