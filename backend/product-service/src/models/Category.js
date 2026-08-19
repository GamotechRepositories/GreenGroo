import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      default: "greengrocc",
      trim: true,
      lowercase: true,
      index: true,
    },
    sectionName: {
      type: String,
      default: "GreenGrocc",
      trim: true,
    },
    categoryImage: {
      type: String,
      default: "",
      trim: true,
    },
    itemCount: {
      type: String,
      default: "",
      trim: true,
    },
    emoji: {
      type: String,
      default: "",
      trim: true,
    },
    bg: {
      type: String,
      default: "#E8F5E9",
      trim: true,
    },
    bgClass: {
      type: String,
      default: "",
      trim: true,
    },
    subcategories: {
      type: [String],
      default: [],
    },
    storeType: {
      type: String,
      default: "main",
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
  },
  { timestamps: true }
);

categorySchema.pre("save", function () {
  if (!this.slug && this.categoryName) {
    this.slug = this.categoryName.trim();
  }
  if (!this.section) {
    this.section = "greengrocc";
  }
  if (!this.sectionName) {
    this.sectionName =
      this.section === "ready2cook"
        ? "Ready2Cook"
        : this.section === "supermall"
        ? "SuperMall"
        : "GreenGrocc";
  }
});

const Category =
  mongoose.models.GreenGroccCategory ||
  mongoose.model("GreenGroccCategory", categorySchema);

export default Category;
