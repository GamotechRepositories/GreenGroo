import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  getAlertsForStore,
  markAlertRead,
} from "../controllers/alertController.js";

const router = express.Router();

router.get("/", protect, requireDeliveryManager, getAlertsForStore);
router.patch("/:alertId/read", protect, requireDeliveryManager, markAlertRead);

export default router;
