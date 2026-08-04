import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderItemImage from "./OrderItemImage";
import { getOrderNumber } from "../../utils/orderNumber";
import {
  formatOrderDateTime,
  formatOrderPrice,
  getMiniTrackerIndex,
  getOrderPaymentLabel,
  getOrderStatusColor,
  getOrderStatusHeadline,
  getOrderStatusLabel,
  getPrimaryProductId,
  MINI_TRACKER_LABELS,
  showOrderPaymentBadge,
} from "../../utils/orderUtils";

function StatusBadge({ status }) {
  const color = getOrderStatusColor(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}

function MiniTracker({ activeIndex, isCancelled, isReturn }) {
  if (isCancelled) {
    return (
      <p className="text-sm font-semibold text-red-600">This order was cancelled</p>
    );
  }
  if (isReturn) {
    return (
      <p className="text-sm font-semibold text-amber-600">This order was returned</p>
    );
  }

  return (
    <div className="flex items-start">
      {MINI_TRACKER_LABELS.map((label, step) => {
        const done = step <= activeIndex;
        return (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {step > 0 ? (
                <div
                  className="h-0.5 flex-1"
                  style={{ backgroundColor: step <= activeIndex ? "#2874F0" : "#e5e5e5" }}
                />
              ) : (
                <div className="flex-1" />
              )}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold"
                style={{
                  backgroundColor: done ? "#2874F0" : "#fff",
                  borderColor: done ? "#2874F0" : "#e5e5e5",
                  color: done ? "#fff" : "#999",
                }}
              >
                {done ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step + 1
                )}
              </div>
              {step < MINI_TRACKER_LABELS.length - 1 ? (
                <div
                  className="h-0.5 flex-1"
                  style={{ backgroundColor: step < activeIndex ? "#2874F0" : "#e5e5e5" }}
                />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <p
              className="mt-1.5 text-center text-[10px] font-semibold"
              style={{ color: done ? "#2874F0" : "#999" }}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DesktopOrderCard({ order }) {
  const navigate = useNavigate();
  const items = order.items || [];
  const primaryItem = items[0];
  const orderId = getOrderNumber(order);
  const productId = getPrimaryProductId(order);
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const city = order.deliveryAddress?.city?.trim() || "";
  const paymentMode = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";
  const activeIndex = getMiniTrackerIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isReturn = order.status === "return";
  const statusColor = getOrderStatusColor(order.status);

  const previewItems = useMemo(() => items.slice(0, 4), [items]);

  return (
    <article className="overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header strip */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-5 py-3.5"
        style={{
          background: `linear-gradient(90deg, ${statusColor}12, transparent)`,
          borderLeft: `4px solid ${statusColor}`,
        }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-extrabold text-text-primary">Order #{orderId}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {formatOrderDateTime(order.createdAt)}
            {city ? ` · Deliver to ${city}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Order total</p>
          <p className="text-xl font-extrabold text-text-primary">
            {formatOrderPrice(order.total, { withDecimals: false })}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 px-5 py-5 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Product thumbnails */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Items ({items.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {previewItems.map((item) => (
              <div
                key={item._id || item.name}
                className="overflow-hidden rounded-lg bg-gradient-to-br from-white to-[#F2F2F2] p-1.5"
              >
                <OrderItemImage
                  image={item.image}
                  fallbackImage={item.productImage}
                  alt={item.name}
                  className="aspect-square w-full object-contain"
                />
              </div>
            ))}
          </div>
          {items.length > 4 ? (
            <p className="mt-2 text-xs font-semibold text-[#2874F0]">+{items.length - 4} more items</p>
          ) : null}
        </div>

        {/* Product summary */}
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Summary</p>
          <p className="text-base font-bold leading-snug text-text-primary">
            {getOrderStatusHeadline(order.status)}
          </p>
          {primaryItem ? (
            <>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
                {primaryItem.name}
              </p>
              {primaryItem.brandName ? (
                <p className="mt-1 text-xs text-text-muted">{primaryItem.brandName}</p>
              ) : null}
              <p className="mt-2 text-sm text-text-secondary">
                {items.length} product{items.length === 1 ? "" : "s"} · {totalQty} pcs total
              </p>
            </>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md bg-mobile-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              {paymentMode}
            </span>
            {showOrderPaymentBadge(order) ? (
              <span className="rounded-md bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                {getOrderPaymentLabel(order)}
              </span>
            ) : null}
            {order.deliveryCharges === 0 ? (
              <span className="rounded-md bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                Free delivery
              </span>
            ) : null}
          </div>
        </div>

        {/* Tracker */}
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Order progress
          </p>
          <MiniTracker activeIndex={activeIndex} isCancelled={isCancelled} isReturn={isReturn} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-light bg-[#FAFAFA] px-5 py-3">
        <button
          type="button"
          onClick={() => navigate(`/orders/${order._id}`)}
          className="rounded-lg bg-[#2874F0] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          View details
        </button>
        <Link
          to={`/orders/${order._id}/invoice`}
          className="rounded-lg border border-border-light bg-white px-5 py-2.5 text-sm font-bold text-text-primary transition hover:border-[#2874F0] hover:text-[#2874F0]"
        >
          Download invoice
        </Link>
        {productId ? (
          <button
            type="button"
            onClick={() => navigate(`/product/${productId}`)}
            className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
          >
            Order again
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default DesktopOrderCard;
