import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { getFirebaseMessaging } from "../config/firebaseAdmin.js";

const ORDERS_CHANNEL_ID = "orders";

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

function isValidFcmToken(token) {
  return typeof token === "string" && token.trim().length > 20;
}

function stringifyDataPayload(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value == null ? "" : String(value)])
  );
}

function buildOrderData(order, extra = {}) {
  const shipment = order?.shipment || {};
  return stringifyDataPayload({
    type: extra.type || "order",
    orderId: order?._id?.toString() || "",
    orderNumber: order?.orderNumber || "",
    status: order?.status || "",
    trackingNumber: shipment.trackingNumber || "",
    trackUrl: shipment.trackUrl || "",
    shipmentNote: shipment.note || "",
    evidenceUrl: shipment.evidenceUrl || "",
    evidenceName: shipment.evidenceName || "",
    ...extra,
  });
}

async function clearUserFcmToken(userId) {
  await User.findByIdAndUpdate(userId, {
    $set: {
      fcmToken: "",
      lastTokenUpdatedAt: new Date(),
    },
  });
  console.warn(`NotificationService: cleared invalid FCM token for user ${userId}`);
}

async function persistNotification({
  userId,
  title,
  body,
  type,
  orderId = null,
  data = {},
  fcmSent = false,
  fcmError = "",
}) {
  return Notification.create({
    user: userId,
    title,
    body,
    type,
    order: orderId,
    data,
    fcmSent,
    fcmError,
  });
}

async function handleMessagingError(error, userId) {
  const errorCode = error?.code || error?.errorInfo?.code || "";
  const message = error?.message || "FCM delivery failed";

  if (INVALID_TOKEN_ERROR_CODES.has(errorCode)) {
    await clearUserFcmToken(userId);
  }

  console.error(`NotificationService: FCM error [${errorCode || "unknown"}] — ${message}`);
  return message;
}

export async function sendToToken(token, { title, body, data = {} }) {
  if (!isValidFcmToken(token)) {
    return {
      success: false,
      error: "Invalid FCM token",
      skipped: true,
    };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return {
      success: false,
      error: "Firebase messaging is not configured",
      skipped: true,
    };
  }

  try {
    const messageId = await messaging.send({
      token: token.trim(),
      notification: {
        title,
        body,
      },
      data: stringifyDataPayload(data),
      android: {
        priority: "high",
        notification: {
          channelId: ORDERS_CHANNEL_ID,
          priority: "high",
        },
      },
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "FCM delivery failed",
      code: error?.code || error?.errorInfo?.code || "",
    };
  }
}

export async function sendToMultipleTokens(tokens, { title, body, data = {} }) {
  const validTokens = [...new Set(tokens.filter(isValidFcmToken).map((token) => token.trim()))];

  if (!validTokens.length) {
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      error: "No valid FCM tokens provided",
    };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return {
      success: false,
      successCount: 0,
      failureCount: validTokens.length,
      error: "Firebase messaging is not configured",
    };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body },
      data: stringifyDataPayload(data),
      android: {
        priority: "high",
        notification: {
          channelId: ORDERS_CHANNEL_ID,
          priority: "high",
        },
      },
    });

    return {
      success: response.failureCount === 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error("NotificationService: multicast send failed —", error.message);
    return {
      success: false,
      successCount: 0,
      failureCount: validTokens.length,
      error: error.message,
    };
  }
}

async function deliverToUser(userId, { title, body, type, order = null, data = {} }) {
  const resolvedUserId = userId?._id || userId;
  const user = await User.findById(resolvedUserId).select("fcmToken");
  if (!user) {
    return {
      success: false,
      error: "User not found",
      notification: null,
    };
  }

  const payloadData = {
    ...data,
    type,
    orderId: order?._id?.toString() || data.orderId || "",
    orderNumber: order?.orderNumber || data.orderNumber || "",
  };

  const notification = await persistNotification({
    userId: resolvedUserId,
    title,
    body,
    type,
    orderId: order?._id || null,
    data: payloadData,
    fcmSent: false,
  });

  if (!isValidFcmToken(user.fcmToken)) {
    return {
      success: true,
      delivered: false,
      notification,
      reason: "No FCM token registered",
    };
  }

  const result = await sendToToken(user.fcmToken, {
    title,
    body,
    data: payloadData,
  });

  if (result.success) {
    notification.fcmSent = true;
    notification.fcmError = "";
    await notification.save();

    return {
      success: true,
      delivered: true,
      notification,
      messageId: result.messageId,
    };
  }

  const fcmError = await handleMessagingError(
    { message: result.error, code: result.code },
    resolvedUserId
  );

  notification.fcmError = fcmError;
  await notification.save();

  return {
    success: true,
    delivered: false,
    notification,
    error: fcmError,
  };
}

function orderRef(order) {
  const num = order?.orderNumber;
  return num ? `Order #${num}` : "Your order";
}

