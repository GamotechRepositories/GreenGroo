import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkMobileMartProduct",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    variantName: {
      type: String,
      trim: true,
      default: "",
    },
    colorName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: [true, "User reference is required"],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model(
  "BulkMobileMartCart",
  cartSchema,
  "bulkmobilemartcarts"
);

export default Cart;
