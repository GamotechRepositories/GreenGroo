import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { useStoreSettingsQuery } from "../../hooks/queries/useStoreSettingsQuery";
import { useAvailableCouponsQuery } from "../../hooks/queries/useAvailableCouponsQuery";
import {
  getMinimumOrderShortfall,
  mergeStoreSettings,
  nextCheaperShippingSlab,
} from "../../utils/orderSettings";

/** Must match `--gg-bottom-nav-h` (BottomNav content row + border). */
export const BOTTOM_NAV_HEIGHT_PX = 65;
/** Bar height including the "Offers" tab on its top edge. */
export const FLOATING_CART_BAR_HEIGHT_PX = 86;
const CART_GAP_PX = 10;

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function formatCouponOff(coupon) {
  const value = Number(coupon.discountValue) || 0;
  if (coupon.discountType === "percentage") {
    return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
  }
  return formatPrice(value);
}

/**
 * Offer nudge for the cart: nearest coupon to unlock, else an unlocked coupon,
 * else a cheaper delivery slab, else the minimum order.
 */
function buildNudge(subtotal, coupons, settings) {
  const usable = (coupons || []).filter((c) => !String(c.redemptionBlocked || "").trim());

  const locked = usable
    .filter((c) => !c.unlocked && Number(c.amountNeeded) > 0)
    .sort((a, b) => a.amountNeeded - b.amountNeeded);
  if (locked.length) {
    const coupon = locked[0];
    return {
      title: `Unlock extra ${formatCouponOff(coupon)} OFF`,
      prefix: "Shop for ",
      amount: formatPrice(coupon.amountNeeded),
      suffix: " more",
      progress: subtotal / (subtotal + Number(coupon.amountNeeded)),
    };
  }

  const unlocked = usable
    .filter((c) => c.unlocked && Number(c.discountAmount) > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount);
  if (unlocked.length) {
    const coupon = unlocked[0];
    return {
      title: `${formatPrice(coupon.discountAmount)} OFF unlocked!`,
      prefix: "Use code ",
      amount: coupon.code,
      suffix: " at checkout",
      progress: 1,
    };
  }

  if (settings) {
    const slab = nextCheaperShippingSlab(subtotal, settings);
    if (slab) {
      return {
        title:
          slab.shippingCharge <= 0
            ? "Unlock FREE delivery"
            : `Unlock ${formatPrice(slab.shippingCharge)} delivery`,
        prefix: "Shop for ",
        amount: formatPrice(slab.orderAmount - subtotal),
        suffix: " more",
        progress: subtotal / slab.orderAmount,
      };
    }
    const shortfall = getMinimumOrderShortfall(subtotal, settings);
    if (shortfall > 0) {
      const minimum = mergeStoreSettings(settings).minimumOrderValue;
      return {
        title: `Minimum order ${formatPrice(minimum)}`,
        prefix: "Shop for ",
        amount: formatPrice(shortfall),
        suffix: " more",
        progress: subtotal / minimum,
      };
    }
  }
  return null;
}

function ProgressRing({ progress }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-[9px] flex items-center justify-center rounded-full bg-[#4B5563] text-white">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
        </svg>
      </span>
    </div>
  );
}

function FloatingCartBar() {
  const { items, cartCount } = useCart();
  const bottomNavHidden = useScrollDirection();
  const { data: storeSettings = null } = useStoreSettingsQuery();

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0),
    [items]
  );
  const { data: coupons = [] } = useAvailableCouponsQuery(subtotal, {
    enabled: cartCount > 0,
  });
  const nudge = useMemo(
    () => buildNudge(subtotal, coupons, storeSettings),
    [subtotal, coupons, storeSettings]
  );

  const restBottom = `calc(${BOTTOM_NAV_HEIGHT_PX + CART_GAP_PX}px + env(safe-area-inset-bottom, 0px))`;

  // Keep an invisible target so fly-to-cart animation works on first ADD
  if (cartCount === 0) {
    return (
      <div
        data-cart-target="floating"
        className="pointer-events-none fixed right-3 z-[55] h-8 w-[124px] opacity-0 lg:hidden"
        style={{ bottom: restBottom }}
        aria-hidden="true"
      />
    );
  }

  // Anchored above the nav. Slide down by the nav height when it hides
  // so both bars travel the same distance on a transform (not layout `bottom`).
  return (
    <div
      className="gg-bar-slide fixed left-3 right-3 z-[55] lg:hidden"
      style={{
        bottom: restBottom,
        height: FLOATING_CART_BAR_HEIGHT_PX,
        transform: bottomNavHidden
          ? `translate3d(0, ${BOTTOM_NAV_HEIGHT_PX}px, 0)`
          : "translate3d(0, 0, 0)",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 flex h-[68px] gap-2.5">
        <Link
          to="/coupons"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] bg-[#2B303A] px-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] active:scale-[0.99]"
        >
          <ProgressRing progress={nudge?.progress ?? 1} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-extrabold">
              {nudge?.title ?? `Item total ${formatPrice(subtotal)}`}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-white/70">
              {nudge ? (
                <>
                  {nudge.prefix}
                  <strong className="font-extrabold text-white/90">{nudge.amount}</strong>
                  {nudge.suffix}
                </>
              ) : (
                "View offers for your cart"
              )}
            </p>
          </div>
        </Link>

        <Link
          to="/cart"
          data-cart-target="floating"
          className="flex w-[124px] shrink-0 items-center gap-2 rounded-[18px] bg-[#065F46] px-3 text-left text-white shadow-[0_8px_20px_rgba(6,95,70,0.35)] active:scale-[0.98]"
        >
          <svg className="h-7 w-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <span className="min-w-0 leading-tight">
            <span className="block text-[16px] font-extrabold">Cart</span>
            <span className="block truncate text-[12px] font-medium text-white/85">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </span>
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex" style={{ paddingRight: 134 }}>
        <Link
          to="/coupons"
          className="pointer-events-auto mx-auto flex items-center gap-0.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[13px] font-extrabold text-[#065F46] shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
        >
          Offers
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default FloatingCartBar;
