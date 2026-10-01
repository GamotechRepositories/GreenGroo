import mongoose from "mongoose";

const fullTimeAttendanceSchema = new mongoose.Schema(
  {
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "pending",
    },
    markedAt: {
      type: Date,
      default: null,
    },
    locationLat: {
      type: Number,
      default: null,
    },
    locationLng: {
      type: Number,
      default: null,
    },
    distanceFromStoreMeters: {
      type: Number,
      default: null,
    },
    validationPassed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

fullTimeAttendanceSchema.index({ deliveryBoyId: 1, date: 1 }, { unique: true });

if (mongoose.models.FullTimeAttendance) {
  delete mongoose.models.FullTimeAttendance;
}

const FullTimeAttendance = mongoose.model("FullTimeAttendance", fullTimeAttendanceSchema);
export default FullTimeAttendance;
