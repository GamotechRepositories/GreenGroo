import mongoose from "mongoose";

const rewardSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "reward_settings",
      unique: true,
      immutable: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Earning Rules: Earn `pointsEarned` for every `spendAmount` spent
    earningRate: {
      spendAmount: {
        type: Number,
        default: 100,
        min: [1, "Spend amount must be at least 1"],
      },
      pointsEarned: {
        type: Number,
        default: 10,
        min: [0, "Points earned must be 0 or more"],
      },
    },
    minOrderAmountToEarn: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount to earn must be 0 or more"],
    },
    // Redemption Rules: 1 point = `pointValueInRupees` INR
    pointValueInRupees: {
      type: Number,
      default: 1.0,
      min: [0.01, "Point value must be greater than 0"],
    },
    minPointsToRedeem: {
      type: Number,
      default: 10,
      min: [0, "Minimum points to redeem must be 0 or more"],
    },
    maxRedemptionPercent: {
      type: Number,
      default: 50,
      min: [1, "Max redemption percent must be at least 1"],
      max: [100, "Max redemption percent cannot exceed 100"],
    },
    maxPointsPerOrder: {
      type: Number,
      default: 1000,
      min: [0, "Max points per order must be 0 (unlimited) or more"],
    },
    minOrderAmountToRedeem: {
      type: Number,
      default: 100,
      min: [0, "Minimum order amount to redeem must be 0 or more"],
    },
    termsAndConditions: {
      type: [String],
      default: () => [
        "Earn 10 Reward Points for every ₹100 spent on successful orders.",
        "1 Reward Point is equivalent to ₹1.00 discount on future orders.",
        "A minimum of 10 points is required to start redeeming.",
        "You can pay up to 50% of your cart subtotal using reward points per order.",
        "Reward points are credited automatically once your order is confirmed.",
        "If an order is cancelled or refunded, any reward points used will be restored, and points earned on that order will be revoked.",
        "Reward points are non-transferable and cannot be exchanged for cash.",
        "GreenGrocc reserves the right to modify or terminate the reward points program terms at any time.",
      ],
    },
    welcomeBonusPoints: {
      type: Number,
      default: 0,
      min: [0, "Welcome bonus points must be 0 or more"],
    },
  },
  { timestamps: true }
);

const RewardSetting =
  mongoose.models.RewardSetting ||
  mongoose.model("RewardSetting", rewardSettingSchema);

export default RewardSetting;
