import mongoose from "mongoose";

export const SUPPORT_ISSUE_TYPES = [
  "payment",
  "order",
  "return_refund",
  "product_inquiry",
  "delivery",
  "place_order",
  "other",
];

const supportMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    orderId: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    issueType: {
      type: String,
      required: true,
      enum: SUPPORT_ISSUE_TYPES,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    attachment: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ createdAt: -1 });
supportMessageSchema.index({ status: 1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
