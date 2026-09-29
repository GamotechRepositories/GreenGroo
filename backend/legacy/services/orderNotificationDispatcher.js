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
} from "./notificationService.js";
import OrderNotificationLog from "../models/OrderNotificationLog.js";

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

export async function notifyOrderCreated(order, { previousStatus = null } = {}) {
  if (!order?.user) {
    return null;
  }

  try {
    const confirmedAfterPayment = previousStatus === "attempted";
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
