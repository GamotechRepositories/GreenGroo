import express from "express";
import { protect, optionalAuth } from "@greengrocc/shared";
import {
  getAreaManager,
  getActiveHubs,
  getTodayProgress,
  heartbeat,
  login,
  me,
  ackSlotAlerts,
  register,
  updateFcmToken,
  updateLocation,
  updateOnboarding,
  updateRiderRating,
  updateStatus,
} from "../controllers/authController.js";
import {
  bookSlot,
  cancelBooking,
  getMyBooking,
  getAvailableSlots,
} from "../controllers/shiftController.js";
import { getLoginHours } from "../controllers/gigController.js";

import {
  acceptOrderOffer,
  completeDelivery,
  declineOrderOffer,
  getActiveDelivery,
  getDriverPickupQr,
  getPendingOffer,
  scanPickupQr,
  scanStoreQr,
} from "../controllers/riderOrderController.js";

import {
  goOnline,
  goOffline,
} from "../controllers/partnerShiftController.js";

import { getPartnerGigs } from "../controllers/gigManagementController.js";
import { getAvailableIncentives } from "../controllers/incentiveController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/slot-alerts/ack", protect, ackSlotAlerts);
router.get("/home/progress", protect, getTodayProgress);
router.get("/home-dashboard", protect, getTodayProgress);
router.get("/area-manager", getAreaManager);
router.get("/active-hubs", getActiveHubs);
router.patch("/onboarding", protect, updateOnboarding);
router.patch("/status", protect, updateStatus);
router.post("/heartbeat", protect, heartbeat);
router.post("/fcm-token", protect, updateFcmToken);
router.post("/location", protect, updateLocation);
router.post("/rider/:riderId/rate", updateRiderRating);
router.post("/shift-booking", protect, bookSlot);
router.get("/shift-booking/:riderId", protect, getMyBooking);
router.get("/login-hours", protect, getLoginHours);

// Partner Shift & Slot Management APIs
router.get("/available-slots", optionalAuth, getAvailableSlots);
router.post("/shift-bookings", protect, bookSlot);
router.get("/shift-bookings/my", protect, getMyBooking);
router.put("/shift-bookings/:bookingId/cancel", protect, cancelBooking);
router.delete("/shift-bookings/:bookingId", protect, cancelBooking);
router.get("/gigs", protect, getPartnerGigs);
router.get("/incentives/available", protect, getAvailableIncentives);

// Location Verification & Go Online / Go Offline Gates
router.post("/go-online", protect, goOnline);
router.post("/go-offline", protect, goOffline);

// Rider Order Workflow Routes
router.get("/offer", protect, getPendingOffer);
router.post("/orders/:orderId/accept", protect, acceptOrderOffer);
router.post("/orders/:orderId/decline", protect, declineOrderOffer);
router.get("/active-delivery", protect, getActiveDelivery);
router.get("/orders/:orderId/pickup-qr", protect, getDriverPickupQr);
router.post("/orders/:orderId/scan-pickup-qr", protect, scanPickupQr);
router.post("/orders/:orderId/scan-store-qr", protect, scanStoreQr);
router.post("/orders/:orderId/complete", protect, completeDelivery);

export default router;