function paymentSuccessMessage(order, extra = {}) {
  const ref = orderRef(order);

  if (extra.paymentMode === "cod_advance") {
    return `${ref}: 10% advance payment received. Pay the remaining amount on delivery.`;
  }

  if (extra.source === "upi_manual") {
    return `${ref}: UPI payment verified. Your order is confirmed.`;
  }

  return `${ref}: Payment received successfully. We are processing your order.`;
}

function paymentFailedMessage(order, extra = {}) {
  const ref = orderRef(order);

  if (extra.reason === "payment_rejected") {
    return `${ref}: UPI payment was not approved. Please pay again or contact support.`;
  }

  return `${ref}: Payment could not be completed. Open the app to retry or contact support.`;
}

export async function sendOrderPlaced(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Order Received",
    body: `${ref} is placed successfully. We will confirm it shortly.`,
    type: "order_placed",
    order,
    data: buildOrderData(order, { type: "order_placed" }),
  });
}

export async function sendOrderConfirmed(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Order Confirmed",
    body: `${ref} is confirmed. We will start packing your items soon.`,
    type: "order_confirmed",
    order,
    data: buildOrderData(order, { type: "order_confirmed" }),
  });
}

export async function sendOrderPacked(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Order Packed",
    body: `${ref} is packed and ready to ship.`,
    type: "order_packed",
    order,
    data: buildOrderData(order, { type: "order_packed" }),
  });
}

export async function sendOrderShipped(order) {
  const ref = orderRef(order);
  const tracking = order?.shipment?.trackingNumber || "";
  const note = order?.shipment?.note || "";
  const bodyParts = [`${ref} has been shipped.`];
  if (tracking) bodyParts.push(`Tracking: ${tracking}`);
  if (note) bodyParts.push(note);

  return deliverToUser(order.user, {
    title: "Order Shipped",
    body: bodyParts.join(" "),
    type: "order_shipped",
    order,
    data: buildOrderData(order, { type: "order_shipped" }),
  });
}

export async function sendShipmentLabelCreated(order) {
  const ref = orderRef(order);
  const tracking = order?.shipment?.trackingNumber || "";
  const note = order?.shipment?.note || "";
  const hasEvidence = Boolean(order?.shipment?.evidenceUrl);
  const bodyParts = [`${ref} shipment label created.`];
  if (tracking) bodyParts.push(`Tracking: ${tracking}`);
  if (note) bodyParts.push(note);
  if (hasEvidence) bodyParts.push("Shipment photo attached.");

  return deliverToUser(order.user, {
    title: "Shipment Update",
    body: bodyParts.join(" "),
    type: "shipment_label_created",
    order,
    data: buildOrderData(order, { type: "shipment_label_created" }),
  });
}

export async function sendOutForDelivery(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Out for Delivery",
    body: `${ref} is on the way. Please keep your phone available.`,
    type: "out_for_delivery",
    order,
    data: buildOrderData(order, { type: "out_for_delivery" }),
  });
}

export async function sendDelivered(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Order Delivered",
    body: `${ref} has been delivered. Thank you for shopping with Bulk Mobile Mart!`,
    type: "order_delivered",
    order,
    data: buildOrderData(order, { type: "order_delivered" }),
  });
}

export async function sendPaymentSuccess(order, extra = {}) {
  return deliverToUser(order.user, {
    title: "Payment Received",
    body: paymentSuccessMessage(order, extra),
    type: "payment_success",
    order,
    data: buildOrderData(order, { type: "payment_success", ...extra }),
  });
}

export async function sendPaymentFailed(order, extra = {}) {
  return deliverToUser(order.user, {
    title: "Payment Failed",
    body: paymentFailedMessage(order, extra),
    type: "payment_failed",
    order,
    data: buildOrderData(order, { type: "payment_failed", ...extra }),
  });
}

export async function sendShipmentStatusUpdate(order, { status, statusDescription, trackUrl } = {}) {
  const ref = orderRef(order);
  const detail = statusDescription || status || "Tracking updated";
  return deliverToUser(order.user, {
    title: `${ref} — Tracking update`,
    body: detail,
    type: "shipment_tracking",
    order,
    data: buildOrderData(order, {
      type: "shipment_tracking",
      status: status || "",
      trackUrl: trackUrl || "",
    }),
  });
}

export async function sendOffer(userId, { title, body, data = {} }) {
  return deliverToUser(userId, {
    title,
    body,
    type: "offer",
    data: stringifyDataPayload({ ...data, type: "offer" }),
  });
}

export async function sendCustomNotification(userId, { title, body, type = "custom", data = {} }) {
  return deliverToUser(userId, {
    title,
    body,
    type,
    data: stringifyDataPayload({ ...data, type }),
  });
}

export async function sendTestNotification(userId) {
  return deliverToUser(userId, {
    title: "Bulk Mobile Mart",
    body: "Notifications are working. You will receive order updates here.",
    type: "test",
    data: { type: "test" },
  });
}
