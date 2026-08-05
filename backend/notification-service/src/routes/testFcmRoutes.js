import express from "express";

const router = express.Router();

router.post("/fcm", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

export default router;
