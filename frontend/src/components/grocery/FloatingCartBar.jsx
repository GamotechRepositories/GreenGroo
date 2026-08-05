import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function FloatingCartBar() {
  const { items, cartCount } = useCart();

  if (cartCount === 0) return null;

  const thumbnails = items.slice(0, 3);

  return (
    <Link
      to="/cart"
      data-cart-target="floating"
      className="fixed bottom-[68px] left-4 right-4 z-40 lg:hidden"
    >
      <div className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 shadow-xl shadow-primary/30">
        <div className="flex -space-x-2">
          {thumbnails.map((item) => {
            const thumb = item.productImages?.[0];
            return (
            <div
              key={`${item._id}-${item.variantName}`}
              className="h-9 w-9 overflow-hidden rounded-lg border-2 border-primary bg-white"
            >
              {thumb ? (
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-light text-xs">
                  🛒
                </div>
              )}
            </div>
            );
          })}
        </div>

        <span className="flex-1 text-sm font-bold text-white">
          View cart&nbsp;|&nbsp;{cartCount} {cartCount === 1 ? "item" : "items"}
        </span>

        <svg className="h-5 w-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default FloatingCartBar;
