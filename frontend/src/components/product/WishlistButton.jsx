import { useWishlist } from "../../context/WishlistContext";

function HeartIcon({ filled }) {
  if (filled) {
    return (
      <svg className="h-4 w-4 sm:h-[18px] sm:w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4 sm:h-[18px] sm:w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function WishlistButton({ product, className = "", size = "sm" }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(product?._id);

  const sizeClass =
    size === "md"
      ? "h-9 w-9"
      : "h-7 w-7 sm:h-8 sm:w-8";

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product, { flySource: e.currentTarget });
  };

  if (!product?._id || product._id.length < 10) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`flex items-center justify-center rounded-full border border-primary/40 bg-white/95 text-primary transition hover:border-primary-dark hover:text-primary-dark ${sizeClass} ${
        active ? "border-primary bg-primary/5" : ""
      } ${className}`}
    >
      <HeartIcon filled={active} />
    </button>
  );
}

export default WishlistButton;
