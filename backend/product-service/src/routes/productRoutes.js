import express from "express";
import {
  getProducts,
  getAllProducts,
  getProductById,
  getSimilarProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getNextProductId,
} from "../../../legacy/controllers/productController.js";

const router = express.Router();

// Public & Listing routes
router.get("/", getProducts);
router.get("/all", getAllProducts);
router.get("/next-id", getNextProductId);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id", getProductById);

// Admin CRUD operations
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

