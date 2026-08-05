import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);

export default router;
