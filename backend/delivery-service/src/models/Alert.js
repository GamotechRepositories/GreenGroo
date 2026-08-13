import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: [true, "Store ID is required"],
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
      ref: "DeliveryBoy",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Alert) {
  delete mongoose.models.Alert;
}

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
