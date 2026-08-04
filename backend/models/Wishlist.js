import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkMobileMartProduct",
      required: [true, "Product reference is required"],
    },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
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
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Wishlist = mongoose.model(
  "BulkMobileMartWishlist",
  wishlistSchema,
  "bulkmobilemartwishlists"
);

export default Wishlist;
