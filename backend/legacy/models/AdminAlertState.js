import mongoose from "mongoose";

const adminAlertStateSchema = new mongoose.Schema(
  {
    alertKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      default: "admin",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminAlertStateSchema.index({ alertKey: 1, userId: 1 }, { unique: true });

const AdminAlertState =
  mongoose.models.AdminAlertState || mongoose.model("AdminAlertState", adminAlertStateSchema);

export default AdminAlertState;
