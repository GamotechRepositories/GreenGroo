import { useEffect, useMemo, useState } from "react";
import { addRecentlyViewed } from "../utils/recentlyViewed";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buildApiUrl, getProductById } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import WishlistButton from "../components/product/WishlistButton";
import ProductPriceDisplay from "../components/product/ProductPriceDisplay";
import { useCanViewProductPrice } from "../hooks/useCanViewProductPrice";
import {
  getAvailableColors,
  getBulkTierRows,
  getMinOrderQuantity,
  getMaxOrderQuantity,
  getCartAdjustStep,
  hasConfiguredMinOrderQuantity,
  hasConfiguredMaxOrderQuantity,
  hasConfiguredQuantityStep,
  getUnitPriceForQuantity,
  getVariantStock,
  getProductListPriceInfo,
  isBulkPricing,
  isMultiVariant,
} from "../utils/productPricing";
import {
  getDecreasedCartQuantityForProduct,
} from "../utils/cartDefaults";
import ProductImageFrame from "../components/product/ProductImageFrame";
import ProductVideo from "../components/product/ProductVideo";
import ProductDescriptionContent from "../components/product/ProductDescriptionContent";
import SimilarProducts from "../components/product/SimilarProducts";
import { normalizeProductImages } from "../utils/productImage";
import ProductShareMenu from "../components/product/ProductShareMenu";
import ProductAdminShareMenu from "../components/product/ProductAdminShareMenu";
import { updateProductShareMeta } from "../utils/productShare";
import { tryOpenProductInApp } from "../utils/openMobileApp";
import { getDummyProductById } from "../data/dummyCategoryProducts";

const DEFAULT_MOQ = 1;
const REVIEW_COUNT = 128;

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function productSku(product) {
  if (product.sku?.trim()) {
    return product.sku.trim().toUpperCase();
  }
  const code = (product.subcategory || product.brandName || "SKU")
    .replace(/\s+/g, "-")
    .toUpperCase();
  return `BMM-${code}`;
}

