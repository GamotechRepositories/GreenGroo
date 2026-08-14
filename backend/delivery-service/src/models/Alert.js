import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: [true, "Manager ID is required"],
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "delayed_order",
        "rider_offline_mid_delivery",
        "low_availability",
        "document_pending",
      ],
      required: [true, "Alert type is required"],
    },
    message: {
      type: String,
      required: [true, "Alert message is required"],
      trim: true,
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    relatedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

alertSchema.pre("validate", function (next) {
  if (this.managerId && !this.storeId) {
    this.storeId = this.managerId;
  } else if (this.storeId && !this.managerId) {
    this.managerId = this.storeId;
  }
  next();
});

if (mongoose.models.Alert) {
  delete mongoose.models.Alert;
}

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
