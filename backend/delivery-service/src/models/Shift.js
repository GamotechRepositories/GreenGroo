import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true,
    },
    deliveryPartnerPhone: {
      type: String,
      default: "",
    },
    deliveryPartnerName: {
      type: String,
      default: "",
    },
    deliveryPartnerProfileImage: {
      type: String,
      default: "",
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
    },
    notificationEnabled: {
      type: Boolean,
      default: false,
    },
    notificationTimeMinutes: {
      type: Number,
      default: 15,
    },
    onlineAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: true, timestamps: true }
);

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true, // e.g. "09:00 AM"
    },
    endTime: {
      type: String,
      required: true, // e.g. "11:00 AM"
    },
    capacity: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "FEW_SPOTS_LEFT", "FULL", "CANCELLED"],
      default: "AVAILABLE",
    },
    bookings: [bookingSchema],
  },
  { _id: true, timestamps: true }
);

const shiftSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    storeId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Shift name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "early_morning",
        "morning",
        "afternoon",
        "evening",
        "night",
        "late_night",
        "custom",
      ],
      default: "morning",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    dateString: {
      type: String,
      required: true,
      index: true, // "YYYY-MM-DD" e.g. "2026-08-12"
    },
    slots: [slotSchema],
    isCustomized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

shiftSchema.index({ managerId: 1, dateString: 1 });
shiftSchema.index({ "slots.bookings.deliveryPartnerId": 1, dateString: 1 });

shiftSchema.methods.toSafeJSON = function toSafeJSON() {
  const safeSlots = (this.slots || []).map((slot) => {
    const remaining = Math.max(0, slot.capacity - slot.bookedCount);
    let computedStatus = slot.status;

    if (slot.status !== "CANCELLED") {
      if (remaining === 0) {
        computedStatus = "FULL";
      } else if (remaining <= 3) {
        computedStatus = "FEW_SPOTS_LEFT";
      } else {
        computedStatus = "AVAILABLE";
      }
    }

    const safeBookings = (slot.bookings || []).map((b) => ({
      bookingId: b._id ? b._id.toString() : b.bookingId,
      deliveryPartnerId: b.deliveryPartnerId ? b.deliveryPartnerId.toString() : "",
      deliveryPartnerPhone: b.deliveryPartnerPhone,
      deliveryPartnerName: b.deliveryPartnerName,
      deliveryPartnerProfileImage: b.deliveryPartnerProfileImage,
      bookedAt: b.bookedAt,
      status: b.status,
      notificationEnabled: b.notificationEnabled,
      notificationTimeMinutes: b.notificationTimeMinutes,
    }));

    return {
      id: slot._id.toString(),
      slotId: slot._id.toString(),
      shiftId: this._id.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      remainingCapacity: remaining,
      spotsRemaining: remaining,
      status: computedStatus,
      bookingsCount: safeBookings.length,
      bookings: safeBookings,
    };
  });

  const totalBooked = safeSlots.reduce((acc, s) => acc + s.bookedCount, 0);
  const totalCapacity = safeSlots.reduce((acc, s) => acc + s.capacity, 0);

  return {
    id: this._id.toString(),
    shiftId: this._id.toString(),
    managerId: this.managerId.toString(),
    storeId: this.storeId || this.managerId.toString(),
    name: this.name,
    shiftName: this.name,
    type: this.type,
    shiftType: this.type,
    date: this.date,
    dateString: this.dateString,
    slotsCount: safeSlots.length,
    slots: safeSlots,
    totalBooked,
    totalCapacity,
    isCustomized: this.isCustomized,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.Shift) {
  delete mongoose.models.Shift;
}

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;
