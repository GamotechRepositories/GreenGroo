import { sendTestNotification } from "../services/notificationService.js";

export const sendTestFcm = async (req, res) => {
  try {
    const result = await sendTestNotification(req.user._id);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Failed to send test notification",
      });
    }

    res.status(200).json({
      success: true,
      message: result.delivered
        ? "Test notification sent to your device"
        : "Notification saved. Register an FCM token on your device to receive push delivery.",
      data: {
        delivered: result.delivered,
        reason: result.reason || null,
        notificationId: result.notification?._id || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send test notification",
    });
  }
};
