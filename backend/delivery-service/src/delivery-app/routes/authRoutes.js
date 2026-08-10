import express from "express";
import { protect } from "@greengrocc/shared";
import {
  getAreaManager,
  heartbeat,
  login,
  me,
  register,
  updateOnboarding,
  updateStatus,
} from "../controllers/authController.js";
import {
  bookShift,
  getShiftBooking,
} from "../controllers/shiftController.js";
import { getLoginHours } from "../controllers/gigController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/area-manager", protect, getAreaManager);
router.patch("/onboarding", protect, updateOnboarding);
router.patch("/status", protect, updateStatus);
router.post("/heartbeat", protect, heartbeat);
router.post("/shift-booking", protect, bookShift);
router.get("/shift-booking/:riderId", protect, getShiftBooking);
router.get("/login-hours", protect, getLoginHours);

export default router;
