import {
  getEnviaWebhookPublicUrl,
  listEnviaWebhooks,
  registerEnviaTrackingWebhook,
} from "../services/enviaShippingService.js";

export const getEnviaWebhookSetup = async (req, res) => {
  try {
    const webhookUrl = getEnviaWebhookPublicUrl();
    let registered = [];

    try {
      const response = await listEnviaWebhooks();
      registered = Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      return res.status(200).json({
        success: true,
        data: {
          webhookUrl,
          registered: [],
          webhookConfigured: Boolean(webhookUrl),
          listError: error.message || "Could not load Envia webhooks. Check API token.",
        },
      });
    }

    const matching = registered.filter(
      (entry) => String(entry?.url || "").trim() === webhookUrl
    );

    res.status(200).json({
      success: true,
      data: {
        webhookUrl,
        registered,
        matching,
        webhookConfigured: Boolean(webhookUrl),
        isRegistered: matching.some((entry) => Number(entry?.active) === 1),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load Envia webhook setup",
    });
  }
};

export const registerEnviaWebhook = async (req, res) => {
  try {
    const webhookUrl = getEnviaWebhookPublicUrl();
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Set PUBLIC_API_URL in backend .env to your public API URL (e.g. https://api.bulkmobilemart.com)",
      });
    }

    const result = await registerEnviaTrackingWebhook(webhookUrl);

    res.status(200).json({
      success: true,
      message: "Envia tracking webhook registered",
      data: {
        webhookUrl,
        result,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to register Envia webhook",
    });
  }
};
