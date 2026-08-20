import mongoose from "mongoose";
import bcrypt from "bcrypt";

const PHONE_PATTERN = /^[6789]\d{9}$/;

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator(value) {
          return PHONE_PATTERN.test(value);
        },
        message: "Phone must be 10 digits and start with 6, 7, 8, or 9",
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
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      default: "vendor",
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true, collection: "vendors" }
);

vendorSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

vendorSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const Vendor = mongoose.model("VendorAccount", vendorSchema);

export default Vendor;
