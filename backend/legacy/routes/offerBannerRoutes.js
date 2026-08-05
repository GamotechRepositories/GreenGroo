import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  addOfferBanner,
  deleteOfferBanner,
  getAllOfferBanners,
  getOfferBanners,
  updateOfferBanner,
} from "../controllers/offerBannerController.js";

const router = express.Router();

router.get("/", getOfferBanners);
router.get("/all", protect, requireAdmin, getAllOfferBanners);
router.post("/", protect, requireAdmin, addOfferBanner);
router.put("/:id", protect, requireAdmin, updateOfferBanner);
router.delete("/:id", protect, requireAdmin, deleteOfferBanner);

export default router;
