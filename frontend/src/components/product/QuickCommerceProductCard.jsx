import { useState } from "react";
import { Link } from "react-router-dom";
import ProductImageFrame from "./ProductImageFrame";
import MobileVariantPickerSheet from "./MobileVariantPickerSheet";
import {
  getProductListPriceInfo,
  getTotalProductStock,
  isMultiVariant,
} from "../../utils/productPricing";

const ADD_PINK = "#C2185B";
const PRICE_GREEN = "#2E7D32";
const OFF_GREEN = "#2E7D32";

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

function getRating(product) {
  const rating = Number(product?.ratings ?? product?.rating ?? 0);
  if (rating > 0) return rating;
  return 4.5;
}

function getReviewCount(product) {
  const count = product?.reviewCount ?? product?.reviewsCount ?? product?.numReviews;
  if (count != null && Number(count) > 0) {
    const n = Number(count);
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }
  return "1.2k";
}

function StarIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

/**
 * Blinkit-exact product card layout.
 * Image + ADD → green price + MRP → ₹OFF → dashed → name → unit → rating
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
  const discountAmt = hasDiscount ? Math.round(originalPrice - salePrice) : 0;
  const unit = getProductUnit(product);
  const rating = getRating(product);
  const reviewCount = getReviewCount(product);

  const productUrl =
    product._id?.length > 10 ? `/product/${product._id}` : "/product";

  const isGrid = layout === "grid";
  // Mobile: 3 full + ~1/4 of 4th peeking
  // 100vw − section px-4 (2rem) − 3×gap-3 (2.25rem) ÷ 3.25
  const widthClass = isGrid
    ? "w-full"
    : "w-[calc((100vw-2rem-2.25rem)/3.25)] shrink-0 snap-start";

  const handleAdd = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (multiVariant) {
      setVariantSheetOpen(true);
      return;
    }
    (onIncrease ?? onAdd)?.(product, e?.currentTarget);
  };

  const addButton = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className="absolute bottom-2 right-2 z-10 flex h-[30px] min-w-[54px] items-center justify-center rounded-lg border-[1.5px] bg-gradient-to-b from-white to-[#FFF0F5] px-3 text-[12px] font-extrabold uppercase tracking-wide transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: ADD_PINK,
        color: ADD_PINK,
        boxShadow: `2px 2px 0 0 ${ADD_PINK}`,
      }}
    >
      ADD
    </button>
  );

  const stepper = (
    <div
      className="absolute bottom-2 right-2 z-10 flex h-[30px] min-w-[76px] items-stretch overflow-hidden rounded-lg transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      style={{
        backgroundColor: ADD_PINK,
        boxShadow: `2px 2px 0 0 #9A1248`,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          multiVariant ? setVariantSheetOpen(true) : onDecrease?.(product);
        }}
        className="flex w-7 items-center justify-center text-base font-bold leading-none text-white"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="flex min-w-[22px] flex-1 items-center justify-center text-[12px] font-bold text-white">
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
        className="flex w-7 items-center justify-center text-base font-bold leading-none text-white disabled:opacity-50"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );

  return (
    <div className={widthClass}>
      <div className="flex h-full flex-col bg-white">
        {/* 1. Image + pink ADD */}
        <div className="relative overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
          <Link to={productUrl} className="block">
            <ProductImageFrame
              src={image}
              fallbackSrc={fallbackImage}
              alt={product.name}
              fit="cover"
              className="!aspect-square !bg-white"
            />
          </Link>
          {cartQuantity > 0 ? stepper : addButton}
        </div>

        {/* 2. Price badge + MRP */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-md bg-gradient-to-br from-[#43A047] to-[#2E7D32] px-2 py-1 text-[15px] font-extrabold leading-none text-white"
            style={{
              boxShadow: "2px 2px 0 0 #1B5E20",
            }}
          >
            {formatPrice(salePrice)}
          </span>
          {hasDiscount ? (
            <span className="text-[15px] font-medium text-[#9CA3AF] line-through">
              {formatPrice(originalPrice)}
            </span>
          ) : null}
        </div>

        {/* 3. ₹X OFF ———— (same row as 2nd image) */}
        {hasDiscount && discountAmt > 0 ? (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span
              className="shrink-0 text-[12px] font-bold leading-none"
              style={{ color: OFF_GREEN }}
            >
              {formatPrice(discountAmt)} OFF
            </span>
            <span
              className="h-0 min-w-0 flex-1 border-t border-dashed border-[#D1D5DB]"
              aria-hidden
            />
          </div>
        ) : (
          <div className="mt-1 h-3" aria-hidden />
        )}

        <div className="mt-2" />

        {/* 5. Name */}
        <Link to={productUrl} className="block min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.35] text-[#1C1C1C]">
            {product.name}
          </h3>
        </Link>

        {/* 6. Quantity */}
        <p className="mt-1 text-[12px] font-normal leading-tight text-[#757575]">
          {unit}
        </p>

        {/* 7. Rating */}
        <div className="mt-1.5 flex items-center gap-0.5">
          <span style={{ color: PRICE_GREEN }}>
            <StarIcon className="h-3 w-3" />
          </span>
          <span
            className="text-[12px] font-bold leading-none"
            style={{ color: PRICE_GREEN }}
          >
            {rating.toFixed(1)}
          </span>
          <span className="text-[11px] font-medium leading-none text-[#9CA3AF]">
            ({reviewCount})
          </span>
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
