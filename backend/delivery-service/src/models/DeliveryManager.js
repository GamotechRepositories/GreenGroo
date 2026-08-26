import mongoose from "mongoose";
import bcrypt from "bcrypt";

const deliveryManagerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
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
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    cityId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
      index: true,
    },
    storeName: {
      type: String,
      trim: true,
      default: "",
    },
    storeAddress: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    latitude: {
      type: Number,
      default: 18.559,
    },
    longitude: {
      type: Number,
      default: 73.7868,
    },
    geofenceRadius: {
      type: Number,
      default: 500, // 500 meters allowed radius
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

deliveryManagerSchema.index({ cityId: 1, area: 1 });

deliveryManagerSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

deliveryManagerSchema.methods.comparePassword = async function comparePassword(
  candidate
) {
  return bcrypt.compare(candidate, this.password);
};

deliveryManagerSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    state: this.state,
    city: this.city,
    cityId: this.cityId,
    area: this.area,
    storeName: this.storeName || `${this.area} Store`,
    storeAddress:
      this.storeAddress ||
      `${this.storeName || `${this.area} Store`}, ${this.area}, ${this.city}, ${this.state}`,
    pincode: this.pincode || "",
    latitude: this.latitude ?? 18.559,
    longitude: this.longitude ?? 73.7868,
    geofenceRadius: this.geofenceRadius ?? 500,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.DeliveryManager) {
  delete mongoose.models.DeliveryManager;
}
if (mongoose.models.Manager) {
  delete mongoose.models.Manager;
}

const DeliveryManager = mongoose.model(
  "DeliveryManager",
  deliveryManagerSchema
);

try {
  mongoose.model("Manager", deliveryManagerSchema);
} catch (e) {}

export default DeliveryManager;

