import express from "express";
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
} from "../controllers/categoryController.js";

const router = express.Router();

// Public / Customer routes
router.get("/", getCategories);
router.get("/all", getAllCategories);
router.get("/:id", getCategoryById);

// Admin operations
router.post("/", createCategory);
router.post("/seed", seedCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
