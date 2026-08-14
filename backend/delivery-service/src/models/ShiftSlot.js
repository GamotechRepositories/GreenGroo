import mongoose from "mongoose";

const shiftSlotSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ["morning", "midday", "evening_peak", "late_night"],
      required: [true, "Shift slot type is required"],
    },
    label: {
      type: String,
      required: [true, "Slot label is required"],
      trim: true,
    },
    start: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    end: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: [true, "Created by manager ID is required"],
    },
  },
  { timestamps: true }
);

shiftSlotSchema.pre("validate", function (next) {
  if (this.managerId && !this.storeId) {
    this.storeId = this.managerId;
  } else if (this.storeId && !this.managerId) {
    this.managerId = this.storeId;
  }
  next();
});

if (mongoose.models.ShiftSlot) {
  delete mongoose.models.ShiftSlot;
}

const ShiftSlot = mongoose.model("ShiftSlot", shiftSlotSchema);

export default ShiftSlot;
