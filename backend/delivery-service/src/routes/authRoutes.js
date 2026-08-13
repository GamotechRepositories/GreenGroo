import express from "express";
import { protect } from "@greengrocc/shared";
import {
  getAreaManager,
  heartbeat,
  login,
  me,
  register,
  updateOnboarding,
  updateStatus,
} from "../controllers/authController.js";
import {
  bookShift,
  getShiftBooking,
} from "../controllers/shiftController.js";
import { getLoginHours } from "../controllers/gigController.js";

import {
  acceptOrderOffer,
  completeDelivery,
  declineOrderOffer,
  getActiveDelivery,
  getPendingOffer,
  scanStoreQr,
} from "../controllers/riderOrderController.js";

import {
  getAvailableSlots,
  bookSlot,
  getMyBookings,
  toggleNotification,
  cancelBooking,
  goOnline,
  goOffline,
} from "../controllers/partnerShiftController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/area-manager", getAreaManager);
router.patch("/onboarding", protect, updateOnboarding);
router.patch("/status", protect, updateStatus);
router.post("/heartbeat", protect, heartbeat);
router.post("/shift-booking", protect, bookShift);
router.get("/shift-booking/:riderId", protect, getShiftBooking);
router.get("/login-hours", protect, getLoginHours);

// Partner Shift & Slot Management APIs
router.get("/available-slots", protect, getAvailableSlots);
router.post("/shift-bookings", protect, bookSlot);
router.get("/shift-bookings/my", protect, getMyBookings);
router.post("/shift-bookings/:bookingId/notify", protect, toggleNotification);
router.put("/shift-bookings/:bookingId/cancel", protect, cancelBooking);

// Mandatory Location Verification & Go Online / Go Offline Gates
router.post("/go-online", protect, goOnline);
router.post("/go-offline", protect, goOffline);

// Rider Order Workflow Routes
router.get("/offer", protect, getPendingOffer);
router.post("/orders/:orderId/accept", protect, acceptOrderOffer);
router.post("/orders/:orderId/decline", protect, declineOrderOffer);
router.get("/active-delivery", protect, getActiveDelivery);
router.post("/orders/:orderId/scan-store-qr", protect, scanStoreQr);
router.post("/orders/:orderId/complete", protect, completeDelivery);

export default router;
