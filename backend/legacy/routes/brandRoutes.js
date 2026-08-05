import express from "express";
import {
  getBrands,
  getAllBrands,
  getBrandById,
  addBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getBrands);
router.get("/all", protect, requireAdmin, getAllBrands);
router.get("/:id", getBrandById);
router.post("/", protect, requireAdmin, addBrand);
router.put("/:id", protect, requireAdmin, updateBrand);
router.delete("/:id", protect, requireAdmin, deleteBrand);

export default router;
