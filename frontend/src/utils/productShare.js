import { buildApiUrl } from "../api/api";
import {
  getDisplayPrice,
  getProductListPriceInfo,
  isMultiVariant,
} from "./productPricing";

function formatSharePrice(amount) {
  const value = Number(amount) || 0;
  if (value <= 0) return "";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function resolveSharePriceInfo(product, variantName = "") {
  const resolvedVariant = String(variantName || "").trim();
  let priceInfo = getProductListPriceInfo(product, resolvedVariant);

  if (!priceInfo.salePrice && isMultiVariant(product) && !resolvedVariant) {
    priceInfo = {
      ...priceInfo,
      salePrice: getDisplayPrice(product),
      hasDiscount: false,
    };
  }

  return priceInfo;
}

function buildSharePriceLine(priceInfo) {
  if (!priceInfo?.salePrice) return "";

  const sale = formatSharePrice(priceInfo.salePrice);
  return `💰 Price: ${sale}`;
}

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

export function buildProductShareContent({
  product,
  shareUrl,
  variantName = "",
  includeUrl = true,
}) {
  const brandName = product?.brandName?.trim() || "";
  const productName = product?.name?.trim() || "Product";
  const resolvedVariant = String(variantName || "").trim();
  const priceInfo = resolveSharePriceInfo(product, resolvedVariant);
  const priceLine = buildSharePriceLine(priceInfo);

  const lines = [`📱 ${productName}`];

  if (brandName) {
    lines.push(`🏷️ Brand: ${brandName}`);
  }

  if (resolvedVariant) {
    lines.push(`📦 Variant: ${resolvedVariant}`);
  }

  if (priceLine) {
    lines.push(priceLine);
  }

  if (includeUrl && shareUrl) {
    lines.push(`🛒 Shop on Bulk Mobile Mart:\n${shareUrl}`);
  } else {
    lines.push("🛒 Shop on Bulk Mobile Mart");
  }

  return {
    title: productName,
    text: lines.join("\n"),
    brandName,
    productName,
    priceLine,
    salePrice: priceInfo.salePrice,
    shareUrl,
  };
}

export async function getShareableProductFile({ product, imageUrl, variantName = "" }) {
  const { productName } = buildProductShareContent({
    product,
    shareUrl: "",
    variantName,
    includeUrl: false,
  });

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

export function downloadShareImage(imageFile) {
  if (!imageFile) return;

  const url = URL.createObjectURL(imageFile);
  const link = document.createElement("a");
  link.href = url;
  link.download = imageFile.name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyProductShare({ product, shareUrl, imageUrl, variantName = "" }) {
  const shareContent = buildProductShareContent({
    product,
    shareUrl,
    variantName,
    includeUrl: true,
  });
  const imageFile = await getShareableProductFile({ product, imageUrl, variantName });

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

export async function shareProductToWhatsApp({ product, shareUrl, imageUrl, variantName = "" }) {
  const shareContent = buildProductShareContent({
    product,
    shareUrl,
    variantName,
    includeUrl: true,
  });
  const imageFile = await getShareableProductFile({ product, imageUrl, variantName });
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
    downloadShareImage(imageFile);
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

export async function shareProduct({ product, shareUrl, imageUrl, variantName = "" }) {
  if (!navigator.share) return false;

  const shareContent = buildProductShareContent({
    product,
    shareUrl,
    variantName,
    includeUrl: true,
  });
  const imageFile = await getShareableProductFile({ product, imageUrl, variantName });
  const caption = shareContent.text;

  if (imageFile && canShareImageWithText(imageFile, caption)) {
    await navigator.share({
      files: [imageFile],
      text: caption,
      title: shareContent.title,
    });
    return true;
  }

  await navigator.share({
    title: shareContent.title,
    text: caption,
    url: shareUrl,
  });
  return true;
}

function upsertMetaTag(attribute, key, content) {
  if (!content || typeof document === "undefined") return;

  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function updateProductShareMeta({ product, shareUrl, imageUrl, variantName = "" }) {
  if (!product || typeof document === "undefined") return;

  const priceInfo = resolveSharePriceInfo(product, variantName);
  const priceLabel = priceInfo.salePrice ? formatSharePrice(priceInfo.salePrice) : "";

  const { title, productName, brandName } = buildProductShareContent({
    product,
    shareUrl,
    variantName,
    includeUrl: false,
  });

  document.title = `${productName} | BulkMobileMart`;

  const descriptionParts = [];
  if (brandName) descriptionParts.push(brandName);
  if (priceLabel) descriptionParts.push(priceLabel);
  descriptionParts.push("Wholesale on Bulk Mobile Mart");
  const description = descriptionParts.join(" · ");

  upsertMetaTag("property", "og:title", productName);
  upsertMetaTag("property", "og:description", description);
  upsertMetaTag("property", "og:image", imageUrl || "");
  upsertMetaTag("property", "og:url", shareUrl);
  upsertMetaTag("property", "og:type", "product");
  upsertMetaTag("name", "description", description);
  upsertMetaTag("name", "twitter:card", "summary_large_image");
  upsertMetaTag("name", "twitter:title", title);
  upsertMetaTag("name", "twitter:description", description);
  upsertMetaTag("name", "twitter:image", imageUrl || "");
}
