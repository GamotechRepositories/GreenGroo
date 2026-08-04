import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Order from "../models/order/Order.js";
import { populateOrderItems } from "../utils/orderHelpers.js";
import { notifyOrderStatusChange } from "../services/orderNotificationDispatcher.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";

await connectDB();
getFirebaseAdmin();

const orderId = process.argv[2];
const newStatus = process.argv[3] || "processing";

if (!orderId) {
  console.error("Usage: node scripts/resendOrderStatusNotification.js <orderId> [status]");
  process.exit(1);
}

const existing = await Order.findById(orderId);
if (!existing) {
  console.error("Order not found");
  process.exit(1);
}

const previousStatus = existing.status;
existing.status = newStatus;
await existing.save();

const order = await populateOrderItems(
  Order.findById(orderId).populate("user", "name email phone")
);

console.log("Simulating status change:", previousStatus, "->", newStatus);
const result = await notifyOrderStatusChange(order, previousStatus);
console.log("Result:", JSON.stringify({
  delivered: result?.delivered,
  reason: result?.reason,
  error: result?.error,
  type: result?.notification?.type,
}, null, 2));

await mongoose.disconnect();
