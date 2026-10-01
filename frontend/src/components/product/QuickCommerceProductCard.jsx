import { useState } from "react";
import { Link } from "react-router-dom";
import ProductImageFrame from "./ProductImageFrame";
import MobileVariantPickerSheet from "./MobileVariantPickerSheet";

import {
  getProductListPriceInfo,
  getTotalProductStock,
  isMultiVariant,
} from "../../utils/productPricing";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function getProductUnit(product) {
  if (product?.variants?.[0]?.name) return product.variants[0].name;
  if (product?.sub) return product.sub;
  if (product?.unit) return product.unit;
  if (product?.weight) return product.weight;
  return "1 pc";
}

function getDeliveryTime(product) {
  if (product?.deliveryTime) return product.deliveryTime;
  if (product?.eta) return product.eta;
  if (product?.deliveryMinutes) return `${product.deliveryMinutes} MINS`;
  if (product?.deliveryWindow) return product.deliveryWindow;
  return "10 MINS";
}

function getRating(product) {
  const rating = Number(product?.ratings ?? product?.rating ?? 0);
  if (rating > 0) return rating;
  return 0;
}

function getReviewCount(product) {
  const count = product?.reviewCount ?? product?.reviewsCount ?? product?.numReviews;
  if (count != null && Number(count) > 0) {
    const n = Number(count);
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }
  return "";
}

function StarIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

function ClockIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/**
 * Blinkit-exact product card layout.
 * Border box is ONLY on the product image container.
 * Details (delivery time, title, unit, price & ADD button) are laid out directly underneath without an outer border.
 */
