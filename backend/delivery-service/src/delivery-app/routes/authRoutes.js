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

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/area-manager", protect, getAreaManager);
router.patch("/onboarding", protect, updateOnboarding);
router.patch("/status", protect, updateStatus);
router.post("/heartbeat", protect, heartbeat);

export default router;
