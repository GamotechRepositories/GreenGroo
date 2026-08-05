import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import User from "../models/user.js";
import Order from "../models/order/Order.js";
import Notification from "../models/Notification.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import {
  sendTestNotification,
  sendOrderPlaced,
  sendOrderConfirmed,
  sendOrderPacked,
  sendOrderShipped,
  sendOutForDelivery,
  sendDelivered,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendOffer,
  sendCustomNotification,
} from "../services/notificationService.js";

const PHONE = process.argv[2] || "7499972072";

function summarize(result) {
  if (!result) return { ok: false, detail: "no result" };
  return {
    ok: Boolean(result.delivered),
    delivered: result.delivered ?? false,
    reason: result.reason || result.error || "",
    type: result.notification?.type || "",
  };
}

await connectDB();

const firebaseApp = getFirebaseAdmin();
const firebaseReady = Boolean(firebaseApp);

const user = await User.findOne({ phone: PHONE }).select(
  "_id phone name fcmToken deviceType lastTokenUpdatedAt"
);
if (!user) {
  console.error("User not found for phone:", PHONE);
  process.exit(1);
}

const order = await Order.findOne({ user: user._id })
  .sort({ updatedAt: -1 })
  .select("_id orderNumber status user");

const checks = [];

checks.push({
  name: "Firebase Admin",
  ok: firebaseReady,
  detail: firebaseReady ? "initialized" : "not configured",
});

checks.push({
  name: "FCM token registered",
  ok: Boolean(user.fcmToken && user.fcmToken.length > 20),
  detail: user.fcmToken
    ? `len=${user.fcmToken.length}, device=${user.deviceType}`
    : "missing",
});

if (!order) {
  checks.push({
    name: "Sample order for order/payment tests",
    ok: false,
    detail: "no order found for user",
  });
} else {
  const tests = [
    ["Test", () => sendTestNotification(user._id)],
    ["Order Placed", () => sendOrderPlaced(order)],
    ["Order Confirmed", () => sendOrderConfirmed(order)],
    ["Order Packed", () => sendOrderPacked(order)],
    ["Order Shipped", () => sendOrderShipped(order)],
    ["Out For Delivery", () => sendOutForDelivery(order)],
    ["Order Delivered", () => sendDelivered(order)],
    ["Payment Success", () => sendPaymentSuccess(order, { paymentMode: "online" })],
    ["Payment Failed", () => sendPaymentFailed(order, { reason: "test" })],
    [
      "Offer",
      () =>
        sendOffer(user._id, {
          title: "Offer Test",
          body: "Testing offer notification",
          data: { offerId: "" },
        }),
    ],
    [
      "Custom",
      () =>
        sendCustomNotification(user._id, {
          title: "Custom Test",
          body: "Testing custom notification",
          type: "custom",
        }),
    ],
  ];

  for (const [label, fn] of tests) {
    try {
      const result = await fn();
      const summary = summarize(result);
      checks.push({
        name: label,
        ok: summary.ok,
        detail: summary.ok
          ? `delivered (${summary.type || "ok"})`
          : summary.reason || "not delivered",
      });
    } catch (error) {
      checks.push({
        name: label,
        ok: false,
        detail: error.message || "error",
      });
    }
  }
}

const recent = await Notification.find({ user: user._id })
  .sort({ createdAt: -1 })
  .limit(12)
  .select("title type fcmSent fcmError createdAt")
  .lean();

console.log("\n=== Notification System Check ===");
console.log(`User: ${user.name} (${user.phone})`);
console.log(`Firebase: ${firebaseReady ? "OK" : "FAIL"}`);
console.log(`FCM token: ${user.fcmToken ? "OK" : "MISSING"}\n`);

let passed = 0;
let failed = 0;
for (const check of checks) {
  const status = check.ok ? "PASS" : "FAIL";
  if (check.ok) passed += 1;
  else failed += 1;
  console.log(`${status}  ${check.name} — ${check.detail}`);
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);

console.log("\nRecent notifications in DB:");
for (const n of recent) {
  console.log({
    title: n.title,
    type: n.type,
    fcmSent: n.fcmSent,
    fcmError: n.fcmError || "",
    at: n.createdAt,
  });
}

await mongoose.disconnect();
process.exit(failed > 0 ? 1 : 0);
