import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const CART_GREEN = "#0C831F";

function FloatingCartBar() {
  const { items, cartCount } = useCart();

  // Always keep a visible-size target so fly-to-cart works on first ADD
  if (cartCount === 0) {
    return (
      <div
        data-cart-target="floating"
        className="pointer-events-none fixed bottom-[72px] left-1/2 z-40 h-11 w-[200px] -translate-x-1/2 opacity-0 lg:hidden"
        aria-hidden="true"
      />
    );
  }

  const thumbnails = items.slice(0, 5);

  return (
    <Link
      to="/cart"
      data-cart-target="floating"
      className="fixed bottom-[72px] left-1/2 z-40 w-auto max-w-[min(260px,calc(100%-4rem))] -translate-x-1/2 lg:hidden"
    >
      <div
        className="flex items-center gap-2 rounded-full px-2.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: CART_GREEN }}
      >
        <div className="flex shrink-0 items-center pl-0.5">
          {thumbnails.map((item, index) => {
            const thumb = item.productImages?.[0];
            return (
              <div
                key={`${item._id}-${item.variantName}-${index}`}
                className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white"
                style={{
                  marginLeft: index === 0 ? 0 : -18,
                  zIndex: index + 1,
                }}
              >
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E8F5E9] text-[9px] font-bold text-[#0C831F]">
                    {(item.name || "?").charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="shrink-0 leading-tight">
          <p className="whitespace-nowrap text-[13px] font-bold text-white">View cart</p>
          <p className="whitespace-nowrap text-[11px] font-medium text-white/90">
            {cartCount} {cartCount === 1 ? "Item" : "Items"}
          </p>
        </div>

        <svg
          className="mr-0.5 h-4 w-4 shrink-0 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default FloatingCartBar;
