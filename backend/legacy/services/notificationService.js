import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { getCustomerFirebaseMessaging } from "../config/firebaseAdmin.js";

const ORDERS_CHANNEL_ID = "orders";

// Not "invalid-argument": that can mean a bad payload, not a bad token.
const DEAD_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

function isValidFcmToken(token) {
  return typeof token === "string" && token.trim().length > 20;
}

function userTokens(user) {
  return [
    ...new Set(
      [user?.fcmToken, ...(user?.fcmTokens || [])].filter(isValidFcmToken).map((token) => token.trim())
    ),
  ];
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

async function pruneDeadTokens(deadTokens) {
  const tokens = [...new Set(deadTokens.filter(Boolean))];
  if (!tokens.length) return;
  const now = new Date();
  await Promise.all([
    User.updateMany({ fcmTokens: { $in: tokens } }, { $pull: { fcmTokens: { $in: tokens } } }),
    User.updateMany({ fcmToken: { $in: tokens } }, { $set: { fcmToken: "", lastTokenUpdatedAt: now } }),
  ]);
  console.warn(`NotificationService: removed ${tokens.length} expired FCM token(s)`);
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

/**
 * `notification` + high priority makes Android show the push from the system
 * tray even when the app is killed; `data` is used for tap navigation.
 */
function buildMessage({ title, body, data = {}, imageUrl = "" }) {
  const image = String(imageUrl || "").trim();
  return {
    notification: {
      title,
      ...(body ? { body } : {}),
      ...(image ? { imageUrl: image } : {}),
    },
    data: stringifyDataPayload(data),
    android: {
      priority: "high",
      notification: {
        channelId: ORDERS_CHANNEL_ID,
        priority: "high",
        sound: "default",
        defaultVibrateTimings: true,
        visibility: "public",
        ...(image ? { imageUrl: image } : {}),
      },
    },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default", "mutable-content": 1 } },
      ...(image ? { fcmOptions: { imageUrl: image } } : {}),
    },
  };
}

export async function sendToToken(token, { title, body, data = {}, imageUrl = "" }) {
  if (!isValidFcmToken(token)) {
    return { success: false, error: "Invalid FCM token", skipped: true };
  }

  const messaging = getCustomerFirebaseMessaging();
  if (!messaging) {
    return { success: false, error: "Customer Firebase messaging is not configured", skipped: true };
  }

  try {
    const messageId = await messaging.send({
      token: token.trim(),
      ...buildMessage({ title, body, data, imageUrl }),
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

export async function sendToMultipleTokens(tokens, { title, body, data = {}, imageUrl = "" }) {
  const validTokens = [...new Set(tokens.filter(isValidFcmToken).map((token) => token.trim()))];

  if (!validTokens.length) {
    return { success: false, successCount: 0, failureCount: 0, error: "No valid FCM tokens provided" };
  }

  const messaging = getCustomerFirebaseMessaging();
  if (!messaging) {
    return {
      success: false,
      successCount: 0,
      failureCount: validTokens.length,
      error: "Customer Firebase messaging is not configured",
    };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: validTokens,
      ...buildMessage({ title, body, data, imageUrl }),
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
  const user = await User.findById(resolvedUserId).select("fcmToken fcmTokens");
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

  const tokens = userTokens(user);
  if (!tokens.length) {
    return {
      success: true,
      delivered: false,
      notification,
      reason: "No FCM token registered",
    };
  }

  const result = await sendToMultipleTokens(tokens, {
    title,
    body,
    data: payloadData,
  });

  const dead = [];
  const errors = [];
  (result.responses || []).forEach((res, index) => {
    if (res.success) return;
    const code = res.error?.code || res.error?.errorInfo?.code || "";
    if (DEAD_TOKEN_ERROR_CODES.has(code)) dead.push(tokens[index]);
    errors.push(`[${code || "unknown"}] ${res.error?.message || "FCM delivery failed"}`);
  });
  await pruneDeadTokens(dead);

  if (result.successCount > 0) {
    notification.fcmSent = true;
    notification.fcmError = "";
    await notification.save();

    return {
      success: true,
      delivered: true,
      notification,
      devices: result.successCount,
    };
  }

  const fcmError = errors[0] || result.error || "FCM delivery failed";
  console.error(`NotificationService: FCM error — ${fcmError}`);
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

export async function sendPreOrderConfirmed(order, { date = "", slot = "" } = {}) {
  const ref = orderRef(order);
  const when = [date, slot].filter(Boolean).join(", ");
  return deliverToUser(order.user, {
    title: "Pre-order Confirmed",
    body: `${ref} is confirmed by the store${when ? ` for ${when}` : ""}.`,
    type: "preorder_confirmed",
    order,
    data: buildOrderData(order, { type: "preorder_confirmed" }),
  });
}

export async function sendPreOrderAtStore(order, { storeName = "" } = {}) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Pre-order Reached Store",
    body: `${ref} has reached ${storeName || "your dark store"}. A delivery partner will be assigned soon.`,
    type: "preorder_at_store",
    order,
    data: buildOrderData(order, { type: "preorder_at_store" }),
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
    body: `${ref} has been delivered. Tap to rate your delivery partner and products.`,
    type: "order_delivered",
    order,
    data: buildOrderData(order, { type: "order_delivered", action: "rate_order" }),
  });
}

export async function sendRiderAssigned(order, rider = {}) {
  const ref = orderRef(order);
  const name = String(rider.name || "").trim() || "A delivery partner";
  const phone = String(rider.phone || "").trim();
  return deliverToUser(order.user, {
    title: "Delivery Partner Assigned",
    body: `${name} will deliver ${ref.toLowerCase() === "your order" ? "your order" : ref}.${
      phone ? ` Contact: ${phone}` : ""
    }`,
    type: "rider_assigned",
    order,
    data: buildOrderData(order, { type: "rider_assigned", riderName: name, riderPhone: phone }),
  });
}

export function formatDelayMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(" ") || "a few minutes";
}

export async function sendDeliveryDelayed(order, { minutes = 0, message = "" } = {}) {
  const ref = orderRef(order);
  const late = formatDelayMinutes(minutes);
  return deliverToUser(order.user, {
    title: "Delivery Delayed",
    body: message || `${ref} is running about ${late} late. Sorry for the wait — it's on the way.`,
    type: "delivery_delayed",
    order,
    data: buildOrderData(order, { type: "delivery_delayed", delayMinutes: minutes }),
  });
}

export async function sendDeliveryFailed(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Delivery Attempt Failed",
    body: `We couldn't deliver ${ref}. Our team will contact you to reschedule.`,
    type: "delivery_failed",
    order,
    data: buildOrderData(order, { type: "delivery_failed" }),
  });
}

export async function sendOrderCancelled(order) {
  const ref = orderRef(order);
  const refund =
    order?.paymentStatus === "refundable"
      ? " Your refund will be processed to the original payment method."
      : "";
  return deliverToUser(order.user, {
    title: "Order Cancelled",
    body: `${ref} has been cancelled.${refund}`,
    type: "order_cancelled",
    order,
    data: buildOrderData(order, { type: "order_cancelled" }),
  });
}

export async function sendOrderReturned(order) {
  const ref = orderRef(order);
  return deliverToUser(order.user, {
    title: "Return Update",
    body: `${ref} has been marked for return. We will keep you posted on the refund.`,
    type: "order_returned",
    order,
    data: buildOrderData(order, { type: "order_returned" }),
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

const MULTICAST_LIMIT = 500;
const INSERT_CHUNK = 1000;

/**
 * Save an in-app notification for every user and push to all registered
 * devices using FCM multicast (500 tokens per call), so large audiences are
 * reached within seconds.
 */
export async function broadcastToUsers(users, { title, body, type, data = {}, imageUrl = "" }) {
  const payloadData = stringifyDataPayload({ ...data, type });
  const summary = { targetedUsers: users.length, inAppSaved: 0, pushDelivered: 0, pushFailed: 0, noToken: 0 };
  if (!users.length) return summary;

  const notificationIdByUser = new Map();
  for (let i = 0; i < users.length; i += INSERT_CHUNK) {
    const docs = await Notification.insertMany(
      users.slice(i, i + INSERT_CHUNK).map((user) => ({
        user: user._id,
        title,
        body,
        type,
        data: { ...payloadData, ...(imageUrl ? { imageUrl } : {}) },
        fcmSent: false,
      })),
      { ordered: false }
    );
    docs.forEach((doc) => notificationIdByUser.set(String(doc.user), doc._id));
  }
  summary.inAppSaved = notificationIdByUser.size;

  const targets = users.flatMap((user) => userTokens(user).map((token) => ({ user, token })));
  const usersWithToken = new Set(targets.map((target) => String(target.user._id)));
  summary.noToken = users.length - usersWithToken.size;
  if (!targets.length) return summary;

  const messaging = getCustomerFirebaseMessaging();
  if (!messaging) {
    summary.pushFailed = usersWithToken.size;
    summary.error = "Customer Firebase messaging is not configured";
    return summary;
  }

  const deliveredUsers = new Set();
  const dead = [];
  for (let i = 0; i < targets.length; i += MULTICAST_LIMIT) {
    const batch = targets.slice(i, i + MULTICAST_LIMIT);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch.map((target) => target.token),
        ...buildMessage({ title, body, data: payloadData, imageUrl }),
      });
      response.responses.forEach((res, index) => {
        const target = batch[index];
        if (res.success) {
          deliveredUsers.add(String(target.user._id));
          return;
        }
        const code = res.error?.code || res.error?.errorInfo?.code || "";
        if (DEAD_TOKEN_ERROR_CODES.has(code)) dead.push(target.token);
      });
    } catch (error) {
      console.error("NotificationService: broadcast batch failed —", error.message);
    }
  }

  summary.pushDelivered = deliveredUsers.size;
  summary.pushFailed = usersWithToken.size - deliveredUsers.size;
  const delivered = [...deliveredUsers].map((userId) => notificationIdByUser.get(userId)).filter(Boolean);
  await Promise.all([
    delivered.length ? Notification.updateMany({ _id: { $in: delivered } }, { $set: { fcmSent: true } }) : null,
    pruneDeadTokens(dead),
  ]);

  return summary;
}

export async function sendTestNotification(userId) {
  return deliverToUser(userId, {
    title: "GreenGrocc",
    body: "Notifications are working. You will receive order updates here.",
    type: "test",
    data: { type: "test" },
  });
}
