import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    alt: {
      type: String,
      default: "BulkMobileMart hero banner",
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
    device: {
      type: String,
      enum: ["desktop", "mobile"],
      default: "desktop",
    },
  },
  { timestamps: true }
);

const HeroBanner = mongoose.model("HeroBanner", heroBannerSchema);

export default HeroBanner;
