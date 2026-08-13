import express from "express";

const router = express.Router();

router.post("/envia", (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Delivery webhooks migrating from legacy — use backend/legacy for now",
  });
});

export default router;
