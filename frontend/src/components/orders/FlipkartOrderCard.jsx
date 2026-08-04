import { useNavigate } from "react-router-dom";
import OrderItemImage from "./OrderItemImage";
import { getOrderNumber } from "../../utils/orderNumber";
import {
  formatOrderPrice,
  getMiniTrackerIndex,
  getOrderPaymentColor,
  getOrderPaymentLabel,
  getOrderStatusColor,
  getOrderStatusHeadline,
  getOrderStatusLabel,
  getPrimaryProductId,
  getRelativePlacedLabel,
  MINI_TRACKER_LABELS,
  showOrderPaymentBadge,
} from "../../utils/orderUtils";

function StatusIcon({ status, className = "h-[18px] w-[18px]" }) {
  if (status === "delivered") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === "shipping" || status === "shipped") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    );
  }
  if (status === "processing") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    );
  }
  if (status === "cancelled") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === "return") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function MiniOrderTracker({ activeIndex }) {
  const nodes = [];
  MINI_TRACKER_LABELS.forEach((label, step) => {
    if (step > 0) {
      nodes.push(
        <div
          key={`line-${step}`}
          className="mb-3.5 h-0.5 flex-1"
          style={{ backgroundColor: step <= activeIndex ? "#2874F0" : "#e5e5e5" }}
        />
      );
    }

    const done = step <= activeIndex;
    nodes.push(
      <div key={label} className="flex flex-col items-center">
        <div
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]"
          style={{
            backgroundColor: done ? "#2874F0" : "#ffffff",
            borderColor: done ? "#2874F0" : "#e5e5e5",
          }}
        >
          {done ? (
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
        <span
          className="mt-1 text-[8px] leading-none"
          style={{
            fontWeight: step === activeIndex ? 700 : 500,
            color: done ? "#2874F0" : "#999999",
          }}
        >
          {label}
        </span>
      </div>
    );
  });

  return <div className="flex items-start">{nodes}</div>;
}

function ProductPreview({ items, primary }) {
  if (!primary) return null;

  if (items.length === 1) {
    return (
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-border-light bg-white">
        <OrderItemImage image={primary.image} fallbackImage={primary.productImage} alt={primary.name} />
      </div>
    );
  }

  return (
    <div className="relative h-[72px] w-[84px] shrink-0">
      {items.slice(0, 3).map((item, index) => (
        <div
          key={item._id || `${item.name}-${index}`}
          className="absolute top-0 h-14 w-14 overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm"
          style={{ left: index * 18 }}
        >
          <OrderItemImage image={item.image} fallbackImage={item.productImage} alt={item.name} />
        </div>
      ))}
      {items.length > 3 ? (
        <span className="absolute bottom-0 right-0 rounded-full bg-[#2874F0] px-1.5 py-0.5 text-[10px] font-bold text-white">
          +{items.length - 3}
        </span>
      ) : null}
    </div>
  );
}

function MetaChip({ icon, label, color }) {
  const chipColor = color || "#666666";
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-border-light bg-mobile-surface px-2 py-1 text-[10px] font-semibold"
      style={{ color: chipColor }}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionPill({ icon, label, onClick, color, filled = false }) {
  const accent = color || "#666666";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-bold transition hover:brightness-95"
      style={{
        color: accent,
        backgroundColor: filled ? `${accent}1a` : "#f8f8f8",
        borderColor: filled ? `${accent}59` : "#e5e5e5",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FlipkartOrderCard({ order }) {
  const navigate = useNavigate();
  const orderId = getOrderNumber(order);
  const statusColor = getOrderStatusColor(order.status);
  const statusLabel = getOrderStatusLabel(order.status);
  const items = order.items || [];
  const primaryItem = items[0];
  const extraItems = items.length > 1 ? items.length - 1 : 0;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const productId = getPrimaryProductId(order);
  const paymentMode = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";
  const activeIndex = getMiniTrackerIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isReturn = order.status === "return";
  const city = order.deliveryAddress?.city?.trim() || "";
  const placedLabel = getRelativePlacedLabel(order.createdAt);
  const paymentColor = getOrderPaymentColor(order);

  const openDetails = () => navigate(`/orders/${order._id}`);

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <button type="button" onClick={openDetails} className="w-full text-left">
        <div
          className="border-l-4 px-3.5 py-2.5"
          style={{
            borderLeftColor: statusColor,
            background: `linear-gradient(90deg, ${statusColor}24, ${statusColor}0a)`,
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${statusColor}26`, color: statusColor }}
            >
              <StatusIcon status={order.status} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold" style={{ color: statusColor }}>
                {getOrderStatusHeadline(order.status)}
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                {placedLabel} · Order #{orderId}
              </p>
              {city ? <p className="text-[11px] text-text-muted">Deliver to {city}</p> : null}
            </div>
            <span
              className="shrink-0 rounded px-2 py-1 text-[10px] font-bold"
              style={{ color: statusColor, backgroundColor: `${statusColor}24` }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 px-3.5 pt-3">
          <div>
            <p className="text-xs text-text-secondary">
              {items.length} item{items.length === 1 ? "" : "s"} · {totalQty} pcs
            </p>
            {order.deliveryCharges === 0 ? (
              <p className="text-[11px] font-semibold text-green-600">You saved on delivery</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-text-muted">Order total</p>
            <p className="text-lg font-extrabold text-text-primary">{formatOrderPrice(order.total)}</p>
          </div>
        </div>

        {!isCancelled && !isReturn ? (
          <div className="px-3.5 pt-2.5">
            <MiniOrderTracker activeIndex={activeIndex} />
          </div>
        ) : null}
        {isReturn ? (
          <p className="px-3.5 pt-2.5 text-sm font-semibold text-amber-600">This order was returned</p>
        ) : null}

        {primaryItem ? (
          <div className="flex gap-3 px-3.5 pt-3">
            <ProductPreview items={items} primary={primaryItem} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                {primaryItem.name}
              </p>
              {primaryItem.brandName ? (
                <p className="mt-1 text-xs text-text-muted">{primaryItem.brandName}</p>
              ) : null}
              <p className="mt-1.5 text-xs text-text-secondary">
                {extraItems > 0
                  ? `Qty ${primaryItem.quantity} · +${extraItems} more`
                  : `Quantity: ${primaryItem.quantity}`}
              </p>
              <p className="mt-1 text-sm font-bold text-primary">
                {formatOrderPrice(primaryItem.price * primaryItem.quantity)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 px-3.5 pb-3 pt-3">
          <MetaChip
            icon={
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m6 0h3m-3.75 3.75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            }
            label={paymentMode}
          />
          {showOrderPaymentBadge(order) ? (
            <MetaChip
              icon={
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              }
              label={getOrderPaymentLabel(order)}
              color={paymentColor}
            />
          ) : null}
          {order.deliveryCharges === 0 ? (
            <MetaChip
              icon={
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              }
              label="Free delivery"
              color="#16a34a"
            />
          ) : null}
        </div>
      </button>

      <div className="border-t border-border-light px-2.5 py-2">
        <div className="flex gap-2">
          <ActionPill
            filled
            color="#2874F0"
            label="Details"
            onClick={openDetails}
            icon={
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <ActionPill
            label="Invoice"
            onClick={() => navigate(`/orders/${order._id}/invoice`)}
            icon={
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          />
          {productId ? (
            <ActionPill
              color="#ff7a00"
              label="Reorder"
              onClick={() => navigate(`/product/${productId}`)}
              icon={
                <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              }
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default FlipkartOrderCard;
