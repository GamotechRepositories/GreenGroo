import mongoose from "mongoose";
import bcrypt from "bcrypt";

const documentMetaSchema = new mongoose.Schema(
  {
    /// AWS S3 hosted image URL
    url: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "captured", "uploaded", "verified", "rejected"],
      default: "pending",
    },
    capturedAt: { type: Date },
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" },
    upiId: { type: String, default: "" },
  },
  { _id: false }
);

const deliveryBoySchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },

    // Filled later during onboarding
    language: {
      type: String,
      enum: ["en", "hi", "mr", "ta", "te", "kn"],
      default: "en",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    cityId: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      index: true,
    },
    storeId: {
      type: String,
      trim: true,
      default: "",
    },
    vehicleType: {
      type: String,
      enum: ["", "motorcycle", "bicycle", "electric", "van", "no_vehicle"],
      default: "",
    },

    // Add near "rating" — right after vehicleType, before bankDetails
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalRatingsCount: { type: Number, default: 0 },

    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },

    documents: {
      aadhaar: { type: documentMetaSchema, default: () => ({}) },
      pan: { type: documentMetaSchema, default: () => ({}) },
      passport: { type: documentMetaSchema, default: () => ({}) },
      license: { type: documentMetaSchema, default: () => ({}) },
      rc: { type: documentMetaSchema, default: () => ({}) },
      insurance: { type: documentMetaSchema, default: () => ({}) },
    },

    selfie: {
      type: documentMetaSchema,
      default: () => ({}),
    },

    livenessPassed: {
      type: Boolean,
      default: false,
    },
    livenessPassedAt: {
      type: Date,
    },

    /// Live availability — changes often (go online/offline anytime).
    status: {
      type: String,
      enum: ["online", "offline", "on_delivery"],
      default: "offline",
      index: true,
    },
    lastStatusAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastOnlineAt: {
      type: Date,
    },
    lastOfflineAt: {
      type: Date,
    },

    // Add anywhere near status/lastSeenAt fields
    fcmToken: { type: String, default: "" },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },

    todayOnlineMinutes: {
      type: Number,
      default: 0,
    },
    todayOnlineDate: {
      type: String,
      default: "",
    },
    todayCompletedOrders: {
      type: Number,
      default: 0,
    },
    todayOrderCount: {
      type: Number,
      default: 0,
    },
    todayEarnings: {
      type: Number,
      default: 0,
    },

    // Add near todayEarnings — right after it
    walletBalance: { type: Number, default: 0 },
    totalLifetimeEarnings: { type: Number, default: 0 },

    lastOrderAssignedAt: {
      type: Date,
    },
    lastOrderCompletedAt: {
      type: Date,
    },
    onlineSince: {
      type: Date,
    },
    roundRobinPosition: {
      type: Number,
      default: 0,
    },
    lastAssignedAt: {
      type: Date,
    },

    /// Active shift slot booking pointer.
    currentBooking: {
      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        default: null,
      },
      slotId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // Add near currentBooking (similar "active reference" pattern)
    activeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    pendingSlotAlerts: [
      {
        message: { type: String, default: "" },
        startTime: { type: String, default: "" },
        endTime: { type: String, default: "" },
        dateString: { type: String, default: "" },
        seen: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
    /// Manager must approve new joiners for their area before they take orders.
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verificationNote: {
      type: String,
      trim: true,
      default: "",
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: String,
      enum: [
        "vehicle",
        "city",
        "area",
        "documents",
        "selfie",
        "liveness",
        "home",
      ],
      default: "vehicle",
    },
  },
  { timestamps: true }
);

deliveryBoySchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

deliveryBoySchema.methods.comparePassword = async function comparePassword(
  candidate
) {
  return bcrypt.compare(candidate, this.password);
};

deliveryBoySchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    phone: this.phone,
    name: this.name,
    language: this.language,
    city: this.city,
    cityId: this.cityId,
    area: this.area,
    managerId: this.managerId ? this.managerId.toString() : "",
    storeId: this.storeId || (this.managerId ? this.managerId.toString() : ""),
    vehicleType: this.vehicleType,
    rating: this.rating !== undefined ? this.rating : 5,
    totalRatingsCount: this.totalRatingsCount || 0,
    bankDetails: this.bankDetails,
    documents: this.documents,
    selfie: this.selfie,
    livenessPassed: this.livenessPassed,
    livenessPassedAt: this.livenessPassedAt,
    status: this.status,
    lastStatusAt: this.lastStatusAt,
    lastSeenAt: this.lastSeenAt,
    lastOnlineAt: this.lastOnlineAt,
    lastOfflineAt: this.lastOfflineAt,
    fcmToken: this.fcmToken || "",
    currentLocation:
      this.currentLocation?.lat != null && this.currentLocation?.lng != null
        ? {
            lat: this.currentLocation.lat,
            lng: this.currentLocation.lng,
            updatedAt: this.currentLocation.updatedAt,
          }
        : null,
    todayOnlineMinutes: this.todayOnlineMinutes || 0,
    todayOnlineDate: this.todayOnlineDate || "",
    todayCompletedOrders: this.todayCompletedOrders || 0,
    todayOrderCount: this.todayOrderCount || this.todayCompletedOrders || 0,
    todayEarnings: this.todayEarnings || 0,
    walletBalance: this.walletBalance || 0,
    totalLifetimeEarnings: this.totalLifetimeEarnings || 0,
    lastOrderAssignedAt: this.lastOrderAssignedAt || this.lastAssignedAt,
    lastAssignedAt: this.lastAssignedAt || this.lastOrderAssignedAt,
    currentBooking: this.currentBooking?.shiftId
      ? {
          shiftId: this.currentBooking.shiftId.toString(),
          slotId: this.currentBooking.slotId ? this.currentBooking.slotId.toString() : "",
          bookingId: this.currentBooking.bookingId ? this.currentBooking.bookingId.toString() : "",
        }
      : null,
    activeOrderId: this.activeOrderId ? this.activeOrderId.toString() : null,
    isActive: this.isActive,
    verificationStatus: this.verificationStatus || "pending",
    verifiedAt: this.verifiedAt,
    verificationNote: this.verificationNote || "",
    onboardingComplete: this.onboardingComplete,
    onboardingStep: this.onboardingStep,
    pendingSlotAlerts: (this.pendingSlotAlerts || [])
      .filter((a) => !a.seen)
      .map((a) => ({
        message: a.message || "",
        startTime: a.startTime || "",
        endTime: a.endTime || "",
        dateString: a.dateString || "",
        createdAt: a.createdAt,
      })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Drop cached model so schema updates apply after restart
if (mongoose.models.DeliveryBoy) {
  delete mongoose.models.DeliveryBoy;
}
if (mongoose.models.Rider) {
  delete mongoose.models.Rider;
}

const DeliveryBoy = mongoose.model("DeliveryBoy", deliveryBoySchema);

try {
  mongoose.model("Rider", deliveryBoySchema);
} catch (e) {}

export default DeliveryBoy;
