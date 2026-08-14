import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, trim: true, default: "" },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // store reference — managerId points to Manager
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: [true, "Manager ID is required"],
      index: true,
    },
    // storeId retained for backward compatibility, refs Manager
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      index: true,
    },

    pickupAddress: {
      type: String,
      trim: true,
      default: "",
    },
    customerName: {
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
    customerLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    // FULL STATUS LIFECYCLE
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
      ref: "Rider",
      default: null,
      index: true,
    },
    lastAssignedAt: {
      type: Date,
    },

    items: {
      type: [itemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "online", "wallet"],
      default: "online",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "collected", "paid_online", "failed"],
      default: "pending",
    },
    amountToCollect: {
      type: Number,
      default: 0,
    },
    amountCollected: {
      type: Number,
      default: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },
    isPeakOrder: {
      type: Boolean,
      default: false,
    },
    peakBonus: {
      type: Number,
      default: 0,
    },

    qrData: {
      type: String,
      default: "",
    },
    qrCode: {
      type: String,
      default: "",
    },
    addressUnlocked: {
      type: Boolean,
      default: false,
    },
    addressHiddenAfterDelivery: {
      type: Boolean,
      default: false,
    },
    pickupScannedAt: {
      type: Date,
    },
    pickupScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },

    deliveryProofImageUrl: {
      type: String,
      default: "",
    },
    proofUploadedAt: {
      type: Date,
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
      rejectedAt: { type: Date },
      pickedUpAt: { type: Date },
      outForDeliveryAt: { type: Date },
      deliveredAt: { type: Date },
      cancelledAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Keep managerId & storeId in sync before save
orderSchema.pre("validate", function (next) {
  if (this.managerId && !this.storeId) {
    this.storeId = this.managerId;
  } else if (this.storeId && !this.managerId) {
    this.managerId = this.storeId;
  }
  next();
});

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model("Order", orderSchema);

export default Order;
