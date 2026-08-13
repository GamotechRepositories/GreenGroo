import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  createOrder,
  getOrdersForStore,
  manualAssignOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Order creation (mock / manual)
router.post("/", protect, createOrder);

// Manager order endpoints
router.get("/store", protect, requireDeliveryManager, getOrdersForStore);
router.post("/assign", protect, requireDeliveryManager, manualAssignOrder);

// Rider status update
router.patch("/:orderId/status", protect, updateOrderStatus);

export default router;
