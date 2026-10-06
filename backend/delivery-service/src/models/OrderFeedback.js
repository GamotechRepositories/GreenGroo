import mongoose from "mongoose";

const productFeedbackSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "GreenGroccProduct", required: true },
    name: { type: String, default: "", trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { _id: false }
);

/** One post-delivery feedback per customer order: the rider and each product. */
const orderFeedbackSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserBulkMart", required: true, index: true },
    storeOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreOrder", default: null },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryBoy", default: null, index: true },
    riderRating: { type: Number, min: 1, max: 5, default: null },
    riderComment: { type: String, default: "", trim: true, maxlength: 1000 },
    riderTags: { type: [String], default: [] },
    products: { type: [productFeedbackSchema], default: [] },
    skipped: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderFeedbackSchema.index({ order: 1, user: 1 }, { unique: true });

const OrderFeedback =
  mongoose.models.OrderFeedback || mongoose.model("OrderFeedback", orderFeedbackSchema);

export default OrderFeedback;
