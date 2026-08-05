import express from "express";
import { proxyImage, proxyImageDownload } from "../controllers/proxyController.js";

const router = express.Router();

router.get("/image", proxyImage);
router.get("/image/download", proxyImageDownload);

export default router;
