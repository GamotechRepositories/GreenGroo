import EcommerceOrder from "../../../legacy/models/order/Order.js";
import StoreOrder from "../models/StoreOrder.js";
import {
  notifyOrderStatusChange,
  notifyStoreOrderStage,
} from "../../../legacy/services/orderNotificationDispatcher.js";
import { reverseOrderRewardPoints } from "../../../legacy/controllers/rewardController.js";
import { emitOrderStatus } from "./orderTrackingService.js";

const CUSTOMER_STATUS_BY_STORE = {
  preorder_hold: "confirm",
  /** Pseudo-status: Product Manager started preparing a held pre-order */
  preorder_preparing: "processing",
  incoming: "confirm",
  order_received: "confirm",
  stock_issue: "processing",
  packed: "processing",
  offered: "processing",
  assigned: "processing",
  pickup_verified: "processing",
  out_for_delivery: "shipping",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function customerStatusForStoreStatus(storeStatus) {
  return CUSTOMER_STATUS_BY_STORE[storeStatus] || "processing";
}

const PROGRESS_RANK = { confirm: 1, processing: 2, shipping: 3, delivered: 4 };

/**
 * A mixed cart is split into a "now" and a "preorder" store order. The customer order
 * is delivered only when every open part is delivered, and cancelled only when all are.
 */
async function combinedStatusForSplitOrder(storeOrder, storeStatus) {
  const siblings = await StoreOrder.find({
    sourceOrderId: storeOrder.sourceOrderId,
    _id: { $ne: storeOrder._id },
  }).select("status");

  const statuses = [
    customerStatusForStoreStatus(storeStatus),
    ...siblings.map((row) => customerStatusForStoreStatus(row.status)),
  ];
  const open = statuses.filter((status) => status !== "cancelled");
  if (!open.length) return "cancelled";

  const pending = open.filter((status) => status !== "delivered");
  if (!pending.length) return "delivered";

  const slowest = pending.reduce((a, b) =>
    (PROGRESS_RANK[a] || 2) <= (PROGRESS_RANK[b] || 2) ? a : b
  );
  return slowest === "confirm" && pending.length < open.length ? "processing" : slowest;
}

export async function syncCustomerOrderFromStore(storeOrder, storeStatus) {
  if (!storeOrder?.sourceOrderId) return null;
  emitOrderStatus(storeOrder, storeStatus);
  void notifyStoreOrderStage(storeOrder, storeStatus);

  const customerOrder = await EcommerceOrder.findById(storeOrder.sourceOrderId);
  if (!customerOrder) return null;

  const previousStatus = customerOrder.status;
  const nextStatus = storeOrder.sourcePart
    ? await combinedStatusForSplitOrder(storeOrder, storeStatus)
    : customerStatusForStoreStatus(storeStatus);
  if (previousStatus === nextStatus) return customerOrder;

  customerOrder.status = nextStatus;
  if (nextStatus === "delivered") {
    customerOrder.paymentStatus = "paid";
    if (!customerOrder.paidAt) customerOrder.paidAt = new Date();
  }
  if (nextStatus === "cancelled" && customerOrder.paymentMethod === "online" && customerOrder.paymentStatus === "paid") {
    customerOrder.paymentStatus = "refundable";
  }
  await customerOrder.save();

  if (nextStatus === "cancelled" && previousStatus !== "cancelled") {
    try {
      await reverseOrderRewardPoints(customerOrder);
    } catch (err) {
      console.warn("[lifecycle] reward reverse failed:", err.message);
    }
  }

  try {
    void notifyOrderStatusChange(customerOrder, previousStatus, { storeStatus });
  } catch (err) {
    console.warn("[lifecycle] customer notify failed:", err.message);
  }

  return customerOrder;
}
