import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  getRiderIncentives,
  getStoreIncentiveSummary,
  getAvailableIncentives,
} from "../controllers/incentiveController.js";

const router = express.Router();

router.get("/available", protect, getAvailableIncentives);
router.get("/rider", protect, getRiderIncentives);
router.get("/store-summary", protect, requireDeliveryManager, getStoreIncentiveSummary);

export default router;
