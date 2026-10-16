import express from "express";
import {
  signup,
  login,
  loginWithPhone,
  sendOtpLogin,
  verifyOtpLogin,
  completeOtpSignup,
  resetPasswordWithPhoneOtp,
  sendAdminLoginOtp,
  verifyAdminLoginOtp,
  sendAdminSecurityOtp,
  requestAdminPasswordReset,
  resetAdminPassword,
  createUnblockRequest,
  getMe,
  updateMe,
  changeMyPassword,
} from "../../../legacy/controllers/userController.js";
import { protect } from "../../../legacy/middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/login/phone", loginWithPhone);
router.post("/unblock-request", createUnblockRequest);

// OTP routes for customer login & registration
router.post("/otp/send", sendOtpLogin);
router.post("/otp/verify", verifyOtpLogin);
router.post("/otp/complete-signup", completeOtpSignup);
router.post("/password/reset", resetPasswordWithPhoneOtp);

// Admin OTP login & security
router.post("/admin/otp/send", sendAdminLoginOtp);
router.post("/admin/otp/verify", verifyAdminLoginOtp);
router.post("/admin/forgot-password", requestAdminPasswordReset);
router.post("/admin/reset-password", resetAdminPassword);
router.post("/me/security-otp", protect, sendAdminSecurityOtp);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/me/password", protect, changeMyPassword);

export default router;

