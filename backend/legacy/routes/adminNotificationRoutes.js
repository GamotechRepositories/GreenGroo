import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  cancelScheduledNotification,
  createAdminInboxAlert,
  getScheduledNotifications,
  getAdminInboxAlerts,
  getAdminInboxSummary,
  getPromotionalAudienceStats,
  getPromotionalNotificationHistory,
  markAdminInboxAlertRead,
  markAllAdminInboxAlertsRead,
  sendAdminNotification,
  sendAdminMulticast,
  sendPromotionalNotification,
  getAdminSystemAlerts,
  markAdminSystemAlertRead,
  dismissAdminSystemAlert,
  markAllAdminSystemAlertsRead,
  createCustomSystemAlert,
} from "../controllers/adminNotificationController.js";

const router = express.Router();

router.use(protect, requireAdmin);

// System Alerts for Due Payments, Meetings, Operations
router.get("/system-alerts", getAdminSystemAlerts);
router.post("/system-alerts/custom", createCustomSystemAlert);
router.put("/system-alerts/read-all", markAllAdminSystemAlertsRead);
router.put("/system-alerts/:id/read", markAdminSystemAlertRead);
router.put("/system-alerts/:id/dismiss", dismissAdminSystemAlert);

router.get("/inbox-summary", getAdminInboxSummary);
router.get("/inbox", getAdminInboxAlerts);
router.post("/inbox", createAdminInboxAlert);
router.put("/inbox/read-all", markAllAdminInboxAlertsRead);
router.put("/inbox/:id/read", markAdminInboxAlertRead);
router.get("/promotional/audience", getPromotionalAudienceStats);
router.get("/promotional/history", getPromotionalNotificationHistory);
router.post("/promotional/send", sendPromotionalNotification);
router.get("/promotional/scheduled", getScheduledNotifications);
router.delete("/promotional/scheduled/:id", cancelScheduledNotification);
router.post("/send", sendAdminNotification);
router.post("/multicast", sendAdminMulticast);

export default router;
