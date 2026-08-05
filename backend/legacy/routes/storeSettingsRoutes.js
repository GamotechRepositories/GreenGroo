import express from "express";
import {
  getAdminStoreSettings,
  getPublicStoreSettings,
  updateStoreSettings,
} from "../controllers/storeSettingsController.js";
import {
  getEnviaWebhookSetup,
  registerEnviaWebhook,
} from "../controllers/enviaSettingsController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublicStoreSettings);
router.get("/admin", protect, requireAdmin, getAdminStoreSettings);
router.get("/envia/webhook", protect, requireAdmin, getEnviaWebhookSetup);
router.post("/envia/webhook/register", protect, requireAdmin, registerEnviaWebhook);
router.put("/", protect, requireAdmin, updateStoreSettings);

export default router;
