import mongoose from "mongoose";
import { addressSnapshotSchema } from "../address/Address.js";

const paymentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkMobileMartProduct",
      required: true,
    },
    name: { type: String, required: true },
    brandName: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

export const PAYMENT_SOURCES = ["upi_manual", "razorpay"];
export const PAYMENT_TYPES = ["cod_advance", "online"];
export const PAYMENT_STATUSES = ["pending", "verified", "rejected"];

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: true,
      index: true,
    },
    orderNumber: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: PAYMENT_TYPES,
      required: true,
    },
    source: {
      type: String,
      enum: PAYMENT_SOURCES,
      default: "upi_manual",
    },
    amount: { type: Number, required: true, min: 0 },
    orderTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharges: { type: Number, default: 0, min: 0 },
    items: {
      type: [paymentItemSchema],
      validate: {
        validator(v) {
          return v.length > 0;
        },
        message: "Payment must include at least one product",
      },
    },
    deliveryAddress: {
      type: addressSnapshotSchema,
      required: true,
    },
    screenshot: { type: String, default: "" },
    screenshotName: { type: String, default: "" },
    upiTransactionRef: { type: String, default: "", trim: true, maxlength: 100 },
    customerMessage: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      default: null,
    },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 300 },
    razorpayPaymentId: { type: String, default: "" },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
