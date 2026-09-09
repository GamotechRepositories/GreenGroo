import EcommerceOrder from "../../legacy/models/order/Order.js";
import { notifyOrderStatusChange } from "../../legacy/services/orderNotificationDispatcher.js";
import { reverseOrderRewardPoints } from "../../legacy/controllers/rewardController.js";

const CUSTOMER_STATUS_BY_STORE = {
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

export async function syncCustomerOrderFromStore(storeOrder, storeStatus) {
  if (!storeOrder?.sourceOrderId) return null;

  const customerOrder = await EcommerceOrder.findById(storeOrder.sourceOrderId);
  if (!customerOrder) return null;

  const previousStatus = customerOrder.status;
  const nextStatus = customerStatusForStoreStatus(storeStatus);
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
    void notifyOrderStatusChange(customerOrder, previousStatus);
  } catch (err) {
    console.warn("[lifecycle] customer notify failed:", err.message);
  }

  return customerOrder;
}
