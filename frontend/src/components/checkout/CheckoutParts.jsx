import { useRef, useState } from "react";
import ProductImageFrame from "../product/ProductImageFrame";

const formatPrice = (amount, fractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(amount) || 0);

export function SectionLabel({ children }) {
  return (
    <p className="px-1 pb-2.5 pt-1 text-xs font-extrabold tracking-[0.12em] text-slate-500">
      {children}
    </p>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-3.5 sm:p-4 ${className}`}>
      {title ? <p className="mb-3 text-sm font-extrabold text-slate-900">{title}</p> : null}
      {children}
    </div>
  );
}

export function DashedDivider() {
  return <div className="my-3 border-t border-dashed border-slate-300" />;
}

function Stepper({ quantity, onDecrease, onIncrease, disabled }) {
  return (
    <div className="flex items-center rounded-[10px] border border-slate-300 bg-white">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center text-[#047857] disabled:opacity-40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      </button>
      <span className="min-w-[1.4rem] text-center text-sm font-extrabold text-[#047857]">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center text-[#047857] disabled:opacity-40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

/** Cart line: image, name, "Move to wishlist", −/qty/+ and struck MRP. */
export function CheckoutLine({ item, editable, busy, onDecrease, onIncrease, onMoveToWishlist }) {
  const lineTotal = item.discountedPrice * item.quantity;
  const mrp = Number(item.price) * item.quantity;
  const showMrp = Number.isFinite(mrp) && mrp > lineTotal + 0.009;
  const details = [item.variantName, item.colorName].filter(Boolean).join(" · ");

  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="w-14 shrink-0 overflow-hidden rounded-[10px] bg-slate-100">
        <ProductImageFrame src={item.productImages?.[0]} alt={item.name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-900">{item.name}</p>
        {details ? <p className="mt-0.5 text-xs text-slate-500">{details}</p> : null}
        {onMoveToWishlist ? (
          <button
            type="button"
            onClick={onMoveToWishlist}
            disabled={busy}
            className="mt-1.5 text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700 disabled:opacity-50"
          >
            Move to wishlist
          </button>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {editable ? (
          <Stepper
            quantity={item.quantity}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            disabled={busy}
          />
        ) : (
          <span className="text-xs font-semibold text-slate-500">Qty {item.quantity}</span>
        )}
        <div className="text-right leading-tight">
          {showMrp ? (
            <p className="text-[11.5px] font-medium text-slate-400 line-through">{formatPrice(mrp)}</p>
          ) : null}
          <p className="text-[13.5px] font-bold text-slate-900">{formatPrice(lineTotal)}</p>
        </div>
      </div>
    </li>
  );
}

export function BillRow({ icon, label, value, struck, valueClass = "text-slate-900", note }) {
  return (
    <div className="pb-2.5">
      <div className="flex items-center gap-3 text-[13px]">
        <span className="w-5 shrink-0 text-center text-base leading-none">{icon}</span>
        <span className="min-w-0 flex-1 font-medium text-slate-700">{label}</span>
        {struck ? <span className="text-xs font-medium text-slate-400 line-through">{struck}</span> : null}
        <span className={`font-bold ${valueClass}`}>{value}</span>
      </div>
      {note ? <p className="pl-8 pt-0.5 text-[11.5px] font-semibold text-[#047857]">{note}</p> : null}
    </div>
  );
}

export function CouponRow({ title, subtitle, actionLabel, actionClass = "text-[#047857]", onAction, disabled }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM6.5 8A1.5 1.5 0 118 6.5 1.5 1.5 0 016.5 8z" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-extrabold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className={`shrink-0 text-sm font-extrabold disabled:opacity-50 ${actionClass}`}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

const KNOB = 48;
const INSET = 4;

/** "Slide to Pay | ₹X" — drag the knob to the end to confirm. */
export function SlideToPay({ label, amount, enabled, onComplete }) {
  const trackRef = useRef(null);
  const startRef = useRef(null);
  const [drag, setDrag] = useState(0);
  const [max, setMax] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event) => {
    if (!enabled) return;
    const width = trackRef.current?.clientWidth || 0;
    setMax(Math.max(0, width - KNOB - INSET * 2));
    startRef.current = event.clientX - drag;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragging || startRef.current == null) return;
    setDrag(Math.min(max, Math.max(0, event.clientX - startRef.current)));
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    startRef.current = null;
    if (max > 0 && drag >= max * 0.85) {
      setDrag(max);
      onComplete();
      window.setTimeout(() => setDrag(0), 600);
    } else {
      setDrag(0);
    }
  };

  const progress = max > 0 ? Math.min(1, drag / max) : 0;

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-disabled={!enabled}
      aria-label={`${label} ${amount}`}
      onKeyDown={(event) => {
        if (enabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onComplete();
        }
      }}
      className={`relative h-14 select-none overflow-hidden rounded-2xl transition-colors ${
        enabled ? "bg-[#047857]" : "bg-slate-300"
      }`}
    >
      <div
        className="absolute inset-0 flex items-center justify-center gap-2.5 pl-14 text-[15px] font-extrabold text-white"
        style={{ opacity: 1 - progress }}
      >
        <span className="truncate">{label}</span>
        <span className="h-[18px] w-px bg-white/50" />
        <span>{amount}</span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute flex items-center justify-center rounded-[11px] bg-white touch-none ${
          enabled ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"
        } ${dragging ? "" : "transition-transform duration-200"}`}
        style={{
          top: INSET,
          bottom: INSET,
          left: INSET,
          width: KNOB,
          transform: `translateX(${drag}px)`,
        }}
      >
        <svg
          className={`h-6 w-6 ${enabled ? "text-[#047857]" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
