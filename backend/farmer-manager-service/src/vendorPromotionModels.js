import mongoose from "mongoose";

const vendorCouponSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, trim: true, default: "" },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    appliesToAllProducts: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxRedemptionsPerUser: { type: Number, default: null, min: 1 },
    maxTotalRedemptions: { type: Number, default: null, min: 1 },
  },
  { timestamps: true }
);
vendorCouponSchema.index({ vendorId: 1, code: 1 }, { unique: true });

const vendorGiftCardSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "redeemed", "disabled", "expired"], default: "active", index: true },
    expiresAt: { type: Date, default: null },
    issuedToName: { type: String, default: "", trim: true },
    issuedToPhone: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);
vendorGiftCardSchema.index({ vendorId: 1, code: 1 }, { unique: true });

const vendorPricingRuleSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
    minQuantity: { type: Number, required: true, min: 1, default: 10 },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 0, default: 5 },
    applyTo: { type: String, enum: ["all", "products", "categories"], default: "all" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId }],
    categoryNames: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const vendorRewardSettingSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, trim: true, unique: true },
    enabled: { type: Boolean, default: true },
    earningRate: {
      spendAmount: { type: Number, default: 100, min: [1, "Spend amount must be at least 1"] },
      pointsEarned: { type: Number, default: 10, min: [0, "Points earned must be 0 or more"] },
    },
    minOrderAmountToEarn: { type: Number, default: 0, min: 0 },
    pointValueInRupees: { type: Number, default: 1.0, min: [0.01, "Point value must be greater than 0"] },
    minPointsToRedeem: { type: Number, default: 10, min: 0 },
    maxRedemptionPercent: {
      type: Number,
      default: 50,
      min: [1, "Max redemption percent must be at least 1"],
      max: [100, "Max redemption percent cannot exceed 100"],
    },
    maxPointsPerOrder: { type: Number, default: 1000, min: 0 },
    minOrderAmountToRedeem: { type: Number, default: 100, min: 0 },
    termsAndConditions: { type: [String], default: [] },
    welcomeBonusPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const VendorCoupon = mongoose.models.VendorCoupon || mongoose.model("VendorCoupon", vendorCouponSchema);
export const VendorGiftCard = mongoose.models.VendorGiftCard || mongoose.model("VendorGiftCard", vendorGiftCardSchema);
export const VendorPricingRule =
  mongoose.models.VendorPricingRule || mongoose.model("VendorPricingRule", vendorPricingRuleSchema);
export const VendorRewardSetting =
  mongoose.models.VendorRewardSetting || mongoose.model("VendorRewardSetting", vendorRewardSettingSchema);
