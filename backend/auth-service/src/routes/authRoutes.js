import express from "express";
import {
  signup,
  login,
  loginWithPhone,
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
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/me/password", protect, changeMyPassword);

export default router;
