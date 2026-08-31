import mongoose from "mongoose";

const pickupVerificationTokenSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true,
      index: true,
    },
    darkStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenExpiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      default: null,
    },
  },
  { timestamps: true }
);

const PickupVerificationToken =
  mongoose.models.PickupVerificationToken ||
  mongoose.model("PickupVerificationToken", pickupVerificationTokenSchema);

export default PickupVerificationToken;
