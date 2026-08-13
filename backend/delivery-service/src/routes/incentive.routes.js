import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  getRiderIncentives,
  getStoreIncentiveSummary,
} from "../controllers/incentiveController.js";

const router = express.Router();

router.get("/rider", protect, getRiderIncentives);
router.get("/store-summary", protect, requireDeliveryManager, getStoreIncentiveSummary);

export default router;
