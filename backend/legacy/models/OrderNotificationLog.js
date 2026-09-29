import mongoose from "mongoose";

/**
 * One row per (order, stage) that has already been announced to the customer.
 * Several code paths — and the change-stream safety net — may report the same
 * status change; the unique index lets only the first one send a push.
 */
const orderNotificationLogSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    stage: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
  },
  { versionKey: false }
);

orderNotificationLogSchema.index({ order: 1, stage: 1 }, { unique: true });

const OrderNotificationLog = mongoose.model("OrderNotificationLog", orderNotificationLogSchema);

export default OrderNotificationLog;
