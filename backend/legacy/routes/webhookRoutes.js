import express from "express";

import { handleEnviaWebhook } from "../controllers/enviaWebhookController.js";

const router = express.Router();

router.post("/envia", handleEnviaWebhook);

export default router;
