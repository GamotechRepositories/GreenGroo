import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    subcategories: {
      type: [String],
      default: [],
    },
    slug: {
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
    sectionName: {
      type: String,
      trim: true,
      default: "",
    },
    categoryImage: {
      type: String,
      required: [true, "Category image is required"],
      trim: true,
    },
    storeType: {
      type: String,
      trim: true,
      default: "",
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

const Category = mongoose.model("GreenGroccCategory", categorySchema);

export default Category;
