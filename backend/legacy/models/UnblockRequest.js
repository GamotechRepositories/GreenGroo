import mongoose from "mongoose";

const unblockRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    accountType: {
      type: String,
      default: "retail",
    },
    reason: {
      type: String,
      required: [true, "Reason for unblock request is required"],
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "unblock_requests" }
);

const UnblockRequest =
  mongoose.models.UnblockRequest ||
  mongoose.model("UnblockRequest", unblockRequestSchema);

export default UnblockRequest;
