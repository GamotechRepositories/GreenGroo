import express from "express";
import { protect } from "@greengrocc/shared";

const router = express.Router();

router.get("/", protect, (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Notification routes migrating from legacy — use backend/legacy for now",
  });
});

export default router;
