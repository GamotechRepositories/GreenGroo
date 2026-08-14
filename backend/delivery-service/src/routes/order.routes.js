import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  createOrder,
  getOrdersForStore,
  manualAssignOrder,
  cancelOrder,
  acceptOrder,
  rejectOrder,
  scanPickup,
  markOutForDelivery,
  uploadProofAndDeliver,
  getRiderActiveOrder,
  getRiderOrderHistory,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Order creation (mock / manual)
router.post("/", protect, createOrder);

// Manager order endpoints
router.get("/store", protect, requireDeliveryManager, getOrdersForStore);
router.post("/assign", protect, requireDeliveryManager, manualAssignOrder);
router.post("/:orderId/cancel", protect, requireDeliveryManager, cancelOrder);

// Rider order endpoints
router.get("/active", protect, getRiderActiveOrder);
router.get("/history", protect, getRiderOrderHistory);
router.post("/:orderId/accept", protect, acceptOrder);
router.post("/:orderId/reject", protect, rejectOrder);
router.post("/:orderId/scan-pickup", protect, scanPickup);
router.post("/:orderId/out-for-delivery", protect, markOutForDelivery);
router.post("/:orderId/deliver", protect, uploadProofAndDeliver);
router.patch("/:orderId/status", protect, updateOrderStatus);

export default router;
