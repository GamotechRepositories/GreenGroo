import express from "express";
import { protect } from "@greengrocc/shared";

const router = express.Router();

const notReady = (_req, res) =>
  res.status(501).json({
    success: false,
    message: "User routes migrating from legacy — use backend/legacy for now",
  });

router.get("/me", protect, notReady);
router.patch("/me", protect, notReady);
router.get("/", protect, notReady);

export default router;
