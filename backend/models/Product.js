import mongoose from "mongoose";

const bulkPricingSlabSchema = new mongoose.Schema(
  {
    minQuantity: {
      type: Number,
      required: [true, "Slab min quantity is required"],
      min: [1, "Slab min quantity must be at least 1"],
    },
    maxQuantity: {
      type: Number,
      default: null,
      validate: {
        validator(value) {
          return value == null || value >= 1;
        },
        message: "Slab max quantity must be at least 1",
      },
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Slab price per unit is required"],
      min: [0, "Slab price cannot be negative"],
    },
    originalPricePerUnit: {
      type: Number,
      min: [0, "Original slab price cannot be negative"],
      default: null,
    },
  },
  { _id: false }
);

const bulkPricingSchema = new mongoose.Schema(
  {
    slabs: {
      type: [bulkPricingSlabSchema],
      default: [],
    },
  },
  { _id: false }
);

const productColorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
    },
    hex: {
      type: String,
      trim: true,
      default: "#cccccc",
    },
  },
  { _id: false }
);

const productSpecificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Specification name is required"],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Specification value is required"],
      trim: true,
    },
  },
  { _id: false }
);

const productVariantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    pricingType: {
      type: String,
      enum: ["single", "bulk"],
      default: "single",
    },
    bulkPricing: {
      type: bulkPricingSchema,
      default: () => ({ slabs: [] }),
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    discountedPrice: {
      type: Number,
      min: [0, "Discounted price cannot be negative"],
      default: 0,
    },
    discountedPercent: {
      type: Number,
      min: [0, "Discounted percent cannot be negative"],
      max: [100, "Discounted percent cannot exceed 100"],
      default: 0,
    },
    stock: {
      type: Number,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    colors: {
      type: [productColorSchema],
      default: [],
    },
    minOrderQuantity: {
      type: Number,
      min: [1, "Minimum order quantity must be at least 1"],
      default: null,
    },
    stepByQuantity: {
      type: Number,
      min: [1, "Step by quantity must be at least 1"],
      default: null,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    categories: {
      type: [String],
      required: [true, "At least one category is required"],
      validate: [
        {
          validator(value) {
            return Array.isArray(value) && value.length >= 1;
          },
          message: "At least 1 category is required",
        },
        {
          validator(value) {
            return value.length <= 4;
          },
          message: "Maximum 4 categories allowed",
        },
      ],
    },
    subcategory: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
    },
    subcategories: {
      type: [String],
      default: [],
    },
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    variantType: {
      type: String,
      enum: ["single", "multi"],
      default: "single",
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    pricingType: {
      type: String,
      enum: ["single", "bulk"],
      default: "single",
    },
    bulkPricing: {
      type: bulkPricingSchema,
      default: () => ({ slabs: [] }),
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Discounted price cannot be negative"],
    },
    discountedPercent: {
      type: Number,
      required: [true, "Discounted percent is required"],
      min: [0, "Discounted percent cannot be negative"],
      max: [100, "Discounted percent cannot exceed 100"],
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    stock: {
      type: Number,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    colors: {
      type: [productColorSchema],
      default: [],
    },
    minOrderQuantity: {
      type: Number,
      min: [1, "Minimum order quantity must be at least 1"],
      default: null,
    },
    stepByQuantity: {
      type: Number,
      min: [1, "Step by quantity must be at least 1"],
      default: null,
    },
    productImages: {
      type: [String],
      required: [true, "At least one product image is required"],
      validate: {
        validator(value) {
          return (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((img) => typeof img === "string" && img.trim())
          );
        },
        message: "At least one valid product image URL is required",
      },
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    specifications: {
      type: [productSpecificationSchema],
      default: [],
    },
    warranty: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    justArrived: {
      type: Boolean,
      default: false,
      index: true,
    },
    hotSelling: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ categories: 1, subcategory: 1 });
productSchema.index({ subcategories: 1 });
productSchema.index(
  { sku: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $type: "string", $gt: "" } },
  }
);

const Product = mongoose.model(
  "BulkMobileMartProduct",
  productSchema,
  "bulkmobilemartproducts"
);

export default Product;
