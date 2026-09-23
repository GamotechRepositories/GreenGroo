import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { useSectionsQuery } from "../../hooks/queries/useSectionsQuery";
import { sectionToStoreKey } from "../../utils/storeSection";
import { resolveStoreTheme } from "./homeHeaderThemes";

/** Must match `--gg-bottom-nav-h` (BottomNav content row + border). */
export const BOTTOM_NAV_HEIGHT_PX = 65;
const CART_GAP_PX = 10;

function activeStoreKey(pathname, storeParam) {
  const fromQuery = sectionToStoreKey(storeParam);
  if (storeParam) return fromQuery;
  const path = String(pathname || "").toLowerCase();
  if (path.startsWith("/ready2cook")) return "festive";
  if (path.startsWith("/super-mall")) return "mall";
  return "main";
}

function isLightHex(hex) {
  const raw = String(hex || "").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

function colorForStore(sections, storeKey) {
  const match = (sections || []).find(
    (sec) => sectionToStoreKey(sec.slug || sec.storeType) === storeKey
  );
  const fromSection = String(match?.color || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fromSection)) return fromSection;
  return resolveStoreTheme(storeKey).accent;
}

function FloatingCartBar() {
  const { items, cartCount, openCartSidebar } = useCart();
  const bottomNavHidden = useScrollDirection();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { data: sections = [] } = useSectionsQuery();
  const storeParam = searchParams.get("store");

  const sectionColor = useMemo(
    () => colorForStore(sections, activeStoreKey(pathname, storeParam)),
    [sections, pathname, storeParam]
  );
  const onLight = isLightHex(sectionColor);

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

  // Anchored above the nav. Slide down by the nav height when it hides
  // so both bars travel the same distance on a transform (not layout `bottom`).
  const restBottom = `calc(${BOTTOM_NAV_HEIGHT_PX + CART_GAP_PX}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <button
      type="button"
      onClick={openCartSidebar}
      data-cart-target="floating"
      className="gg-bar-slide fixed left-3 right-3 z-[55] block lg:hidden"
      style={{
        bottom: restBottom,
        transform: bottomNavHidden
          ? `translate3d(0, ${BOTTOM_NAV_HEIGHT_PX}px, 0)`
          : "translate3d(0, 0, 0)",
      }}
    >
      <div
        className="flex items-center justify-between rounded-2xl px-3 py-2.5 transition-colors duration-300"
        style={{
          backgroundColor: sectionColor,
          color: onLight ? "#422006" : "#ffffff",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-md px-1.5 text-[11px] font-extrabold ${
              onLight ? "bg-black/10" : "bg-white/20"
            }`}
          >
            {cartCount}
          </span>
          <div className="leading-none">
            <span className="text-[13px] font-bold">{formattedTotal}</span>
            <span className="ml-1 text-[10px] font-medium opacity-70">
              plus taxes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
