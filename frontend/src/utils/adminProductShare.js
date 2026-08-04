import { buildApiUrl } from "../api/api";

function getImageExtension(url) {
  const match = url?.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

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

export function buildAdminProductShareContent(product) {
  const productName = product?.name?.trim() || "Product";
  const brandName = product?.brandName?.trim() || "";

  const lines = [productName];
  if (brandName) {
    lines.push(`Brand: ${brandName}`);
  }

  return {
    title: productName,
    text: lines.join("\n"),
    productName,
    brandName,
    description: "",
  };
}

export async function getAdminShareableProductFile(product, imageUrl) {
  const { productName } = buildAdminProductShareContent(product);
  const blob = await fetchImageBlob(imageUrl);
  if (!blob) return null;

  const ext = getImageExtension(imageUrl);
  const safeName = productName
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return new File([blob], `${safeName || "product"}.${ext}`, {
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

export async function shareAdminProduct({ product, imageUrl }) {
  if (!navigator.share) return false;

  const shareContent = buildAdminProductShareContent(product);
  const imageFile = await getAdminShareableProductFile(product, imageUrl);
  const caption = shareContent.text;

  if (imageFile && canShareImageWithText(imageFile, caption)) {
    await navigator.share({
      files: [imageFile],
      text: caption,
    });
    return true;
  }

  if (caption) {
    await navigator.share({ text: caption });
    return true;
  }

  return false;
}

export function downloadAdminShareImage(imageFile) {
  if (!imageFile) return;

  const url = URL.createObjectURL(imageFile);
  const link = document.createElement("a");
  link.href = url;
  link.download = imageFile.name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyAdminProductShare({ product, imageUrl }) {
  const shareContent = buildAdminProductShareContent(product);
  const imageFile = await getAdminShareableProductFile(product, imageUrl);

  if (imageFile && navigator.clipboard?.write && window.ClipboardItem) {
    const items = {
      [imageFile.type]: imageFile,
    };
    if (shareContent.text) {
      items["text/plain"] = new Blob([shareContent.text], { type: "text/plain" });
    }
    await navigator.clipboard.write([new ClipboardItem(items)]);
    return { copiedImage: true, copiedText: Boolean(shareContent.text) };
  }

  if (navigator.clipboard?.writeText && shareContent.text) {
    await navigator.clipboard.writeText(shareContent.text);
    return { copiedImage: false, copiedText: true };
  }

  throw new Error("Clipboard not available");
}

export async function shareAdminProductToWhatsApp({ product, imageUrl }) {
  const shareContent = buildAdminProductShareContent(product);
  const imageFile = await getAdminShareableProductFile(product, imageUrl);
  const caption = shareContent.text;

  if (navigator.share && imageFile && canShareImageWithText(imageFile, caption)) {
    try {
      await navigator.share({
        files: [imageFile],
        text: caption,
      });
      return { mode: "native" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { mode: "cancelled" };
      }
    }
  }

  if (caption && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(caption);
  }

  if (imageFile) {
    downloadAdminShareImage(imageFile);
  }

  if (caption) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return {
    mode: "fallback",
    downloadedImage: Boolean(imageFile),
    copiedText: Boolean(caption),
  };
}
