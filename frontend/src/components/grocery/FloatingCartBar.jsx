import { useCart } from "../../context/CartContext";
import { useScrollDirection } from "../../hooks/useScrollDirection";

/** Must match BottomNav visual height (icons + labels + padding). */
export const BOTTOM_NAV_HEIGHT_PX = 72;
const CART_GAP_PX = 10;

function FloatingCartBar() {
  const { items, cartCount, openCartSidebar } = useCart();
  const bottomNavHidden = useScrollDirection();

  // Keep an invisible target so fly-to-cart animation works on first ADD
  if (cartCount === 0) {
    return (
      <div
        data-cart-target="floating"
        className="pointer-events-none fixed left-1/2 z-[55] h-8 w-[160px] -translate-x-1/2 opacity-0 lg:hidden"
        style={{
          bottom: `calc(${BOTTOM_NAV_HEIGHT_PX + CART_GAP_PX}px + env(safe-area-inset-bottom, 0px))`,
        }}
        aria-hidden="true"
      />
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(subtotal);

  // Sit above bottom nav when it is visible; drop near screen edge when nav is hidden.
  const bottomPosition = bottomNavHidden
    ? `calc(${CART_GAP_PX}px + env(safe-area-inset-bottom, 0px))`
    : `calc(${BOTTOM_NAV_HEIGHT_PX + CART_GAP_PX}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <button
      type="button"
      onClick={openCartSidebar}
      data-cart-target="floating"
      className="fixed left-3 right-3 z-[55] block transition-all duration-300 ease-in-out lg:hidden"
      style={{ bottom: bottomPosition }}
    >
      <div className="flex items-center justify-between rounded-2xl bg-[#0C831F] px-3 py-2.5 shadow-[0_4px_20px_rgba(12,131,31,0.35)]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-white/20 px-1.5 text-[11px] font-extrabold text-white">
            {cartCount}
          </span>
          <div className="leading-none">
            <span className="text-[13px] font-bold text-white">{formattedTotal}</span>
            <span className="ml-1 text-[10px] font-medium text-white/70">
              plus taxes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-white">
          <span className="text-[13px] font-bold">View Cart</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export default FloatingCartBar;
