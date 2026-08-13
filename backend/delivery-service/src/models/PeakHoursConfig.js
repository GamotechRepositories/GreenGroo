import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const dayPeakSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    ranges: { type: [timeRangeSchema], default: [] },
  },
  { _id: false }
);

const peakHoursConfigSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    peakHours: {
      type: [dayPeakSchema],
      default: [],
    },
  },
  { timestamps: true }
);

if (mongoose.models.PeakHoursConfig) {
  delete mongoose.models.PeakHoursConfig;
}

const PeakHoursConfig = mongoose.model("PeakHoursConfig", peakHoursConfigSchema);

export default PeakHoursConfig;
