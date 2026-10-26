import mongoose from "mongoose";

/** Parent shown on the category page: Section → Category → Base product → Product */
const baseProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Base product name is required"],
      trim: true,
    },
    /** Same value stored on products as `baseProductId` */
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const BaseProduct =
  mongoose.models.GreenGroccBaseProduct ||
  mongoose.model("GreenGroccBaseProduct", baseProductSchema);

export default BaseProduct;
