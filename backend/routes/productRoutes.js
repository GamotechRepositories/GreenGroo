import express from "express";
import {
  getProducts,
  getAllProducts,
  getProductById,
  getSimilarProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/all", protect, requireAdmin, getAllProducts);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id", getProductById);
router.post("/", protect, requireAdmin, addProduct);
router.put("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

export default router;
