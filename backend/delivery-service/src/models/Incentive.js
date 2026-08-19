import mongoose from "mongoose";

const incentiveSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: [true, "Rider ID is required"],
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: [true, "Manager ID is required"],
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
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
    settled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

incentiveSchema.pre("validate", function (next) {
  if (this.managerId && !this.storeId) {
    this.storeId = this.managerId;
  } else if (this.storeId && !this.managerId) {
    this.managerId = this.storeId;
  }
  next();
});

incentiveSchema.index({ riderId: 1, date: 1 }, { unique: true });

if (mongoose.models.Incentive) {
  delete mongoose.models.Incentive;
}

const Incentive = mongoose.model("Incentive", incentiveSchema);

export default Incentive;
