import express from "express";
import {
  getProducts,
  getAllProducts,
  getProductById,
  getProductVarieties,
  getSimilarProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { getProductReviews, createProductReview } from "../controllers/reviewController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/all", protect, requireAdmin, getAllProducts);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);
router.get("/:id/varieties", getProductVarieties);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id", getProductById);
router.post("/", protect, requireAdmin, addProduct);
router.put("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

export default router;
