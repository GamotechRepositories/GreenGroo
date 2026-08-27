import express from "express";
import { protect, requireAdmin, optionalProtect } from "../middleware/authMiddleware.js";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  getAvailableCoupons,
  getCouponById,
  seedCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

// Customer / Public routes
router.get("/available", optionalProtect, getAvailableCoupons);
router.post("/validate", optionalProtect, validateCoupon);

// Seed route (before param routes)
router.post("/seed", seedCoupons);
router.get("/seed", seedCoupons);

// Admin & Management operations
router.get("/", getAllCoupons);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
