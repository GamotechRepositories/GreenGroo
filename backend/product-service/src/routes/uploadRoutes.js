import express from "express";

const router = express.Router();
router.post("/", (_req, res) =>
  res.status(501).json({ success: false, message: "Not implemented yet" })
);
export default router;
