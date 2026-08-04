import mongoose from "mongoose";
import { addressSnapshotSchema } from "../address/Address.js";

const orderItemSchema = new mongoose.Schema(
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
    variantName: { type: String, default: "" },
    colorName: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: true }
);

const orderGiftHamperGiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    image: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

const orderGiftHamperSchema = new mongoose.Schema(
  {
    minOrderAmount: { type: Number, required: true, min: 0 },
    gift: {
      type: orderGiftHamperGiftSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      default: null,
    },
    adminNote: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      validate: {
        validator(value) {
          return !value || /^\d{6}$/.test(value);
        },
        message: "Order number must be a 6-digit number",
      },
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(v) {
          return v.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    deliveryAddress: {
      type: addressSnapshotSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    subtotal: { type: Number, required: true },
    couponCode: { type: String, default: "", trim: true, uppercase: true },
    couponDiscount: { type: Number, default: 0, min: 0 },
    deliveryCharges: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["attempted", "confirm", "processing", "shipping", "delivered", "cancelled", "return"],
      default: "confirm",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid_10", "paid", "refundable", "pending_verification"],
      default: "unpaid",
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    codAdvanceAmount: { type: Number, default: 0, min: 0 },
    razorpayPaidAmount: { type: Number, default: 0, min: 0 },
    codAdvanceRazorpayPaymentId: { type: String, default: "" },
    codAdvancePaidAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    shipment: {
      type: new mongoose.Schema(
        {
          provider: { type: String, default: "" },
          carrier: { type: String, default: "" },
          service: { type: String, default: "" },
          shipmentId: { type: String, default: "" },
          trackingNumber: { type: String, default: "" },
          trackUrl: { type: String, default: "" },
          labelUrl: { type: String, default: "" },
          status: { type: String, default: "" },
          statusMessage: { type: String, default: "" },
          syncedAt: { type: Date, default: null },
          events: {
            type: [
              new mongoose.Schema(
                {
                  status: { type: String, default: "" },
                  date: { type: String, default: "" },
                  location: { type: String, default: "" },
                  description: { type: String, default: "" },
                },
                { _id: false }
              ),
            ],
            default: () => [],
          },
          note: { type: String, default: "", trim: true, maxlength: 500 },
          evidenceUrl: { type: String, default: "", trim: true, maxlength: 500 },
          evidenceName: { type: String, default: "", trim: true, maxlength: 200 },
          manualTracking: {
            type: new mongoose.Schema(
              {
                enabled: { type: Boolean, default: false },
                note: { type: String, default: "", trim: true, maxlength: 500 },
                evidenceUrl: { type: String, default: "", trim: true, maxlength: 500 },
                evidenceName: { type: String, default: "", trim: true, maxlength: 200 },
                updatedAt: { type: Date, default: null },
              },
              { _id: false }
            ),
            default: () => ({
              enabled: false,
              note: "",
              evidenceUrl: "",
              evidenceName: "",
              updatedAt: null,
            }),
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    giftHamper: {
      type: orderGiftHamperSchema,
      default: null,
    },
  },
  { timestamps: true }
);

function applyDeliveredPaymentRule(update) {
  if (!update) return;

  const $set = update.$set || update;
  if ($set.status === "delivered") {
    if (update.$set) {
      update.$set.paymentStatus = "paid";
    } else {
      update.paymentStatus = "paid";
    }
  }
}

orderSchema.pre("findOneAndUpdate", function setPaidOnDeliveredUpdate() {
  applyDeliveredPaymentRule(this.getUpdate());
});

orderSchema.pre("save", async function preSaveOrder() {
  if (this.isModified("status") && this.status === "delivered") {
    this.paymentStatus = "paid";
  }

  if (
    this.isModified("status") &&
    (this.status === "cancelled" || this.status === "return") &&
    this.paymentMethod === "online" &&
    this.paymentStatus === "paid"
  ) {
    this.paymentStatus = "refundable";
  }

  if (this.orderNumber && /^\d{6}$/.test(this.orderNumber)) return;

  const OrderModel = this.constructor;
  let orderNumber;
  let exists = true;

  while (exists) {
    orderNumber = String(Math.floor(100000 + Math.random() * 900000));
    exists = await OrderModel.exists({ orderNumber });
  }

  this.orderNumber = orderNumber;
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
