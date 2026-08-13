import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import {
  createShiftSlot,
  getShiftSlots,
  updateShiftSlot,
  deleteShiftSlot,
  bookShiftSlot,
  getStoreShiftOverview,
} from "../controllers/shiftSlotController.js";

const router = express.Router();

// Manager shift slot management
router.post("/", protect, requireDeliveryManager, createShiftSlot);
router.get("/overview", protect, requireDeliveryManager, getStoreShiftOverview);
router.put("/:id", protect, requireDeliveryManager, updateShiftSlot);
router.delete("/:id", protect, requireDeliveryManager, deleteShiftSlot);

// Both manager and rider view shift slots
router.get("/", protect, getShiftSlots);

// Rider book shift slot
router.post("/book", protect, bookShiftSlot);

export default router;
