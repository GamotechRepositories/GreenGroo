import mongoose from "mongoose";
import bcrypt from "bcrypt";

const documentMetaSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    localPath: { type: String, default: "" },
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
    vehicleType: {
      type: String,
      enum: ["", "motorcycle", "bicycle", "electric", "van", "no_vehicle"],
      default: "",
    },

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

    /// Live availability — changes often (go online/offline anytime).
    status: {
      type: String,
      enum: ["online", "offline"],
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

    isActive: {
      type: Boolean,
      default: true,
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
    vehicleType: this.vehicleType,
    bankDetails: this.bankDetails,
    documents: this.documents,
    selfie: this.selfie,
    livenessPassed: this.livenessPassed,
    status: this.status,
    lastStatusAt: this.lastStatusAt,
    lastSeenAt: this.lastSeenAt,
    isActive: this.isActive,
    onboardingComplete: this.onboardingComplete,
    onboardingStep: this.onboardingStep,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Drop cached model so schema updates apply after restart
if (mongoose.models.DeliveryBoy) {
  delete mongoose.models.DeliveryBoy;
}

const DeliveryBoy = mongoose.model("DeliveryBoy", deliveryBoySchema);

export default DeliveryBoy;
