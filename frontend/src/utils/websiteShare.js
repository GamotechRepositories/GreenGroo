import { buildApiUrl } from "../api/api";
import { SITE_SHARE_IMAGE_URL, SITE_URL } from "../config/site";
import { downloadShareImage } from "./productShare";

function getMimeType(ext) {
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return types[ext] || "image/jpeg";
}

function getImageExtension(url) {
  const match = url?.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

async function fetchImageBlob(imageUrl) {
  if (!imageUrl) return null;

  try {
    const proxyResponse = await fetch(
      buildApiUrl(`/api/proxy/image?url=${encodeURIComponent(imageUrl)}`)
    );
    if (proxyResponse.ok) {
      return await proxyResponse.blob();
    }
  } catch {
    // fall through
  }

  try {
    const directResponse = await fetch(imageUrl);
    if (!directResponse.ok) return null;
    return await directResponse.blob();
  } catch {
    return null;
  }
}

export function getWebsiteShareUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/`;
  }
  return SITE_URL;
}

export function buildWebsiteShareContent(shareUrl = getWebsiteShareUrl()) {
  const text = [
    "Bulk Mobile Mart",
    "Wholesale mobile phones & accessories in India",
    "",
    shareUrl,
  ].join("\n");

  return {
    title: "BulkMobileMart",
    text,
    shareUrl,
  };
}

export async function getShareableWebsiteFile() {
  const blob = await fetchImageBlob(SITE_SHARE_IMAGE_URL);
  if (!blob) {
    const localResponse = await fetch("/favicon.png").catch(() => null);
    if (!localResponse?.ok) return null;
    const localBlob = await localResponse.blob();
    return new File([localBlob], "bulkmobilemart-logo.png", {
      type: localBlob.type?.startsWith("image/") ? localBlob.type : "image/png",
    });
  }

  const ext = getImageExtension(SITE_SHARE_IMAGE_URL);
  return new File([blob], `bulkmobilemart-logo.${ext}`, {
    type: blob.type?.startsWith("image/") ? blob.type : getMimeType(ext),
  });
}

function canShareImageWithText(imageFile, text) {
  if (!navigator.canShare) return Boolean(imageFile);
  try {
    return navigator.canShare({
      files: [imageFile],
      ...(text ? { text } : {}),
    });
  } catch {
    return false;
  }
}

export async function shareWebsite() {
  const shareContent = buildWebsiteShareContent();
  const imageFile = await getShareableWebsiteFile();

  if (navigator.share) {
    if (imageFile && canShareImageWithText(imageFile, shareContent.text)) {
      await navigator.share({
        files: [imageFile],
        text: shareContent.text,
        title: shareContent.title,
      });
      return { mode: "native" };
    }

    await navigator.share({
      title: shareContent.title,
      text: shareContent.text,
      url: shareContent.shareUrl,
    });
    return { mode: "native-url" };
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareContent.text);
  }

  if (imageFile) {
    downloadShareImage(imageFile);
  }

  window.open(
    `https://wa.me/?text=${encodeURIComponent(shareContent.text)}`,
    "_blank",
    "noopener,noreferrer"
  );

  return {
    mode: "fallback",
    downloadedImage: Boolean(imageFile),
    copiedText: true,
  };
}
