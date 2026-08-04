import mongoose from "mongoose";

const PHONE_PATTERN = /^[6789]\d{9}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared address fields — used by Address model and order delivery snapshot */
export const addressFieldDefinitions = {
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  number: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator(value) {
        return PHONE_PATTERN.test(value);
      },
      message: "Phone must be 10 digits and start with 6, 7, 8, or 9",
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    validate: {
      validator(value) {
        return EMAIL_PATTERN.test(value);
      },
      message: "Enter a valid email address",
    },
  },
  shopNo: {
    type: String,
    required: [true, "Shop number is required"],
    trim: true,
  },
  shopName: {
    type: String,
    required: [true, "Shop name is required"],
    trim: true,
  },
  fullAddress: {
    type: String,
    required: [true, "Full address is required"],
    trim: true,
  },
  landmark: {
    type: String,
    required: [true, "Landmark is required"],
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, "Pincode is required"],
    validate: {
      validator(value) {
        return PINCODE_PATTERN.test(value);
      },
      message: "Pincode must be 6 digits",
    },
  },
};

/** Snapshot embedded on orders (same fields, no user/isDefault) */
export const addressSnapshotSchema = new mongoose.Schema(addressFieldDefinitions, {
  _id: false,
});

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserBulkMart",
      required: true,
      index: true,
    },
    ...addressFieldDefinitions,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model(
  "BulkMobileMartAddress",
  addressSchema,
  "addresses"
);

export default Address;
