/**
 * Customer-facing progress of a pre-order store order:
 * vendor confirms → vendor packs → vendor ships to the dark store → Delivery Manager marks received
 * → rider assigned → out for delivery → delivered (rider enters the customer's OTP).
 * Keys are stable because the customer apps match on them; "preparing" = packed, "dispatched" = shipped.
 */
export const PRE_ORDER_PROGRESS_STEPS = [
  { key: "awaiting_vendor", label: "Order Placed · Sent to Vendor & Manager" },
  { key: "confirmed", label: "Vendor Confirmed" },
  { key: "preparing", label: "Sourced from Farmer / Collection House" },
  { key: "dispatched", label: "Pickup Approved · In Transit to Dark Store" },
  { key: "at_store", label: "Reached Dark Store" },
  { key: "rider_assigned", label: "Delivery Partner Assigned" },
  { key: "out_for_delivery", label: "Out for Delivery" },
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

export function buildPreOrderTimeline(order, customerOrder) {
  if (!order?.isPreOrder) return [];
  const progress = preOrderProgressInfo(order);
  const currentKey = progress?.key || "awaiting_vendor";
  const stepIdx = progress?.step ?? 0;

  const placedTime = order.createdAt || customerOrder?.createdAt || null;
  const vendorTime = order.vendorConfirmedAt || null;
  const preparingTime = order.preparingAt || order.readyAt || null;
  const forwardedTime = order.forwardedAt || null;
  const storeReceivedTime = order.storeReceivedAt || null;
  const assignedTime = order.assignedAt || order.fullTimeAssignedAt || null;
  const outForDeliveryTime =
    order.outForDeliveryAt || (order.status === "out_for_delivery" ? order.updatedAt : null);
  const deliveredTime =
    order.deliveredAt || (order.status === "delivered" ? order.updatedAt : null);

  return [
    {
      key: "awaiting_vendor",
      title: "Order Placed",
      subtitle: "Sent to Vendor & Manager",
      time: placedTime,
      actor: "",
      done: true,
      active: currentKey === "awaiting_vendor",
    },
    {
      key: "confirmed",
      title: "Vendor Confirmed",
      subtitle: order.vendorActionByName
        ? `Approved by ${order.vendorActionByName}`
        : "Vendor approved pre-order",
      time: vendorTime,
      actor: order.vendorActionByName || "",
      done: Boolean(vendorTime) || stepIdx >= 1,
      active: currentKey === "confirmed",
    },
    {
      key: "preparing",
      title: "Farmer Sourced & Preparation",
      subtitle: "Sourced from Farmer / Collection House",
      time: preparingTime,
      actor: "",
      done: Boolean(preparingTime) || stepIdx >= 2,
      active: currentKey === "preparing",
    },
    {
      key: "dispatched",
      title: "Out for Collection Centre",
      subtitle: order.forwardedByName
        ? `Dispatched by ${order.forwardedByName}`
        : "Pickup Approved · In Transit to Dark Store",
      time: forwardedTime,
      actor: order.forwardedByName || "",
      done: Boolean(forwardedTime) || stepIdx >= 3,
      active: currentKey === "dispatched",
    },
    {
      key: "at_store",
      title: "Collected at Collection Centre",
      subtitle: order.storeReceivedByName
        ? `Received by ${order.storeReceivedByName}`
        : "Reached Dark Store / Collection Centre",
      time: storeReceivedTime,
      actor: order.storeReceivedByName || "",
      done: Boolean(storeReceivedTime) || stepIdx >= 4,
      active: currentKey === "at_store",
    },
    {
      key: "rider_assigned",
      title: "Delivery Partner Assigned",
      subtitle: "Delivery partner assigned for local route",
      time: assignedTime,
      actor: "",
      done: Boolean(assignedTime) || stepIdx >= 5,
      active: currentKey === "rider_assigned",
    },
    {
      key: "out_for_delivery",
      title: "Out for Delivery",
      subtitle: "Delivery partner is en route with your fresh order",
      time: outForDeliveryTime,
      actor: "",
      done: Boolean(outForDeliveryTime) || stepIdx >= 6,
      active: currentKey === "out_for_delivery",
    },
    {
      key: "delivered",
      title: "Completed / Delivered",
      subtitle: "Delivered with Customer OTP confirmation",
      time: deliveredTime,
      actor: "",
      done: Boolean(deliveredTime) || currentKey === "delivered",
      active: currentKey === "delivered",
    },
  ];
}

