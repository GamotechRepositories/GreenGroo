import express from "express";
import { protect } from "@greengrocc/shared";
import { getOrderTracking, updateOrderStatus } from "../controllers/orderTrackingController.js";
import { getOrderFeedback, submitOrderFeedback } from "../controllers/orderFeedbackController.js";

/**
 * Mounted on /api/orders ahead of the legacy order router. Only these paths are
 * handled here (no router-level middleware), so everything else falls through.
 */
const router = express.Router();

router.get("/:id/tracking", protect, getOrderTracking);
router.patch("/:id/status", protect, updateOrderStatus);
router.get("/:id/feedback", protect, getOrderFeedback);
router.post("/:id/feedback", protect, submitOrderFeedback);

export default router;
