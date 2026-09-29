import express from "express";
import { protect, requireAdmin } from "../../../legacy/middleware/authMiddleware.js";
import {
  getMe,
  updateMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserOrderStats,
} from "../../../legacy/controllers/userController.js";
import { clearFcmToken, saveFcmToken } from "../../../legacy/controllers/fcmTokenController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.post("/fcm-token", protect, saveFcmToken);
router.delete("/fcm-token", protect, clearFcmToken);
router.get("/", protect, requireAdmin, getUsers);
router.post("/", protect, requireAdmin, createUser);
router.get("/:id/order-stats", protect, requireAdmin, getUserOrderStats);
router.put("/:id", protect, requireAdmin, updateUser);
router.delete("/:id", protect, requireAdmin, deleteUser);

export default router;
