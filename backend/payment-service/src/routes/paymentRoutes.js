import express from "express";
import { protect } from "@greengrocc/shared";

const router = express.Router();

router.post("/create-order", protect, (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Payment routes migrating from legacy — use backend/legacy for now",
  });
});

export default router;
