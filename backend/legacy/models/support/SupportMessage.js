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

/** Same role surface as policies — Users + staff panels. */
export const SUPPORT_ROLE_KEYS = [
  "customer",
  "vendor",
  "segregation_manager",
  "product_manager",
  "farmer_manager",
  "farmer",
  "pickup_driver",
  "delivery_manager",
  "delivery_boy",
  "admin",
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
    /** Which app/role panel the request came from. */
    roleKey: {
      type: String,
      trim: true,
      index: true,
      default: "customer",
      enum: SUPPORT_ROLE_KEYS,
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
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ createdAt: -1 });
supportMessageSchema.index({ status: 1 });
supportMessageSchema.index({ roleKey: 1, status: 1, createdAt: -1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
