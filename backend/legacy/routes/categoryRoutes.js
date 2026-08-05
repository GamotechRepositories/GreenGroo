import express from "express";
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/all", protect, requireAdmin, getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, requireAdmin, addCategory);
router.put("/:id", protect, requireAdmin, updateCategory);
router.delete("/:id", protect, requireAdmin, deleteCategory);
export default router;