function QuickCommerceProductCard({
  product,
  onAdd,
  onIncrease,
  onDecrease,
  cartQuantity = 0,
  layout = "scroll",
}) {
  const image = product.productImages?.[0];
  const fallbackImage = product.productImages?.[1] || "";
  const multiVariant = isMultiVariant(product);
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const inStock = getTotalProductStock(product) > 0;
  const disabled = !inStock;

  const { originalPrice, salePrice, hasDiscount } = getProductListPriceInfo(product);
  const discountPercent = hasDiscount && originalPrice > 0 
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : (product.discountedPercent || 0);

  const unit = getProductUnit(product);
  const deliveryTime = getDeliveryTime(product);
  const rating = getRating(product);
  const reviewCount = getReviewCount(product);

  const productUrl = product._id
    ? `/product/${encodeURIComponent(product._id)}`
    : "/product";

  const isGrid = layout === "grid";
  const widthClass = isGrid
    ? "w-full h-full"
    : "w-[calc((100vw-2rem-2.25rem)/3.25)] shrink-0 snap-start";

  const handleAdd = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (disabled) return;
    if (multiVariant) {
      setVariantSheetOpen(true);
      return;
    }
    const flySource = e?.currentTarget;
    onAdd?.(product, flySource);
  };

  const rawGlow = product.cardGlowColor || product.glowColor || '';
  const glowColor = rawGlow ? (String(rawGlow).trim().startsWith('#') ? String(rawGlow).trim() : `#${String(rawGlow).trim()}`) : '';
  const hasGlow = Boolean(glowColor);
  const glowBg = hasGlow ? (glowColor.length === 7 ? `${glowColor}10` : glowColor) : undefined;
  const glowBorder = hasGlow ? (glowColor.length === 7 ? `${glowColor}40` : glowColor) : undefined;

  return (
    <div className={widthClass}>
      <div className="relative flex h-full flex-col justify-between bg-transparent">
        {/* Product Image Container ONLY has the border box & background */}
        <div
          className="relative w-full overflow-hidden rounded-xl border border-gray-200/90 bg-white transition duration-200"
          style={{
            backgroundColor: glowBg || '#ffffff',
            borderColor: glowBorder || '#E5E7EB',
          }}
        >
          <Link to={productUrl} className="block w-full">
            <ProductImageFrame
              src={image}
              fallbackSrc={fallbackImage}
              alt={product.name}
              fit="contain"
              className={`!aspect-square w-full !bg-transparent p-2 ${disabled ? "opacity-50" : ""}`}
            />
          </Link>

          {/* Out of Stock Overlay */}
          {disabled ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-[10px] font-extrabold uppercase tracking-wider text-gray-700">
              Out of stock
            </span>
          ) : null}

          {/* Blue Discount Ribbon Badge (Top Left inside Image Box) */}
          {hasDiscount && discountPercent > 0 ? (
            <div 
              className="absolute top-0 left-0 z-10 flex flex-col items-center justify-center bg-[#2874F0] text-white px-1.5 py-1 rounded-br-lg rounded-tl-xl leading-none"
            >
              <span className="text-[10px] sm:text-[11px] font-black tracking-tight">{discountPercent}%</span>
              <span className="text-[8px] sm:text-[9px] font-black mt-0.5">OFF</span>
            </div>
          ) : product.badge ? (
            <span
              className="absolute top-0 left-0 z-10 px-1.5 py-0.5 rounded-br-lg rounded-tl-xl text-[9px] font-extrabold text-white tracking-wide uppercase"
              style={{ backgroundColor: glowColor || '#10B981' }}
            >
              {product.badge}
            </span>
          ) : null}
        </div>

        {/* Details Section below Image Box (No outer border box) */}
        <div className="mt-1.5 flex flex-1 flex-col justify-between min-w-0">
          <Link to={productUrl} className="flex flex-col min-w-0">
            {/* Delivery Time Badge (e.g. ⏱ 10 MINS) */}
            <div className="flex items-center gap-1 text-[#363636]">
              <ClockIcon className="h-2.5 w-2.5 shrink-0 text-gray-700" />
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight">
                {deliveryTime}
              </span>
            </div>

            {/* Product Name */}
            <h3 className="mt-1 line-clamp-2 text-[12px] sm:text-[13px] font-bold leading-tight text-[#1C1C1C]">
              {product.name}
            </h3>

            {/* Quantity / Unit */}
            <p className="mt-0.5 text-[11px] font-normal leading-tight text-[#757575]">
              {unit}
            </p>

            {/* Rating (if available) */}
            {rating > 0 ? (
              <div className="mt-1 flex items-center gap-0.5 text-[#0C831F]">
                <StarIcon className="h-3 w-3" />
                <span className="text-[11px] font-bold leading-none">{rating.toFixed(1)}</span>
                {reviewCount ? (
                  <span className="text-[10px] font-medium text-gray-400">({reviewCount})</span>
                ) : null}
              </div>
            ) : null}
          </Link>

          {/* Bottom Row: Price & ADD Button */}
          <div className="mt-2.5 flex items-end justify-between gap-1">
            {/* Left: Price Block */}
            <div className="flex flex-col justify-end min-w-0">
              <span className="text-[13px] sm:text-[14px] font-black text-[#1C1C1C] leading-none">
                {formatPrice(salePrice)}
              </span>
              {hasDiscount ? (
                <span className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-gray-400 line-through leading-none">
                  {formatPrice(originalPrice)}
                </span>
              ) : null}
            </div>

            {/* Right: ADD Button / Stepper */}
            <div className="shrink-0">
              {cartQuantity > 0 && !disabled ? (
                <div className="flex h-[30px] min-w-[62px] sm:min-w-[68px] items-center justify-between rounded-lg bg-[#0C831F] text-white px-1 shadow-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      multiVariant ? setVariantSheetOpen(true) : onDecrease?.(product);
                    }}
                    className="w-5 h-full flex items-center justify-center text-sm font-black leading-none text-white hover:opacity-80 active:scale-90"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="text-[11px] sm:text-[12px] font-bold text-white px-1">
                    {cartQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      multiVariant
                        ? setVariantSheetOpen(true)
                        : onIncrease?.(product, e.currentTarget);
                    }}
                    disabled={disabled}
                    className="w-5 h-full flex items-center justify-center text-sm font-black leading-none text-white hover:opacity-80 active:scale-90 disabled:opacity-50"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={disabled}
                  className="flex h-[30px] min-w-[54px] sm:min-w-[60px] items-center justify-center rounded-lg border border-[#0C831F] bg-white px-2.5 text-[11px] sm:text-[12px] font-black uppercase text-[#0C831F] hover:bg-[#0C831F]/5 active:scale-95 transition disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  ADD
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {multiVariant ? (
        <MobileVariantPickerSheet
          product={product}
          open={variantSheetOpen}
          onClose={() => setVariantSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default QuickCommerceProductCard;
