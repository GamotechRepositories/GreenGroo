import express from "express";
import { protect, requireAdmin } from "@greengrocc/shared";

const router = express.Router();

router.get("/", protect, requireAdmin, (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Inventory routes migrating from legacy",
  });
});

router.patch("/:productId/stock", protect, requireAdmin, (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

export default router;
