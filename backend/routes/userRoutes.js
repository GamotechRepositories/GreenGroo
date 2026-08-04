import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { signup, login, loginWithPhone, sendOtpLogin, verifyOtpLogin, completeOtpSignup, resetPasswordWithPhoneOtp, getMe, updateMe, changeMyPassword, sendAdminSecurityOtp, requestAdminPasswordReset, resetAdminPassword, createUser, getUsers, getUserOrderStats, updateUser, deleteUser } from "../controllers/userController.js";
import { saveFcmToken } from "../controllers/fcmTokenController.js";
import {
  addAddressForUser,
  getAddressesForUser,
  updateAddressForUser,
} from "../controllers/addressController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/login/phone", loginWithPhone);
router.post("/admin/forgot-password", requestAdminPasswordReset);
router.post("/admin/reset-password", resetAdminPassword);
router.post("/otp/send", sendOtpLogin);
router.post("/otp/verify", verifyOtpLogin);
router.post("/otp/complete-signup", completeOtpSignup);
router.post("/password/reset", resetPasswordWithPhoneOtp);
router.get("/me", protect, getMe);
router.post("/me/security-otp", protect, sendAdminSecurityOtp);
router.patch("/me", protect, updateMe);
router.patch("/me/password", protect, changeMyPassword);
router.post("/fcm-token", protect, saveFcmToken);
router.get("/", protect, requireAdmin, getUsers);
router.post("/", protect, requireAdmin, createUser);
router.get("/:id/order-stats", protect, requireAdmin, getUserOrderStats);
router.get("/:userId/addresses", protect, requireAdmin, getAddressesForUser);
router.post("/:userId/addresses", protect, requireAdmin, addAddressForUser);
router.put("/:userId/addresses/:addressId", protect, requireAdmin, updateAddressForUser);
router.put("/:id", protect, requireAdmin, updateUser);
router.delete("/:id", protect, requireAdmin, deleteUser);

export default router;
