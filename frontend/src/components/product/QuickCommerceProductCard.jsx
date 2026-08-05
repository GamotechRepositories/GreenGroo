import { useState } from "react";
import { Link } from "react-router-dom";
import WishlistButton from "./WishlistButton";
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
  return "1 pc";
}

function QuickCommerceProductCard({
  product,
  onAdd,
  onIncrease,
  onDecrease,
  cartQuantity = 0,
}) {
  const image = product.productImages?.[0];
  const multiVariant = isMultiVariant(product);
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const inStock = getTotalProductStock(product) > 0;
  const disabled = !inStock;

  const { originalPrice, salePrice, hasDiscount } = getProductListPriceInfo(product);
  const discountPct =
    hasDiscount && originalPrice > 0
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;
  const discountAmt = hasDiscount ? originalPrice - salePrice : 0;

  const productUrl =
    product._id?.length > 10 ? `/product/${product._id}` : "/product";

  const handleAdd = (e) => {
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
      className="w-full rounded-lg border border-primary bg-white py-1.5 text-xs font-extrabold uppercase tracking-wide text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      Add
    </button>
  );

  const stepper = (
    <div className="flex w-full overflow-hidden rounded-lg border border-primary bg-primary text-white">
      <button
        type="button"
        onClick={() => (multiVariant ? setVariantSheetOpen(true) : onDecrease?.(product))}
        className="flex h-8 w-8 items-center justify-center text-lg font-bold"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="flex flex-1 items-center justify-center text-sm font-bold">{cartQuantity}</span>
      <button
        type="button"
        onClick={() => (multiVariant ? setVariantSheetOpen(true) : onIncrease?.(product))}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center text-lg font-bold disabled:opacity-50"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );

  return (
    <div className="w-[128px] shrink-0 snap-start sm:w-[140px]">
      <div className="relative overflow-hidden rounded-xl bg-[#f5f5f5]">
        <div className="absolute right-1 top-1 z-10">
          <WishlistButton product={product} className="!h-7 !w-7 !border-0 !bg-white/90 !shadow-sm" />
        </div>

        <Link to={productUrl} className="block px-2 pt-3">
          <ProductImageFrame
            src={image}
            alt={product.name}
            fit="contain"
            className="!aspect-square !bg-transparent"
          />
        </Link>

        <p className="px-2 pb-1 text-[10px] font-medium text-text-muted">{getProductUnit(product)}</p>

        <div className="px-2 pb-2">{cartQuantity > 0 ? stepper : addButton}</div>
      </div>

      <div className="mt-2 px-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span className="text-sm font-extrabold text-text-primary">{formatPrice(salePrice)}</span>
          {hasDiscount ? (
            <span className="text-[11px] text-text-muted line-through">{formatPrice(originalPrice)}</span>
          ) : null}
        </div>
        {hasDiscount ? (
          <p className="mt-0.5 text-[10px] font-semibold text-blue-600">
            {discountPct > 0 ? `${discountPct}% OFF` : `${formatPrice(discountAmt)} OFF`}
          </p>
        ) : null}
        <Link to={productUrl}>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-text-primary">
            {product.name}
          </p>
        </Link>
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
