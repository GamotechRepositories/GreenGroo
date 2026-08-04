export default function AddedToCartToast({
  visible,
  productImage,
  leaving = false,
  message = "Added to Cart",
}) {
  if (!visible) return null;

  return (
    <div
      className="added-to-cart-toast pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-[18vh] sm:pt-[22vh]"
      role="status"
      aria-live="polite"
    >
      <div
        className={`added-to-cart-toast-box pointer-events-none flex items-center gap-3 rounded-xl bg-black px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)]${leaving ? " is-leaving" : ""}`}
      >
        {productImage ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img src={productImage} alt="" className="h-full w-full object-contain p-1" />
          </div>
        ) : null}

        <p className="text-sm font-bold text-white">{message}</p>
      </div>
    </div>
  );
}
