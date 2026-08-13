import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: [true, "Store ID is required"],
      index: true,
    },
    pickupAddress: {
      type: String,
      trim: true,
      default: "",
    },
    customerAddress: {
      type: String,
      trim: true,
      default: "",
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "packed",
        "pending_rider",
        "assigned",
        "accepted",
        "rejected",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "packed",
      index: true,
    },
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      index: true,
    },
    isPeakOrder: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    peakBonus: {
      type: Number,
      default: 0,
    },
    deliveryOtp: {
      type: String,
      trim: true,
      default: "",
    },
    orderTimestamps: {
      packedAt: { type: Date },
      assignedAt: { type: Date },
      acceptedAt: { type: Date },
      pickedUpAt: { type: Date },
      deliveredAt: { type: Date },
    },
  },
  { timestamps: true }
);

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model("Order", orderSchema);

export default Order;
