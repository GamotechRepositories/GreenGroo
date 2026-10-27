import express from "express";
import {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  reorderBanners,
  importDefaults,
  deleteBanner,
} from "../controllers/bannerController.js";
import { protect, requireAdmin } from "../../../legacy/middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getBanners);
router.get("/all", protect, requireAdmin, getAllBanners);
router.post("/", protect, requireAdmin, createBanner);
router.post("/import-defaults", protect, requireAdmin, importDefaults);
router.put("/reorder", protect, requireAdmin, reorderBanners);
router.put("/:id", protect, requireAdmin, updateBanner);
router.delete("/:id", protect, requireAdmin, deleteBanner);

export default router;
