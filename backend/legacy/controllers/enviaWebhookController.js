import { processEnviaWebhookEvent } from "../services/enviaWebhookProcessor.js";

export const handleEnviaWebhook = (req, res) => {
  res.status(200).json({ received: true });

  const body = req.body || {};
  processEnviaWebhookEvent(body).catch((error) => {
    console.error("Envia webhook processing failed:", error?.message || error);
  });
};
