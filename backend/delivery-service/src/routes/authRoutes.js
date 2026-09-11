import express from "express";
import { protect, optionalAuth } from "@greengrocc/shared";
import {
  getAreaManager,
  getActiveHubs,
  getActivityHistory,
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
  confirmCashCollection,
  confirmOnlinePaymentForOrder,
  declineOrderOffer,
  failDelivery,
  getActiveDelivery,
  getDriverPickupQr,
  getOrderPaymentStatus,
  getPendingOffer,
  scanPickupQr,
  scanStoreQr,
  submitPickupProofByDriver,
  uploadDeliveryProof,
  verifyCustomerOtp,
} from "../controllers/riderOrderController.js";
import {
  getRiderCashPending,
  getRiderEarningsDetail,
  riderSubmitCash,
} from "../controllers/cashSettlementController.js";

import {
  goOnline,
  goOffline,
} from "../controllers/partnerShiftController.js";

import { getPartnerGigs } from "../controllers/gigManagementController.js";
import { getAvailableIncentives } from "../controllers/incentiveController.js";
import {
  getMyUnreadNotificationCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  deleteMyNotification,
} from "../controllers/riderNotificationController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/slot-alerts/ack", protect, ackSlotAlerts);
router.get("/home/progress", protect, getTodayProgress);
router.get("/home-dashboard", protect, getTodayProgress);
router.get("/activity-history", protect, getActivityHistory);
router.get("/area-manager", getAreaManager);
router.get("/active-hubs", getActiveHubs);
router.patch("/onboarding", protect, updateOnboarding);
router.patch("/status", protect, updateStatus);
router.post("/heartbeat", protect, heartbeat);
router.post("/fcm-token", protect, updateFcmToken);
router.get("/notifications", protect, listMyNotifications);
router.get("/notifications/unread-count", protect, getMyUnreadNotificationCount);
router.patch("/notifications/:notificationId/read", protect, markMyNotificationRead);
router.delete("/notifications/:notificationId", protect, deleteMyNotification);
router.post("/notifications/read-all", protect, markAllMyNotificationsRead);
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
router.post("/orders/:orderId/pickup-proof", protect, submitPickupProofByDriver);
router.post("/orders/:orderId/scan-store-qr", protect, scanStoreQr);
// New delivery completion flow
router.post("/orders/:orderId/delivery-proof", protect, uploadDeliveryProof);
router.post("/orders/:orderId/verify-otp", protect, verifyCustomerOtp);
router.post("/orders/:orderId/confirm-cash", protect, confirmCashCollection);
router.post("/orders/:orderId/collect-cash", protect, confirmCashCollection);
router.post("/orders/:orderId/confirm-online-payment", protect, confirmOnlinePaymentForOrder);
router.get("/orders/:orderId/payment-status", protect, getOrderPaymentStatus);
router.post("/orders/:orderId/complete", protect, completeDelivery);
router.post("/orders/:orderId/fail", protect, failDelivery);
// Cash & earnings
router.get("/cash/pending", protect, getRiderCashPending);
router.post("/cash/submit", protect, riderSubmitCash);
router.get("/earnings/detail", protect, getRiderEarningsDetail);

export default router;
