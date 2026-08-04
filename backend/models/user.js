import mongoose from "mongoose";
import bcrypt from "bcrypt";

const validateName = (value) => {
  const words = value.trim().split(/\s+/);
  if (words.length < 1 || words.length > 2) return false;
  return words.every((word) => /^[A-Za-z]{2,30}$/.test(word));
};
const PHONE_PATTERN = /^[6789]\d{9}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      validate: {
        validator(value) {
          return validateName(value);
        },
        message:
          "Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)",
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator(value) {
          if (!value) return true;
          return /^\S+@\S+\.\S+$/.test(value);
        },
        message: "Please provide a valid email",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator(value) {
          return PHONE_PATTERN.test(value);
        },
        message:
          "Phone must be 10 digits and start with 6, 7, 8, or 9",
      },
    },
    shopNo: {
      type: String,
      trim: true,
      default: "",
    },
    shopName: {
      type: String,
      trim: true,
      default: "",
    },
    shopAddress: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);
        },
        message: "Please provide a valid GST number",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    fcmToken: {
      type: String,
      trim: true,
      default: "",
    },
    deviceType: {
      type: String,
      enum: ["", "android", "ios", "web"],
      default: "",
    },
    lastTokenUpdatedAt: {
      type: Date,
      default: null,
    },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BulkMobileMartAddress",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("validate", function requireAdminCredentials() {
  if (this.role !== "admin") return;

  if (!this.email?.trim()) {
    this.invalidate("email", "Email is required for admin accounts");
  }

  // Password is select:false, so skip on profile updates unless setting a new password.
  if ((this.isNew || this.isModified("password")) && !this.password) {
    this.invalidate("password", "Password is required for admin accounts");
  }
});

userSchema.pre("save", function normalizeOptionalEmail() {
  if (!this.email?.trim()) {
    this.email = undefined;
  }
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model("UserBulkMart", userSchema);

export default User;