function ProductSkuRow({ product }) {
  const [copied, setCopied] = useState(false);
  const sku = productSku(product);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sku);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <p className="text-sm text-text-secondary">
        SKU: <span className="font-medium text-text-primary">{sku}</span>
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md border border-border-light px-2 py-0.5 text-xs font-medium text-text-secondary transition hover:border-primary/40 hover:text-primary"
        aria-label="Copy SKU"
      >
        {copied ? (
          "Copied"
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
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

function buildImageFilename(productName, imageUrl, imageIndex) {
  const ext = getImageExtension(imageUrl);
  const safeName = (productName || "product")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${safeName || "product"}-${imageIndex + 1}.${ext}`;
}

function getResolvedSpecifications(product) {
  if (Array.isArray(product?.specifications) && product.specifications.length > 0) {
    return product.specifications.filter((spec) => spec?.name && spec?.value);
  }

  const fallback = [];
  if (product?.brandName) fallback.push({ name: "Brand", value: product.brandName });
  if (product?.categories?.[0]) fallback.push({ name: "Category", value: product.categories[0] });
  if (product?.subcategory) fallback.push({ name: "Subcategory", value: product.subcategory });
  if (product?.warranty) fallback.push({ name: "Warranty", value: product.warranty });
  if (Array.isArray(product?.features)) {
    product.features.forEach((feature, index) => {
      if (feature?.trim()) {
        fallback.push({ name: `Feature ${index + 1}`, value: feature.trim() });
      }
    });
  }
  return fallback;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildProxyDownloadUrl(imageUrl, filename) {
  const params = new URLSearchParams({
    url: imageUrl,
    filename,
  });
  return buildApiUrl(`/api/proxy/image/download?${params.toString()}`);
}

function triggerBlobDownload(blob, filename, mimeType) {
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadProductImage(imageUrl, productName, imageIndex) {
  if (!imageUrl) return false;

  const filename = buildImageFilename(productName, imageUrl, imageIndex);
  const blob = await fetchImageBlob(imageUrl);

  if (!blob) {
    try {
      const response = await fetch(buildProxyDownloadUrl(imageUrl, filename));
      if (response.ok) {
        const fallbackBlob = await response.blob();
        triggerBlobDownload(
          fallbackBlob,
          filename,
          getMimeType(getImageExtension(imageUrl))
        );
        return true;
      }
    } catch {
      // fall through to direct navigation download
    }

    window.location.assign(buildProxyDownloadUrl(imageUrl, filename));
    return true;
  }

  const ext = getImageExtension(imageUrl);
  const mimeType = blob.type?.startsWith("image/") ? blob.type : getMimeType(ext);
  const file = new File([blob], filename, { type: mimeType });

  if (isMobileDevice() && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return false;
    }
  }

  if (isMobileDevice()) {
    window.location.assign(buildProxyDownloadUrl(imageUrl, filename));
    return true;
  }

  triggerBlobDownload(blob, filename, mimeType);
  return true;
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
    // fall through to direct fetch
  }

  try {
    const directResponse = await fetch(imageUrl);
    if (!directResponse.ok) return null;
    return await directResponse.blob();
  } catch {
    return null;
  }
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  );
}

function StarRating({ rating, reviewCount }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-primary" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= Math.floor(rating) ? "fill-current" : "fill-none"}`}
            viewBox="0 0 20 20"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.81.94-5.5-4-3.9 5.53-.8L10 1.5z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-text-secondary">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

function ProductImage({ src, alt }) {
  return (
    <ProductImageFrame
      src={src}
      alt={alt}
      fit="contain"
      className="max-h-[min(70vh,520px)]"
    />
  );
}

const TABS = [
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
  { id: "shipping", label: "Shipping & Delivery", shortLabel: "Shipping" },
];

function MediaThumbnailCarousel({ items, activeIndex, onSelect }) {
  if (items.length <= 1) return null;

  const canNext = activeIndex < items.length - 1;

  return (
    <div className="relative flex items-center gap-2">
      <div className="hide-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto py-0.5">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.url}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={
              item.type === "video"
                ? "View product video"
                : `View image ${index} of ${items.length}`
            }
            aria-current={activeIndex === index ? "true" : undefined}
            className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border bg-white ${
              activeIndex === index ? "border-[#0C831F]" : "border-[#E5E5E5]"
            }`}
          >
            {item.type === "video" ? (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            ) : (
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-contain p-1"
                loading="lazy"
              />
            )}
          </button>
        ))}
      </div>
      {canNext ? (
        <button
          type="button"
          onClick={() => onSelect(Math.min(items.length - 1, activeIndex + 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#1a1a1a] shadow-sm"
          aria-label="Next image"
        >
          ›
        </button>
      ) : null}
    </div>
  );
}

function WhyShopFromGreenGroo() {
  const points = [
    {
      title: "Round The Clock Delivery",
      text: "Get items delivered to your doorstep from stores near you, whenever you need them.",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7zm11 3h3l3 3v2h-6v-5z" />
        </svg>
      ),
    },
    {
      title: "Best Prices & Offers",
      text: "Best price destination with offers directly from trusted suppliers.",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7h5a3 3 0 010 6H8m0 0h6a3 3 0 010 6H8" />
        </svg>
      ),
    },
    {
      title: "Wide Assortment",
      text: "Choose from fresh fruits, veggies, dairy, organic staples and more.",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      ),
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-bold text-[#1a1a1a]">Why shop from GreenGroo?</h2>
      <ul className="mt-4 space-y-5">
        {points.map((point) => (
          <li key={point.title} className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F7F0D8] text-[#0C831F]">
              {point.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1a1a1a]">{point.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#666]">{point.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FarmerDetailsCard({ product }) {
  const images = normalizeProductImages(product?.productImages);
  
  const farmer = {
    name: product?.farmerName || product?.farmerDetails?.name || "Kiran Pawar",
    location: product?.farmerLocation || product?.farmerDetails?.location || "Niphad, NASHIK",
    farmerImage: product?.farmerImage || product?.farmerDetails?.farmerImage || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=600&q=80",
    farmImage: product?.farmImage || product?.farmerDetails?.farmImage || images[0] || "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=400&h=400&q=80",
    totalArea: product?.farmerDetails?.totalArea || "3",
    cultivationArea: product?.farmerDetails?.cultivationArea || "3",
    cropCycle: product?.farmerDetails?.cropCycle || product?.name?.split("-")[0]?.trim() || "Cauliflower",
    agricultureMethod: product?.farmerDetails?.agricultureMethod || "Modern and Traditional",
    lastCropTaken: product?.farmerDetails?.lastCropTaken || "Onion",
    currentCrop: product?.farmerDetails?.currentCrop || product?.name?.split("-")[0]?.trim() || "Cauliflower",
    waterSource: product?.farmerDetails?.waterSource || "Rivers, Well",
    soilType: product?.farmerDetails?.soilType || "Black soils",
    farmTools: product?.farmerDetails?.farmTools || "Tractor",
    harvestingDate: product?.harvestingDate || product?.farmerDetails?.harvestingDate || "Today (Fresh Morning Harvest)",
    bio: product?.farmerDetails?.bio || `Hello, my name is ${product?.farmerName || "Kiran Vitthal Pawar"}. I am a graduate and I have been actively involved in farming for the past 5 years in Niphad, Nashik. We cultivate fresh organic produce using modern and traditional sustainable farming techniques.`,
  };

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {product?.name} <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Traceable</span>
        </h3>
      </div>

      {/* 2 Photos side by side with overlay labels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs">
          <img
            src={farmer.farmerImage}
            alt={farmer.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=600&q=80";
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-slate-900/75 backdrop-blur-xs px-2 py-1 text-center text-[10px] sm:text-xs font-black text-white shadow-xs">
            👨‍🌾 Farmer Photo
          </div>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs">
          <img
            src={farmer.farmImage}
            alt={farmer.cropCycle}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=400&h=400&q=80";
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-slate-900/75 backdrop-blur-xs px-2 py-1 text-center text-[10px] sm:text-xs font-black text-white shadow-xs">
            🚜 Farm Land Photo
          </div>
        </div>
      </div>

      {/* Farmer Name & Location Row */}
      <div className="flex items-center justify-between pt-1">
        <h4 className="text-base sm:text-lg font-extrabold text-slate-900">{farmer.name}</h4>
        <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700">
          <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{farmer.location}</span>
        </div>
      </div>

      {/* Bulleted Details List */}
      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-800 font-medium pt-2 border-t border-slate-100">
        <li><span className="font-bold text-slate-900">• Total Area :</span> {farmer.totalArea}</li>
        <li><span className="font-bold text-slate-900">• Area Under Cultivation :</span> {farmer.cultivationArea}</li>
        <li><span className="font-bold text-slate-900">• Crop Cycle :</span> {farmer.cropCycle}</li>
        <li><span className="font-bold text-slate-900">• Agriculture Method :</span> {farmer.agricultureMethod}</li>
        <li><span className="font-bold text-slate-900">• Last Crop Taken :</span> {farmer.lastCropTaken}</li>
        <li><span className="font-bold text-slate-900">• Current Crop :</span> {farmer.currentCrop}</li>
        <li><span className="font-bold text-slate-900">• Water Source :</span> {farmer.waterSource}</li>
        <li><span className="font-bold text-slate-900">• Soil Type :</span> {farmer.soilType}</li>
        <li><span className="font-bold text-slate-900">• Farm Tools :</span> {farmer.farmTools}</li>
      </ul>

      {/* Bio / Story Paragraph */}
      <div className="pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>{farmer.bio}</p>
      </div>
    </section>
  );
}

function UnitOptionCard({ label, salePrice, originalPrice, selected, discountPct, onClick }) {
  const format = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-w-[104px] rounded-xl border px-3 py-2.5 text-left transition ${
        selected ? "border-[#0C831F] bg-[#F6FBF7]" : "border-[#E5E5E5] bg-white"
      }`}
    >
      {discountPct > 0 ? (
        <span className="absolute -top-2 left-2 rounded bg-[#2563EB] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {discountPct}% OFF
        </span>
      ) : null}
      <p className="text-[13px] font-semibold text-[#1a1a1a]">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold text-[#1a1a1a]">{format(salePrice)}</span>
        {originalPrice > salePrice ? (
          <span className="text-[12px] text-[#9CA3AF] line-through">{format(originalPrice)}</span>
        ) : null}
      </div>
    </button>
  );
}

function GalleryNavButton({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className="absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-white/95 text-lg text-text-secondary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      style={direction === "prev" ? { left: "0.5rem" } : { right: "0.5rem" }}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}

function QuantitySelector({ quantity, min, max, onDecrease, onIncrease, disabled }) {
  return (
    <div className="flex w-full items-center justify-between gap-2 py-1 sm:gap-3">
      <span className="shrink-0 text-xs font-semibold text-text-primary sm:text-sm">
        Quantity (Pieces)
      </span>
      <div className="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-border-light">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className="flex h-8 w-8 items-center justify-center border-r border-border-light bg-white text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="flex h-8 min-w-[2.25rem] items-center justify-center border-r border-border-light bg-white px-1.5 text-sm font-bold text-text-primary">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          className="flex h-8 w-8 items-center justify-center bg-white text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CartActionQuantity({ quantity, min, max, disabled, onDecrease, onIncrease }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 rounded-md border-2 border-primary bg-white px-4 py-2.5">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease cart quantity"
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-bold text-text-primary">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase cart quantity"
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function ProductDetailsSection({
  productType,
  detailsOpen,
  onToggleDetails,
  product,
  specifications,
  className = "",
}) {
  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-[#1a1a1a]">Product Details</h2>
      <div className="mt-3 space-y-2 text-[14px]">
        <p>
          <span className="font-semibold text-[#1a1a1a]">Type </span>
          <span className="text-[#666]">{productType}</span>
        </p>
        <p>
          <span className="font-semibold text-[#1a1a1a]">Harvesting Date: </span>
          <span className="font-bold text-[#0C831F]">
            {product?.harvestingDate || product?.farmerDetails?.harvestingDate || "Today (Fresh Morning Harvest)"}
          </span>
        </p>
        {detailsOpen ? (
          <div className="space-y-2 text-[#666]">
            <ProductDescriptionContent
              description={product.description}
              features={product.features}
              fallback={`Fresh ${product.name} from GreenGroo. Quality checked and ready for delivery.`}
            />
            {specifications.length > 0 ? (
              <ul className="space-y-1 pt-1">
                {specifications.map((spec, index) => (
                  <li key={`${spec.name}-${index}`}>
                    <span className="font-semibold text-[#1a1a1a]">{spec.name}: </span>
                    {spec.value}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleDetails}
          className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#0C831F]"
        >
          {detailsOpen ? "View less details" : "View more details"}
          <span className="text-xs">{detailsOpen ? "▴" : "▾"}</span>
        </button>
      </div>
    </section>
  );
}

function ActionButtons({
  inStock,
  inCart,
  cartQuantity,
  min,
  max,
  onAddToCart,
  onDecrease,
  onIncrease,
  product,
  shareImageUrl,
  className = "",
}) {
  return (
    <div className={className}>
      {inCart ? (
        <CartActionQuantity
          quantity={cartQuantity}
          min={min}
          max={max}
          disabled={!inStock}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
        />
      ) : (
        <button
          type="button"
          onClick={(e) => onAddToCart(e.currentTarget)}
          disabled={!inStock}
          className="flex-1 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
      )}
      <ProductAdminShareMenu
        className="flex-1 [&>button]:h-full [&>button]:w-full [&>button]:rounded-md [&>button]:border-2 [&>button]:border-primary [&>button]:bg-white [&>button]:px-6 [&>button]:py-3.5 [&>button]:text-sm [&>button]:font-bold [&>button]:text-primary [&>button]:transition hover:[&>button]:bg-primary/5"
        product={product}
        imageUrl={shareImageUrl}
      />
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items: cartItems, incrementCartItem, decrementCartItem } = useCart();
  const { openAuthModal } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMedia, setActiveMedia] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(DEFAULT_MOQ);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const canViewPrice = useCanViewProductPrice(product);

  useEffect(() => {
    if (!id || String(id).startsWith("dummy-")) return;
    tryOpenProductInApp(id);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const dummy = typeof getDummyProductById === "function" ? getDummyProductById(id) : null;
        let nextProduct = dummy;
        if (!nextProduct) {
          const res = await getProductById(id);
          nextProduct = res?.data?.data || res?.data;
        }

        if (!nextProduct || !nextProduct._id) {
          throw new Error("Product not found");
        }

        const initialVariant =
          nextProduct?.variantType === "multi"
            ? nextProduct.variants?.[0]?.name || ""
            : "";
        const initialColors = getAvailableColors(nextProduct, initialVariant);

        setProduct(nextProduct);
        setSelectedVariant(initialVariant);
        setSelectedColor(initialColors[0]?.name || "");
        setActiveMedia(0);
        setActiveTab("description");

        if (nextProduct?._id && !String(nextProduct._id).startsWith("dummy-")) {
          addRecentlyViewed(nextProduct._id);
        }
      } catch (err) {
        console.error("fetchProduct error:", err);
        setProduct(null);
        setSelectedVariant("");
        setSelectedColor("");
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleVariantChange = (variantName) => {
    setSelectedVariant(variantName);
    if (product) {
      const colors = getAvailableColors(product, variantName);
      setSelectedColor(colors[0]?.name || "");
    }
  };

  const images = useMemo(
    () => normalizeProductImages(product?.productImages),
    [product?.productImages]
  );

  const videoUrl = product?.videoUrl?.trim() || "";

  const galleryItems = useMemo(() => {
    const items = images.map((url) => ({ type: "image", url }));
    if (videoUrl) {
      items.push({ type: "video", url: videoUrl });
    }
    return items;
  }, [images, videoUrl]);

  useEffect(() => {
    setActiveMedia((prev) => {
      if (!galleryItems.length) return 0;
      return prev < galleryItems.length ? prev : 0;
    });
  }, [galleryItems]);

  const activeGalleryItem = galleryItems[activeMedia];
  const isVideoActive = activeGalleryItem?.type === "video";
  const imageOnlyIndex = activeMedia;

  const activeVariantName = product && isMultiVariant(product) ? selectedVariant : "";

  const shareUrl =
    typeof window !== "undefined" && product?._id
      ? `${window.location.origin}/product/${product._id}?openInApp=1`
      : "";

  const shareImageUrl = images[0] || "";
  const specifications = useMemo(() => getResolvedSpecifications(product), [product]);

  useEffect(() => {
    if (!product) return undefined;

    updateProductShareMeta({
      product,
      shareUrl,
      imageUrl: shareImageUrl,
      variantName: activeVariantName,
    });

    return () => {
      document.title = "GreenGrocc";
    };
  }, [product, shareUrl, shareImageUrl, activeVariantName]);

  const availableColors = useMemo(() => {
    if (!product) return [];
    return getAvailableColors(product, activeVariantName);
  }, [product, activeVariantName]);

  const bulkTiers = useMemo(() => {
    if (!product || !isBulkPricing(product, activeVariantName)) return [];
    return getBulkTierRows(product, activeVariantName);
  }, [product, activeVariantName]);

  const minOrderQuantity = product
    ? getMinOrderQuantity(product, activeVariantName, DEFAULT_MOQ)
    : DEFAULT_MOQ;
  const quantityStep = product
    ? getCartAdjustStep(product, activeVariantName, DEFAULT_MOQ)
    : DEFAULT_MOQ;
  const showMoq = product
    ? hasConfiguredMinOrderQuantity(product, activeVariantName)
    : false;
  const showStepByQty = product
    ? hasConfiguredQuantityStep(product, activeVariantName)
    : false;

  const getCartLine = () => {
    if (!product?._id) return null;
    return (
      cartItems.find(
        (item) =>
          item._id === product._id &&
          (item.variantName || "") === activeVariantName &&
          (item.colorName || "") === selectedColor
      ) || null
    );
  };

  const cartLineQuantity = useMemo(() => {
    if (!product?._id) return null;
    const line = cartItems.find(
      (item) =>
        item._id === product._id &&
        (item.variantName || "") === activeVariantName &&
        (item.colorName || "") === selectedColor
    );
    return line?.quantity ?? null;
  }, [cartItems, product?._id, activeVariantName, selectedColor]);

  useEffect(() => {
    if (!product) return;
    const moq = getMinOrderQuantity(product, activeVariantName, DEFAULT_MOQ);
    setQuantity(cartLineQuantity ?? moq);
  }, [product, activeVariantName, selectedColor, cartLineQuantity]);

  const currentUnitPrice = product
    ? getUnitPriceForQuantity(product, quantity, activeVariantName)
    : 0;

  const handleAddToCart = async (flySource) => {
    if (!product) return;
    if (availableColors.length > 0 && !selectedColor) return;

    const result = await addToCart(product, quantity, {
      variantName: activeVariantName,
      colorName: selectedColor,
      flySource,
    });
    if (result?.requiresLogin) {
      openAuthModal("login");
    }
  };

  const handleQuantityDecrease = async () => {
    if (!product) return;
    const line = getCartLine();
    const step = quantityStep;

    if (line) {
      await decrementCartItem({
        productId: product._id,
        variantName: activeVariantName,
        colorName: selectedColor,
        resolveNextQuantity: (currentQty) =>
          getDecreasedCartQuantityForProduct(product, currentQty, activeVariantName),
      });
      return;
    }

    setQuantity((prev) => Math.max(minOrderQuantity, prev - step));
  };

  const handleQuantityIncrease = async () => {
    if (!product) return;
    const line = getCartLine();
    const step = quantityStep;
    const variantStock = getVariantStock(product, activeVariantName);
    const maxOrderQty = getMaxOrderQuantity(product, activeVariantName, 50);
    const maxQty =
      variantStock > 0
        ? Math.min(variantStock, maxOrderQty)
        : minOrderQuantity;

    if (line) {
      await incrementCartItem({
        productId: product._id,
        variantName: activeVariantName,
        colorName: selectedColor,
        step,
        maxQuantity: maxQty,
      });
      return;
    }

    setQuantity((prev) => Math.min(maxQty, prev + step));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="animate-pulse">
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="h-96 rounded-2xl bg-slate-200" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-slate-200" />
                <div className="h-6 w-1/4 rounded bg-slate-200" />
                <div className="h-24 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-6 text-text-secondary">{error || "Product not found."}</p>
          <Link to="/product" className="text-sm font-medium text-primary hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const category = product.categories?.[0] || "Products";
  const variantStock = getVariantStock(product, activeVariantName);
  const inStock = variantStock > 0;
  const rating = product.ratings || 4.5;
  const maxOrderQty = getMaxOrderQuantity(product, activeVariantName, 50);
  const maxQuantity = inStock
    ? Math.min(variantStock, maxOrderQty)
    : minOrderQuantity;
  const unitLabel = product.sub || product.unit || product.weight || "1 pc";
  const priceInfo = getProductListPriceInfo(product, activeVariantName);

  const unitOptions = isMultiVariant(product)
    ? (product.variants || []).map((variant) => {
        const info = getProductListPriceInfo(product, variant.name);
        const discountPct =
          info.hasDiscount && info.originalPrice > 0
            ? Math.round(((info.originalPrice - info.salePrice) / info.originalPrice) * 100)
            : 0;
        return {
          key: variant.name,
          label: variant.name,
          salePrice: info.salePrice,
          originalPrice: info.originalPrice,
          discountPct,
          selected: selectedVariant === variant.name,
          onSelect: () => handleVariantChange(variant.name),
        };
      })
    : [
        {
          key: "default",
          label: unitLabel,
          salePrice: priceInfo.salePrice,
          originalPrice: priceInfo.originalPrice,
          discountPct:
            priceInfo.hasDiscount && priceInfo.originalPrice > 0
              ? Math.round(
                  ((priceInfo.originalPrice - priceInfo.salePrice) / priceInfo.originalPrice) * 100
                )
              : 0,
          selected: true,
          onSelect: () => {},
        },
      ];

  const productType =
    specifications.find((s) => /type|category/i.test(s.name))?.value ||
    product.subcategory ||
    category;

  return (
    <div className="min-h-screen bg-white pb-24 text-[#1a1a1a] lg:pb-10">
      {/* lg:pt accounts for TopNav (72) */}
      <div className="mx-auto w-full max-w-6xl px-0 pt-0 sm:px-5 lg:px-6 lg:pt-6">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-start lg:gap-10">
          {/* Left — scrolls with page through Product Details */}
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-none sm:rounded-2xl bg-white border-b border-slate-100 sm:border-none">
              <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) navigate(-1);
                    else navigate("/product");
                  }}
                  aria-label="Go back"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] bg-white/95 text-[#1a1a1a] shadow-sm transition hover:bg-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <WishlistButton product={product} size="md" />
                  <ProductShareMenu
                    className="[&_button]:bg-white/95"
                    product={product}
                    shareUrl={shareUrl}
                    imageUrl={shareImageUrl}
                    variantName={activeVariantName}
                  />
                </div>
              </div>
              <div className="flex w-full items-center justify-center bg-white">
                {isVideoActive ? (
                  <ProductVideo url={activeGalleryItem.url} embedded />
                ) : (
                  <ProductImage src={activeGalleryItem?.url} alt={product.name} />
                )}
              </div>
            </div>
            <div className="mt-3 px-4 sm:px-0">
              <MediaThumbnailCarousel
                items={galleryItems}
                activeIndex={activeMedia}
                onSelect={setActiveMedia}
              />
            </div>

            <ProductDetailsSection
              className="mt-8 hidden border-t border-[#F0F0F0] pt-6 lg:block lg:min-h-[55vh] lg:pb-16"
              productType={productType}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsOpen((v) => !v)}
              product={product}
              specifications={specifications}
            />

            <div className="hidden lg:block">
              <FarmerDetailsCard product={product} />
            </div>
          </div>

          {/* Right — sticks to top under header while left scrolls */}
          <aside className="min-w-0 bg-white px-4 sm:px-0 lg:sticky lg:top-[88px] lg:z-10 lg:self-start">
            <nav className="mb-2 flex flex-wrap items-center gap-1 text-[12px] text-[#757575]">
              <Link to="/" className="hover:text-[#0C831F]">
                Home
              </Link>
              <span>/</span>
              <Link
                to={`/product?categoryName=${encodeURIComponent(category)}`}
                className="hover:text-[#0C831F]"
              >
                {category}
              </Link>
              <span>/</span>
              <span className="line-clamp-1 text-[#1a1a1a]">{product.name}</span>
            </nav>

            <h1 className="text-[22px] font-bold leading-snug sm:text-[26px]">
              {product.name}
            </h1>
            {(() => {
              const raw =
                product.shortDescription ||
                product.description ||
                `Fresh ${product.name}${category ? ` from ${category}` : ""}.`;
              const short = String(raw)
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 120);
              if (!short) return null;
              return (
                <p className="mt-1.5 text-[13px] font-bold leading-snug text-[#1a1a1a] sm:text-[14px]">
                  {short}
                  {String(raw).replace(/<[^>]+>/g, "").trim().length > 120 ? "…" : ""}
                </p>
              );
            })()}

            {/* Farmer Quick Profile Card */}
            <div className="mt-3.5 flex items-center gap-3 rounded-2xl bg-emerald-50/80 p-2.5 sm:p-3 border border-emerald-200/60 shadow-xs">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-emerald-600 shadow-xs bg-slate-100">
                <img
                  src={product?.farmerImage || product?.farmerDetails?.farmerImage || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=600&q=80"}
                  alt={product?.farmerName || "Farmer"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=600&q=80";
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white font-black shadow-xs">
                  ✓
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-md">
                    👨‍🌾 Direct Farmer
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Harvested Fresh
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 leading-tight mt-0.5 truncate">
                  {product?.farmerName || product?.farmerDetails?.name || "Kiran Vitthal Pawar"}
                </h4>
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-0.5">
                  <span>📍 {product?.farmerLocation || product?.farmerDetails?.location || "Niphad, Nashik"}</span>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-[15px] font-semibold text-[#1a1a1a]">Select Unit</p>
              <div className="flex flex-wrap gap-2.5">
                {unitOptions.map((opt) => (
                  <UnitOptionCard
                    key={opt.key}
                    label={opt.label}
                    salePrice={opt.salePrice}
                    originalPrice={opt.originalPrice}
                    selected={opt.selected}
                    discountPct={opt.discountPct}
                    onClick={opt.onSelect}
                  />
                ))}
              </div>
            </div>

            {availableColors.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[15px] font-semibold">Select color</p>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isActive = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                          isActive
                            ? "border-[#0C831F] bg-[#F6FBF7] text-[#0C831F]"
                            : "border-[#E5E5E5] text-[#1a1a1a]"
                        }`}
                      >
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[#666]">{unitLabel}</p>
                {canViewPrice ? (
                  <>
                    <p className="mt-0.5 text-[28px] font-extrabold leading-none text-[#1a1a1a]">
                      {formatPrice(priceInfo.salePrice).replace(".00", "")}
                    </p>
                    <p className="mt-1 text-[12px] text-[#757575]">(Inclusive of all taxes)</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[#757575]">Login to view price</p>
                )}
              </div>

              {cartLineQuantity != null ? (
                <div className="w-[160px] shrink-0">
                  <CartActionQuantity
                    quantity={cartLineQuantity}
                    min={minOrderQuantity}
                    max={maxQuantity}
                    disabled={!inStock}
                    onDecrease={handleQuantityDecrease}
                    onIncrease={handleQuantityIncrease}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(e.currentTarget)}
                  disabled={!inStock}
                  className="h-12 min-w-[150px] shrink-0 rounded-xl bg-[#0C831F] px-6 text-[15px] font-bold text-white transition hover:bg-[#097019] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to cart
                </button>
              )}
            </div>

            {(showMoq || showStepByQty) && (
              <p className="mt-3 text-[12px] text-[#757575]">
                {[
                  showMoq ? `MOQ: ${minOrderQuantity}` : null,
                  showStepByQty ? `Step: ${quantityStep}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <ProductDetailsSection
              className="mt-8 border-t border-[#F0F0F0] pt-6 lg:hidden"
              productType={productType}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsOpen((v) => !v)}
              product={product}
              specifications={specifications}
            />

            <FarmerDetailsCard product={product} />

            <div className="mt-8 border-t border-[#F0F0F0] pt-6">
              <WhyShopFromGreenGroo />
            </div>
          </aside>
        </div>

        <div className="mt-8 grid grid-cols-6 border-t border-[#F0F0F0] pt-6">
          <SimilarProducts
            productId={product._id}
            categoryName={product.categories?.[0] || product.subcategory || ""}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
