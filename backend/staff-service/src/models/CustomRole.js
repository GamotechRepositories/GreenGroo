import mongoose from "mongoose";

const customRoleSchema = new mongoose.Schema(
  {
    roleKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: "Operations",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "admin",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.CustomRole) {
  delete mongoose.models.CustomRole;
}

const CustomRole = mongoose.model("CustomRole", customRoleSchema);

export default CustomRole;
