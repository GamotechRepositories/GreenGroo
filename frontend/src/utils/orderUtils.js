import { getOrderNumber } from "./orderNumber";

export const ORDER_STATUS_LABELS = {
  attempted: "Attempted",
  confirm: "Confirm",
  processing: "Processing",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return: "Return",
  pending: "Confirm",
  confirmed: "Confirm",
  shipped: "Shipping",
};

export const ORDER_STATUS_STEP_INDEX = {
  attempted: -1,
  confirm: 0,
  processing: 1,
  shipping: 2,
  delivered: 3,
  cancelled: 4,
  return: 5,
  pending: 0,
  confirmed: 0,
  shipped: 2,
};

export const PAYMENT_LABELS = {
  paid: "Paid",
  paid_10: "Paid 10%",
  unpaid: "Unpaid",
  refundable: "Refundable",
  pending_verification: "Payment verification pending",
};

export const MINI_TRACKER_LABELS = ["Placed", "Packed", "Shipped", "Delivered"];

export function formatOrderPrice(amount, { withDecimals = true } = {}) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(amount);
}

export function formatOrderDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getOrderStatusColor(status) {
  switch (status) {
    case "attempted":
      return "#d97706";
    case "processing":
      return "#9333ea";
    case "shipping":
    case "shipped":
      return "#4f46e5";
    case "delivered":
      return "#16a34a";
    case "cancelled":
      return "#dc2626";
    case "return":
      return "#d97706";
    default:
      return "#2563eb";
  }
}

export function getMiniTrackerIndex(status) {
  return Math.min(ORDER_STATUS_STEP_INDEX[status] ?? 0, 3);
}

export function getPaymentStatus(order) {
  return order.paymentStatus || "unpaid";
}

export function getOrderPaymentLabel(order) {
  const status = getPaymentStatus(order);
  return PAYMENT_LABELS[status] || status;
}

export function showOrderPaymentBadge(order) {
  const status = getPaymentStatus(order);
  return status !== "unpaid" || order.paymentStatus === "pending_verification";
}

export function getOrderPaymentColor(order) {
  const status = getPaymentStatus(order);
  if (status === "paid_10") return "#65a30d";
  if (status === "paid") return "#16a34a";
  if (status === "refundable") return "#ea580c";
  if (status === "pending_verification") return "#b45309";
  return "#d97706";
}

export function getPrimaryProductId(order) {
  const item = order.items?.[0];
  if (!item?.product) return null;
  if (typeof item.product === "object") return item.product._id;
  return item.product;
}

export function getRelativePlacedLabel(dateStr) {
  if (!dateStr) return "Placed recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Placed today";
  if (diffDays === 1) return "Placed yesterday";
  if (diffDays < 7) return `Placed ${diffDays} days ago`;
  return `Placed on ${formatOrderDate(dateStr)}`;
}

export function getOrderStatusHeadline(status) {
  switch (status) {
    case "attempted":
      return "Checkout not completed";
    case "delivered":
      return "Delivered successfully";
    case "shipping":
    case "shipped":
      return "On the way to you";
    case "processing":
      return "Being prepared for dispatch";
    case "cancelled":
      return "Order was cancelled";
    case "return":
      return "Order returned";
    default:
      return "Order confirmed";
  }
}

export function isPlacedOrder(order) {
  return order?.status !== "attempted";
}

export function matchesOrderFilter(order, filter) {
  switch (filter) {
    case "active":
      return (
        order.status !== "delivered" &&
        order.status !== "cancelled" &&
        order.status !== "return"
      );
    case "delivered":
      return order.status === "delivered";
    case "cancelled":
      return order.status === "cancelled";
    case "return":
      return order.status === "return";
    default:
      return true;
  }
}

export function filterOrders(orders, { filter, query }) {
  const normalizedQuery = query.trim().toLowerCase();
  return orders.filter((order) => {
    if (!matchesOrderFilter(order, filter)) return false;
    if (!normalizedQuery) return true;
    const orderId = getOrderNumber(order).toLowerCase();
    const names = (order.items || []).map((item) => item.name?.toLowerCase() || "").join(" ");
    return orderId.includes(normalizedQuery) || names.includes(normalizedQuery);
  });
}

export function buildOrdersSummary(orders) {
  return orders.reduce(
    (summary, order) => {
      summary.total += 1;
      summary.spent += Number(order.total) || 0;
      if (order.status === "delivered") {
        summary.delivered += 1;
      } else if (order.status !== "cancelled" && order.status !== "return") {
        summary.active += 1;
      }
      return summary;
    },
    { total: 0, spent: 0, active: 0, delivered: 0 }
  );
}

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatPlacedAtLabel(dateStr) {
  if (!dateStr) return "Placed recently";
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = ordinalSuffix(day);
  const formatted = date.toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `Placed at ${day}${suffix} ${formatted}`;
}

export function formatOrderDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getBlinkitStatusLabel(status) {
  switch (status) {
    case "delivered":
      return "Order delivered";
    case "shipping":
    case "shipped":
      return "Order on the way";
    case "processing":
      return "Order being prepared";
    case "cancelled":
      return "Order cancelled";
    case "return":
      return "Order returned";
    default:
      return "Order confirmed";
  }
}

export function getBlinkitShipmentStatusLabel(status) {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "shipping":
    case "shipped":
      return "On the way";
    case "processing":
      return "Preparing";
    case "cancelled":
      return "Cancelled";
    case "return":
      return "Return";
    default:
      return "Confirmed";
  }
}

export function getOrderDisplayCode(order) {
  const number = order?.orderNumber?.trim();
  if (number) return number;
  return getOrderNumber(order);
}

export function splitOrderShipments(items = []) {
  if (items.length <= 6) return [items];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}
