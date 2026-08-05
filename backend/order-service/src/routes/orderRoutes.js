import express from "express";
import { protect } from "@greengrocc/shared";

const router = express.Router();

router.get("/my", protect, (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Order routes migrating from legacy — use backend/legacy for now",
  });
});

export default router;
