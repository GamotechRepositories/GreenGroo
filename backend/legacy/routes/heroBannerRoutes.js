import express from "express";
import {
  getHeroBanners,
  getAllHeroBanners,
  addHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
} from "../controllers/heroBannerController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getHeroBanners);
router.get("/all", protect, requireAdmin, getAllHeroBanners);
router.post("/", protect, requireAdmin, addHeroBanner);
router.put("/:id", protect, requireAdmin, updateHeroBanner);
router.delete("/:id", protect, requireAdmin, deleteHeroBanner);

export default router;
