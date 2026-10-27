import mongoose from "mongoose";

export const BANNER_SECTIONS = ["preorder", "ready2cook", "instantorder"];
export const BANNER_PLACEMENTS = ["hero", "shop", "mid", "offer", "stories", "category"];
export const BANNER_DEVICES = ["desktop", "mobile"];

/** Storefront banner: one image for one section × placement × device. */
const bannerSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: BANNER_SECTIONS,
      required: true,
      lowercase: true,
      trim: true,
    },
    placement: {
      type: String,
      enum: BANNER_PLACEMENTS,
      required: true,
      lowercase: true,
      trim: true,
    },
    device: {
      type: String,
      enum: BANNER_DEVICES,
      required: true,
      default: "desktop",
    },
    imageUrl: {
      type: String,
      required: [true, "Banner image is required"],
      trim: true,
    },
    alt: { type: String, trim: true, default: "", maxlength: 200 },
    linkUrl: { type: String, trim: true, default: "" },
    /** "category" placement: category key such as fruits, dryfruits, beverages. */
    category: { type: String, trim: true, lowercase: true, default: "" },
    /** "stories" placement: tapping the banner plays this video instead of opening `linkUrl`. */
    videoUrl: { type: String, trim: true, default: "" },
    /** Fade colour behind the overlay text (hex), used by text banners. */
    bgColor: { type: String, trim: true, default: "" },
    /** Text overlay, used by the "offer" and "category" placements. */
    tag: { type: String, trim: true, default: "", maxlength: 40 },
    title: { type: String, trim: true, default: "", maxlength: 120 },
    subtitle: { type: String, trim: true, default: "", maxlength: 200 },
    offerText: { type: String, trim: true, default: "", maxlength: 60 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    /** Set on banners created by the website-defaults import so it never imports one twice. */
    seedKey: { type: String, trim: true, default: undefined },
  },
  { timestamps: true }
);

bannerSchema.index({ section: 1, placement: 1, device: 1, order: 1 });
bannerSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

const Banner = mongoose.models.GreenGroccBanner || mongoose.model("GreenGroccBanner", bannerSchema);

export default Banner;
