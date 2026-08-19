import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Section slug is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    emoji: {
      type: String,
      trim: true,
      default: "🌿",
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "#10B981",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

sectionSchema.pre("save", function () {
  if (!this.slug && this.sectionName) {
    this.slug = this.sectionName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

const Section =
  mongoose.models.GreenGroccSection ||
  mongoose.model("GreenGroccSection", sectionSchema);

export default Section;
