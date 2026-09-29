import mongoose from "mongoose";

const scheduledNotificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["retail", "bulk", "all"], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: "", trim: true, maxlength: 1000 },
    imageUrl: { type: String, default: "", trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    sendAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "sending", "sent", "cancelled", "failed"],
      default: "scheduled",
      index: true,
    },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

scheduledNotificationSchema.index({ status: 1, sendAt: 1 });

const ScheduledNotification = mongoose.model("ScheduledNotification", scheduledNotificationSchema);

export default ScheduledNotification;
