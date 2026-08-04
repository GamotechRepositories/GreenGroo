function CartIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

function AddToCartButton({ onClick, disabled, className = "", variant = "solid" }) {
  const isOutline = variant === "outline";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2.5 text-[10px] font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px] ${
        isOutline
          ? "border border-primary bg-white text-primary hover:bg-orange-50"
          : "bg-primary text-white hover:brightness-110"
      } ${className}`}
    >
      {!isOutline ? <CartIcon /> : null}
      <span>Add to Cart</span>
    </button>
  );
}

export default AddToCartButton;
