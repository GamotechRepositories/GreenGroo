import {
  sendOrderPlaced,
  sendOrderConfirmed,
  sendOrderPacked,
  sendOrderShipped,
  sendShipmentLabelCreated,
  sendOutForDelivery,
  sendDelivered,
  sendOrderCancelled,
  sendOrderReturned,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendRiderAssigned,
  sendDeliveryFailed,
  sendPreOrderConfirmed,
  sendPreOrderAtStore,
} from "./notificationService.js";
import OrderNotificationLog from "../models/OrderNotificationLog.js";
import EcommerceOrder from "../models/order/Order.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";

function logDispatchFailure(context, error) {
  console.error(`OrderNotificationDispatcher [${context}]:`, error?.message || error);
}

function logDispatchResult(context, result) {
  if (!result) {
    console.warn(`OrderNotificationDispatcher [${context}]: skipped (no notification sent)`);
    return;
  }

  if (result.delivered) {
    console.log(`OrderNotificationDispatcher [${context}]: push delivered`);
    return;
  }

  console.warn(
    `OrderNotificationDispatcher [${context}]: push not delivered — ${
      result.reason || result.error || "unknown"
    }`
  );
}

/** True for the first caller announcing this stage of this order. */
async function claimStage(order, stage) {
  if (!order?._id || !stage) return false;
  try {
    await OrderNotificationLog.create({ order: order._id, stage });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

/** Dark-store orders have no courier tracking number: "shipping" means a rider is on the way. */
function isCourierShipment(order) {
  return Boolean(order?.shipment?.trackingNumber);
}

const STATUS_SENDERS = {
  confirm: sendOrderConfirmed,
  processing: sendOrderPacked,
  shipping: (order, options) =>
    options.notificationStage === "out_for_delivery" || !isCourierShipment(order)
      ? sendOutForDelivery(order)
      : sendOrderShipped(order),
  delivered: sendDelivered,
  cancelled: sendOrderCancelled,
  return: sendOrderReturned,
};

/**
 * Push the customer notification for the order's current status, at most once
 * per (order, status) no matter how many code paths report the change.
 */
export async function notifyOrderStatus(order, options = {}) {
  const sender = STATUS_SENDERS[order?.status];
  if (!order?.user || !sender) return null;
  // Dark-store "processing" covers stock checks too; only announce it once items are packed.
  if (order.status === "processing" && !(await isPackedForCustomer(order, options.storeStatus))) {
    return null;
  }

  const context = `status ${order.status} (${options.source || "api"})`;
  try {
    if (!(await claimStage(order, order.status))) return null;
    const result = await sender(order, options);
    logDispatchResult(context, result);
    return result;
  } catch (error) {
    logDispatchFailure(context, error);
    return null;
  }
}

const PACKED_STORE_STATUSES = new Set(["packed", "offered", "assigned", "pickup_verified"]);

async function isPackedForCustomer(order, storeStatus) {
  if (storeStatus) return PACKED_STORE_STATUSES.has(storeStatus);
  const parts = await StoreOrder.find({ sourceOrderId: order._id }).select("status").lean();
  return !parts.length || parts.some((part) => PACKED_STORE_STATUSES.has(part.status));
}

/**
 * Dark-store milestones the customer order status can't express on its own
 * (store confirmed, rider assigned, delivery failed). Each fires once per order
 * — rider assignment once per rider — no matter how many code paths report it.
 */
const STORE_STAGES = {
  preorder_vendor_confirmed: {
    stage: (storeOrder) => `preorder_confirmed:${storeOrder._id}`,
    send: (order, storeOrder) =>
      sendPreOrderConfirmed(order, { date: storeOrder.preOrderDate, slot: storeOrder.preOrderSlot }),
  },
  preorder_at_store: {
    stage: (storeOrder) => `preorder_at_store:${storeOrder._id}`,
    send: async (order, storeOrder) => {
      const store = await DeliveryManager.findById(storeOrder.managerId).select("storeName area").lean();
      return sendPreOrderAtStore(order, { storeName: store?.storeName || (store?.area ? `${store.area} store` : "") });
    },
  },
  order_received: { stage: () => "confirm", send: (order) => sendOrderConfirmed(order) },
  packed: { stage: () => "processing", send: (order) => sendOrderPacked(order) },
  assigned: {
    stage: (storeOrder) => (storeOrder.assignedRiderId ? `rider_assigned:${storeOrder.assignedRiderId}` : null),
    send: async (order, storeOrder) => {
      const rider = await DeliveryBoy.findById(storeOrder.assignedRiderId).select("name phone").lean();
      return rider ? sendRiderAssigned(order, rider) : null;
    },
  },
  out_for_delivery: { stage: () => "shipping", send: (order) => sendOutForDelivery(order) },
  delivery_failed: {
    stage: (storeOrder) => `delivery_failed:${storeOrder._id}`,
    send: (order) => sendDeliveryFailed(order),
  },
};

export async function notifyStoreOrderStage(storeOrder, storeStatus = storeOrder?.status) {
  const entry = STORE_STAGES[storeStatus];
  if (!entry || !storeOrder?.sourceOrderId) return null;
  const stage = entry.stage(storeOrder);
  if (!stage) return null;

  const context = `store ${storeStatus}`;
  try {
    const order = await EcommerceOrder.findById(storeOrder.sourceOrderId).select(
      "user orderNumber status shipment paymentStatus"
    );
    if (!order?.user || ["cancelled", "delivered"].includes(order.status)) return null;
    if (!(await claimStage(order, stage))) return null;
    const result = await entry.send(order, storeOrder);
    logDispatchResult(context, result);
    return result;
  } catch (error) {
    logDispatchFailure(context, error);
    return null;
  }
}

export async function notifyOrderCreated(order, { previousStatus = null } = {}) {
  if (!order?.user) {
    return null;
  }

  try {
    // A pure pre-order is only "confirmed" once the dark store's vendor accepts it.
    const departments = order.departments || [];
    const awaitsVendor =
      Boolean(order.preOrderSlot) && departments.length > 0 && departments.every((d) => d === "preorder");
    const confirmedAfterPayment = previousStatus === "attempted" && !awaitsVendor;
    if (!(await claimStage(order, confirmedAfterPayment ? "confirm" : "placed"))) return null;
    const result = confirmedAfterPayment ? await sendOrderConfirmed(order) : await sendOrderPlaced(order);
    logDispatchResult("notifyOrderCreated", result);
    return result;
  } catch (error) {
    logDispatchFailure("notifyOrderCreated", error);
    return null;
  }
}

export async function notifyOrderStatusChange(order, previousStatus, options = {}) {
  if (!order?.user || !previousStatus || order.status === previousStatus) {
    return null;
  }
  return notifyOrderStatus(order, options);
}

export async function notifyPaymentSuccess(order, extra = {}) {
  if (!order?.user) {
    return null;
  }

  try {
    return await sendPaymentSuccess(order, extra);
  } catch (error) {
    logDispatchFailure("notifyPaymentSuccess", error);
    return null;
  }
}

export async function notifyPaymentFailed(order, extra = {}) {
  if (!order?.user) {
    return null;
  }

  try {
    return await sendPaymentFailed(order, extra);
  } catch (error) {
    logDispatchFailure("notifyPaymentFailed", error);
    return null;
  }
}

export async function notifyShipmentLabelCreated(order) {
  if (!order?.user) {
    return null;
  }

  try {
    const result = await sendShipmentLabelCreated(order);
    logDispatchResult("notifyShipmentLabelCreated", result);
    return result;
  } catch (error) {
    logDispatchFailure("notifyShipmentLabelCreated", error);
    return null;
  }
}
