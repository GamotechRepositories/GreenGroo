import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendTestFcm } from "../controllers/fcmTestController.js";

const router = express.Router();

router.post("/fcm", protect, sendTestFcm);

export default router;
