import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Product routes migrating from legacy — use backend/legacy for now",
  });
});

export default router;
