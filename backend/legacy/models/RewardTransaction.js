import mongoose from "mongoose";

const rewardTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["earned", "redeemed", "refunded", "reversal", "admin_adjustment", "welcome_bonus"],
      required: true,
    },
    // Positive for points added/earned/refunded, negative for points redeemed/reversed
    points: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

rewardTransactionSchema.index({ user: 1, createdAt: -1 });

const RewardTransaction =
  mongoose.models.RewardTransaction ||
  mongoose.model("RewardTransaction", rewardTransactionSchema);

export default RewardTransaction;
