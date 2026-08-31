import mongoose from "mongoose";

const driverOfferHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: true,
      index: true,
    },
    darkStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true,
      index: true,
    },
    offeredAt: { type: Date, required: true, default: Date.now },
    respondedAt: { type: Date, default: null },
    response: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "TIMEOUT"],
      default: "PENDING",
    },
    distanceMeters: { type: Number, default: null },
  },
  { timestamps: true }
);

driverOfferHistorySchema.index({ orderId: 1, driverId: 1 });

const DriverOfferHistory =
  mongoose.models.DriverOfferHistory ||
  mongoose.model("DriverOfferHistory", driverOfferHistorySchema);

export default DriverOfferHistory;
