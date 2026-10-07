/**
 * Customer-facing progress of a pre-order store order:
 * vendor confirms → Product Manager prepares and forwards → goods reach the dark store
 * (Delivery Manager marks received) → rider assigned → out for delivery → delivered.
 */
export const PRE_ORDER_PROGRESS_STEPS = [
  { key: "awaiting_vendor", label: "Awaiting confirmation" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Being prepared" },
  { key: "dispatched", label: "On the way to dark store" },
  { key: "at_store", label: "Reached dark store" },
  { key: "rider_assigned", label: "Delivery partner assigned" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const LABELS = {
  ...Object.fromEntries(PRE_ORDER_PROGRESS_STEPS.map((step) => [step.key, step.label])),
  rejected: "Not accepted by the store",
  cancelled: "Cancelled",
  failed: "Delivery failed",
};

/** True once the vendor confirmed — or the order already moved past the hold (pre-existing orders). */
export function isVendorConfirmed(order) {
  if (!order?.isPreOrder) return true;
  if (order.vendorStatus === "confirmed") return true;
  if (order.vendorStatus === "rejected") return false;
  return Boolean(order.status) && order.status !== "preorder_hold" && order.status !== "cancelled";
}

export function preOrderProgressKey(order) {
  if (!order?.isPreOrder) return "";
  switch (order.status) {
    case "delivered":
      return "delivered";
    case "cancelled":
      return order.vendorStatus === "rejected" ? "rejected" : "cancelled";
    case "delivery_failed":
      return "failed";
    case "out_for_delivery":
      return "out_for_delivery";
    case "assigned":
    case "pickup_verified":
      return "rider_assigned";
    case "packed":
    case "offered":
      return order.storeReceivedAt ? "at_store" : "dispatched";
    default:
      if (!isVendorConfirmed(order)) return "awaiting_vendor";
      return ["preparing", "ready"].includes(order.preOrderStage) ? "preparing" : "confirmed";
  }
}

export const preOrderProgressLabel = (key) => LABELS[key] || "";

export function preOrderProgressInfo(order) {
  const key = preOrderProgressKey(order);
  if (!key) return null;
  return {
    key,
    label: preOrderProgressLabel(key),
    step: PRE_ORDER_PROGRESS_STEPS.findIndex((step) => step.key === key),
    steps: PRE_ORDER_PROGRESS_STEPS,
  };
}
