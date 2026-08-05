import express from "express";

const router = express.Router();

router.post("/signup", (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Auth routes migrating from legacy — use backend/legacy for now",
  });
});

router.post("/login", (_req, res) => {
  res.status(501).json({
    success: false,
    message: "Auth routes migrating from legacy — use backend/legacy for now",
  });
});

router.post("/login/phone", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/otp/send", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/otp/verify", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/otp/complete-signup", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/password/reset", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/admin/forgot-password", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

router.post("/admin/reset-password", (_req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
});

export default router;
