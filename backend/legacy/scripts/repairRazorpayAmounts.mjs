import "dotenv/config";
import mongoose from "mongoose";
import razorpay, { isRazorpayConfigured } from "../config/razorpay.js";
import Order from "../models/order/Order.js";
import {
  getRazorpayPaymentId,
  getRazorpayTransactionAmount,
  RAZORPAY_SUCCESS_PAYMENT_STATUSES,
} from "../utils/paymentHelpers.js";

const SUCCESSFUL_RAZORPAY_STATUSES = new Set(["captured", "authorized"]);

async function fetchRazorpayCapturedAmount(paymentId) {
  if (!isRazorpayConfigured() || !paymentId) return null;

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (!payment || !SUCCESSFUL_RAZORPAY_STATUSES.has(payment.status)) {
      return null;
    }

    return Math.round(Number(payment.amount) / 100 * 100) / 100;
  } catch (error) {
    console.warn(`Failed to fetch ${paymentId}:`, error?.error?.description || error.message);
    return null;
  }
}

await mongoose.connect(process.env.MONGODB_URI);

const orders = await Order.find({
  $or: [
    { razorpayPaymentId: { $nin: ["", null] } },
    { codAdvanceRazorpayPaymentId: { $nin: ["", null] } },
  ],
  paymentStatus: { $in: RAZORPAY_SUCCESS_PAYMENT_STATUSES },
})
  .select(
    "orderNumber paymentStatus total codAdvanceAmount razorpayPaidAmount razorpayPaymentId codAdvanceRazorpayPaymentId"
  )
  .lean();

let repaired = 0;
let skipped = 0;

for (const order of orders) {
  const paymentId = getRazorpayPaymentId(order);
  const storedAmount = getRazorpayTransactionAmount(order);
  const apiAmount = await fetchRazorpayCapturedAmount(paymentId);

  if (apiAmount == null) {
    skipped += 1;
    continue;
  }

  const updates = {};
  if (Number(order.razorpayPaidAmount) !== apiAmount) {
    updates.razorpayPaidAmount = apiAmount;
  }
  if (order.paymentStatus === "paid_10" && Number(order.codAdvanceAmount) !== apiAmount) {
    updates.codAdvanceAmount = apiAmount;
  }

  if (!Object.keys(updates).length) {
    continue;
  }

  await Order.updateOne({ _id: order._id }, { $set: updates });
  repaired += 1;
  console.log(
    `Repaired order ${order.orderNumber}: ${storedAmount} -> ${apiAmount} (${paymentId})`
  );
}

console.log(`Done. Repaired ${repaired}, skipped ${skipped}, scanned ${orders.length}.`);
await mongoose.disconnect();
