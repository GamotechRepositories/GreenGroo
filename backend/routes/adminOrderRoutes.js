import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { getAllOrders, updateOrder } from "../controllers/orderController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/", getAllOrders);
router.patch("/:id", updateOrder);

export default router;
