import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bike,
  CalendarClock,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Package,
  RotateCcw,
  Star,
} from "lucide-react";
import { getDeliveryRating, setDeliveryRating } from "../../utils/deliveryRatings";
import { canTrackOrder } from "../../utils/orderTracking";
import {
  formatOrderDateTime,
  formatOrderPrice,
  formatPreOrderSlot,
  getBlinkitStatusLabel,
  getMiniTrackerIndex,
  getOrderDisplayCode,
  getPreOrderProgressLabel,
  getPrimaryProductId,
  isActiveOrder,
} from "../../utils/orderUtils";

const BRAND = "#0C831F";
const MAX_THUMBS = 4;
const PROGRESS_STEPS = ["Placed", "Packed", "On the way", "Delivered"];

const STATUS_STYLES = {
  delivered: { Icon: CircleCheck, tone: "text-emerald-700 bg-emerald-50" },
  shipping: { Icon: Bike, tone: "text-indigo-700 bg-indigo-50" },
  shipped: { Icon: Bike, tone: "text-indigo-700 bg-indigo-50" },
  processing: { Icon: Package, tone: "text-amber-700 bg-amber-50" },
  cancelled: { Icon: CircleX, tone: "text-rose-700 bg-rose-50" },
  return: { Icon: RotateCcw, tone: "text-orange-700 bg-orange-50" },
};
const DEFAULT_STATUS_STYLE = { Icon: Clock, tone: "text-sky-700 bg-sky-50" };

function Thumb({ item }) {
  const src = item.image || item.productImage || "";
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
      {src ? (
        <img src={src} alt={item.name || ""} loading="lazy" className="h-full w-full object-contain p-1" />
      ) : (
        <Package className="h-5 w-5 text-slate-300" />
      )}
    </div>
  );
}

function ProgressTrack({ status }) {
  const active = getMiniTrackerIndex(status);
  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {PROGRESS_STEPS.map((step, index) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full ${index <= active ? "bg-[#0C831F]" : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] font-medium">
        {PROGRESS_STEPS.map((step, index) => (
          <span key={step} className={index <= active ? "text-slate-800" : "text-slate-400"}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stars({ value, size = "h-3.5 w-3.5" }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size} ${index < value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

function RateSheet({ onClose, onSubmit }) {
  const [selected, setSelected] = useState(5);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-6 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <h3 className="text-center text-base font-bold text-slate-900">How was your delivery?</h3>
        <p className="mt-1 text-center text-xs text-slate-500">Your feedback helps us serve you better</p>
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: 5 }, (_, index) => {
            const star = index + 1;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelected(star)}
                className="rounded-full p-1 transition active:scale-90"
                aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-9 w-9 ${star <= selected ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onSubmit(selected)}
          className="mt-5 h-12 w-full rounded-xl text-sm font-bold text-white transition active:scale-[0.99]"
          style={{ backgroundColor: BRAND }}
        >
          Submit rating
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 h-10 w-full text-sm font-semibold text-slate-500"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function FooterButton({ children, onClick, to }) {
  const className =
    "flex h-11 flex-1 items-center justify-center gap-1.5 text-[13px] font-bold text-[#0C831F] transition hover:bg-emerald-50/60 active:bg-emerald-50";
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function OrderListCard({ order }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(() => getDeliveryRating(order._id));
  const [rateOpen, setRateOpen] = useState(false);

  const items = order.items || [];
  const detailUrl = `/orders/${order._id}`;
  const { Icon, tone } = STATUS_STYLES[order.status] || DEFAULT_STATUS_STYLE;
  const isDelivered = order.status === "delivered";
  const active = isActiveOrder(order);
  const preOrderSlot = order.preOrderSlot ? formatPreOrderSlot(order) : "";
  const preOrderProgress = getPreOrderProgressLabel(order);
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const names = items.map((item) => item.name).filter(Boolean);
  const summary =
    names.length > 2 ? `${names.slice(0, 2).join(", ")} & ${names.length - 2} more` : names.join(" & ");

  const handleOrderAgain = () => {
    const productId = getPrimaryProductId(order);
    navigate(items.length === 1 && productId ? `/product/${productId}` : detailUrl);
  };

  const handleRate = (value) => {
    setDeliveryRating(order._id, value);
    setRating(value);
    setRateOpen(false);
  };

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ${
        active ? "ring-emerald-200" : "ring-slate-200/70"
      }`}
    >
      <Link to={detailUrl} className="block p-3.5 transition active:bg-slate-50">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-bold text-slate-900">
              {getBlinkitStatusLabel(order.status)}
            </p>
            <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
              {formatOrderDateTime(order.createdAt)} · #{getOrderDisplayCode(order)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <span className="text-[14.5px] font-bold tabular-nums text-slate-900">
              {formatOrderPrice(order.total, { withDecimals: false })}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {preOrderSlot || preOrderProgress ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {preOrderSlot ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                <CalendarClock className="h-3.5 w-3.5" />
                {preOrderSlot}
              </span>
            ) : null}
            {preOrderProgress ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                {preOrderProgress}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          {items.slice(0, MAX_THUMBS).map((item, index) => (
            <Thumb key={item._id || `${item.name}-${index}`} item={item} />
          ))}
          {items.length > MAX_THUMBS ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600">
              +{items.length - MAX_THUMBS}
            </span>
          ) : null}
        </div>
        {summary ? (
          <p className="mt-2 truncate text-[12px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {totalQty} item{totalQty === 1 ? "" : "s"}
            </span>{" "}
            · {summary}
          </p>
        ) : null}

        {active ? <ProgressTrack status={order.status} /> : null}
      </Link>

      <div className="flex divide-x divide-slate-100 border-t border-slate-100">
        {isDelivered && rating ? (
          <div className="flex h-11 flex-1 items-center justify-center gap-1.5 text-[12px] text-slate-500">
            You rated <Stars value={rating} />
          </div>
        ) : null}
        {isDelivered && !rating ? (
          <FooterButton onClick={() => setRateOpen(true)}>
            <Star className="h-4 w-4" /> Rate order
          </FooterButton>
        ) : null}
        {active ? (
          <FooterButton to={canTrackOrder(order) ? `${detailUrl}/track` : detailUrl}>
            <Bike className="h-4 w-4" /> Track order
          </FooterButton>
        ) : (
          <FooterButton onClick={handleOrderAgain}>
            <RotateCcw className="h-4 w-4" /> Order again
          </FooterButton>
        )}
      </div>

      {rateOpen ? <RateSheet onClose={() => setRateOpen(false)} onSubmit={handleRate} /> : null}
    </article>
  );
}

export default OrderListCard;
