import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  createAdminInboxAlert,
  getAdminInboxAlerts,
  getAdminInboxSummary,
  getPromotionalAudienceStats,
  getPromotionalNotificationHistory,
  markAdminInboxAlertRead,
  markAllAdminInboxAlertsRead,
  sendAdminNotification,
  sendAdminMulticast,
  sendPromotionalNotification,
} from "../controllers/adminNotificationController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/inbox-summary", getAdminInboxSummary);
router.get("/inbox", getAdminInboxAlerts);
router.post("/inbox", createAdminInboxAlert);
router.put("/inbox/read-all", markAllAdminInboxAlertsRead);
router.put("/inbox/:id/read", markAdminInboxAlertRead);
router.get("/promotional/audience", getPromotionalAudienceStats);
router.get("/promotional/history", getPromotionalNotificationHistory);
router.post("/promotional/send", sendPromotionalNotification);
router.post("/send", sendAdminNotification);
router.post("/multicast", sendAdminMulticast);

export default router;
