import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getPublicRewardSettings,
  getMyRewardPoints,
  calculateRewardDiscount,
  getAdminRewardSettings,
  updateAdminRewardSettings,
  getAdminRewardStats,
  getAdminRewardTransactions,
  adminAdjustUserPoints,
} from "../controllers/rewardController.js";

const router = express.Router();

// Public / Authenticated settings
router.get("/settings", getPublicRewardSettings);

// Customer protected routes
router.get("/my-points", protect, getMyRewardPoints);
router.post("/calculate-discount", protect, calculateRewardDiscount);

// Admin protected routes
router.get("/admin/settings", protect, requireAdmin, getAdminRewardSettings);
router.put("/admin/settings", protect, requireAdmin, updateAdminRewardSettings);
router.get("/admin/stats", protect, requireAdmin, getAdminRewardStats);
router.get("/admin/transactions", protect, requireAdmin, getAdminRewardTransactions);
router.post("/admin/adjust", protect, requireAdmin, adminAdjustUserPoints);

export default router;
