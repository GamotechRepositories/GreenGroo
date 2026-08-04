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
    categoryImage: {
      type: String,
      required: [true, "Category image is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("BulkMobileMartCategory", categorySchema);

export default Category;
