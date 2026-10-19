import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, default: "login" },
    role: { type: String, default: "user" },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

// Compound index for quick lookup
otpSchema.index({ phone: 1, purpose: 1 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
