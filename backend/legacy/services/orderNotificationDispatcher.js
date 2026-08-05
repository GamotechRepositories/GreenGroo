import {
  sendOrderPlaced,
  sendOrderConfirmed,
  sendOrderPacked,
  sendOrderShipped,
  sendShipmentLabelCreated,
  sendOutForDelivery,
  sendDelivered,
  sendPaymentSuccess,
  sendPaymentFailed,
} from "./notificationService.js";

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

export async function notifyOrderCreated(order, { previousStatus = null } = {}) {
  if (!order?.user) {
    return null;
  }

  try {
    const result =
      previousStatus === "attempted"
        ? await sendOrderConfirmed(order)
        : await sendOrderPlaced(order);
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

  try {
    let result = null;

    if (options.notificationStage === "out_for_delivery") {
      result = await sendOutForDelivery(order);
    } else {
      switch (order.status) {
        case "confirm":
          if (previousStatus !== "confirm") {
            result = await sendOrderConfirmed(order);
          }
          break;
        case "processing":
          result = await sendOrderPacked(order);
          break;
        case "shipping":
          result = await sendOrderShipped(order);
          break;
        case "delivered":
          result = await sendDelivered(order);
          break;
        default:
          break;
      }
    }

    logDispatchResult(
      `notifyOrderStatusChange ${previousStatus} -> ${order.status}`,
      result
    );
    return result;
  } catch (error) {
    logDispatchFailure("notifyOrderStatusChange", error);
    return null;
  }
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
