import { useState } from "react";
import { Link } from "react-router-dom";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import ProductImageFrame from "./ProductImageFrame";
import ProductPriceDisplay from "./ProductPriceDisplay";
import MobileVariantPickerSheet from "./MobileVariantPickerSheet";
import { getTotalProductStock, isMultiVariant } from "../../utils/productPricing";

function DealProductCard({
  product,
  onAdd,
  onIncrease,
  onDecrease,
  cartQuantity = 0,
  layout = "scroll",
  addDisabled = false,
}) {
  const image = product.productImages?.[0];
  const multiVariant = isMultiVariant(product);
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const inStock = getTotalProductStock(product) > 0;
  const disabled = addDisabled || !inStock;

  const layoutClass =
    layout === "scroll" ? "w-[150px] shrink-0 snap-start sm:w-[165px]" : "w-full";

  const productUrl =
    product._id?.length > 10 ? `/product/${product._id}` : "/product";

  const handleDirectAdd = (event) => {
    (onIncrease ?? onAdd)?.(product, event.currentTarget);
  };

  const openVariantSheet = () => {
    if (disabled) return;
    setVariantSheetOpen(true);
  };

  const mobileMultiVariantStepper = (
    <div className="mt-1.5 inline-flex w-full items-center overflow-hidden rounded-lg border border-border-light bg-white">
      <button
        type="button"
        onClick={openVariantSheet}
        className="flex h-8 w-9 items-center justify-center text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary sm:h-9 sm:w-10"
        aria-label="Choose variant to decrease"
      >
        −
      </button>
      <button
        type="button"
        onClick={openVariantSheet}
        className="flex h-8 flex-1 items-center justify-center border-x border-border-light text-sm font-bold text-text-primary sm:h-9"
        aria-label="View variants in cart"
      >
        {cartQuantity}
      </button>
      <button
        type="button"
        onClick={openVariantSheet}
        disabled={disabled}
        className="flex h-8 w-9 items-center justify-center text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-10"
        aria-label="Choose variant to increase"
      >
        +
      </button>
    </div>
  );

  const quantityStepper = (
    <div className="inline-flex h-9 w-full items-stretch overflow-hidden rounded-lg border border-border-light bg-white">
      <button
        type="button"
        onClick={() => onDecrease?.(product)}
        className="flex h-full w-9 shrink-0 items-center justify-center text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary sm:w-10"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex h-full min-w-0 flex-1 items-center justify-center border-x border-border-light text-sm font-bold text-text-primary">
        {cartQuantity}
      </span>
      <button
        type="button"
        onClick={() => onIncrease?.(product)}
        disabled={disabled}
        className="flex h-full w-9 shrink-0 items-center justify-center text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:w-10"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border-light bg-white transition ${layoutClass}`}
    >
      <div className="relative">
        <div className="absolute right-1.5 top-1.5 z-10">
          <WishlistButton product={product} className="!border-0" />
        </div>
        <Link to={productUrl} className="block">
          <ProductImageFrame src={image} alt={product.name} />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-2.5">
        <Link to={productUrl} className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-bold leading-tight text-text-primary sm:text-base"
            title={product.name}
          >
            {product.name}
          </h3>
          <ProductPriceDisplay product={product} size="sm" className="mt-1" />
        </Link>

        <div className="mt-auto pt-1.5">
          <div className="lg:hidden">
            {multiVariant ? (
              cartQuantity > 0 ? (
                mobileMultiVariantStepper
              ) : (
                <AddToCartButton
                  onClick={openVariantSheet}
                  disabled={disabled}
                  className="w-full"
                />
              )
            ) : cartQuantity > 0 ? (
              quantityStepper
            ) : (
              <AddToCartButton
                onClick={handleDirectAdd}
                disabled={disabled}
                className="w-full"
              />
            )}
          </div>

          <div className="hidden lg:block">
            {cartQuantity > 0 ? (
              quantityStepper
            ) : (
              <AddToCartButton
                onClick={handleDirectAdd}
                disabled={disabled}
                className="w-full"
              />
            )}
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

export default DealProductCard;
