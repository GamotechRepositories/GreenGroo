import mongoose from "mongoose";

const incentiveSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: [true, "Rider ID is required"],
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: [true, "Store ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    targetBonusEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

incentiveSchema.index({ riderId: 1, date: 1 }, { unique: true });

if (mongoose.models.Incentive) {
  delete mongoose.models.Incentive;
}

const Incentive = mongoose.model("Incentive", incentiveSchema);

export default Incentive;
