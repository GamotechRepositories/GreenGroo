import mongoose from "mongoose";

const fullTimeRuleSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    ruleName: {
      type: String,
      trim: true,
      default: "Standard Full-Time Rule",
    },
    attendanceStartTime: {
      type: String,
      default: "09:00 AM",
    },
    attendanceEndTime: {
      type: String,
      default: "06:00 PM",
    },
    requireLocationValidation: {
      type: Boolean,
      default: true,
    },
    attendanceRadiusMeters: {
      type: Number,
      default: 200,
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6],
    },
    minimumAttendanceDays: {
      type: Number,
      default: 26,
    },
    notes: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.FullTimeRule) {
  delete mongoose.models.FullTimeRule;
}

const FullTimeRule = mongoose.model("FullTimeRule", fullTimeRuleSchema);
export default FullTimeRule;
