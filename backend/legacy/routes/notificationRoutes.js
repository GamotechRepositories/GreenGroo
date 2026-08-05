import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
