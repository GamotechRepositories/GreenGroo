import mongoose from "mongoose";

const staffNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["all", "role", "staff"],
      default: "all",
      index: true,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    targetStaffId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
      index: true,
    },
    category: {
      type: String,
      enum: ["general", "salary", "meeting", "policy", "shift", "holiday", "announcement", "leave"],
      default: "general",
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readBy: {
      type: [String],
      default: [],
    },
    sentBy: {
      type: String,
      default: "Admin Operations",
      trim: true,
    },
  },
  { timestamps: true }
);

staffNotificationSchema.index({ createdAt: -1 });

if (mongoose.models.StaffNotification) {
  delete mongoose.models.StaffNotification;
}

const StaffNotification = mongoose.model("StaffNotification", staffNotificationSchema);

export default StaffNotification;
