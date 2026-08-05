import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true,
    },
    brandImage: {
      type: String,
      required: [true, "Brand image is required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** When true, product prices for this brand are hidden until the customer logs in */
    priceRequiresLogin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
