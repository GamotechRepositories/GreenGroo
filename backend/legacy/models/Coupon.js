import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    appliesToAllProducts: {
      type: Boolean,
      default: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRedemptionsPerUser: {
      type: Number,
      default: null,
      min: 1,
    },
    maxTotalRedemptions: {
      type: Number,
      default: null,
      min: 1,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
