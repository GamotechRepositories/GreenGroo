import User from "../models/user.js";

const ALLOWED_DEVICE_TYPES = new Set(["android", "ios", "web"]);

function isValidFcmToken(token) {
  return typeof token === "string" && token.trim().length > 20;
}

export const saveFcmToken = async (req, res) => {
  try {
    const token = req.body?.token?.trim();
    const deviceType = req.body?.deviceType?.trim().toLowerCase() || "android";

    if (!isValidFcmToken(token)) {
      return res.status(400).json({
        success: false,
        message: "A valid FCM token is required",
      });
    }

    if (!ALLOWED_DEVICE_TYPES.has(deviceType)) {
      return res.status(400).json({
        success: false,
        message: "deviceType must be android, ios, or web",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fcmToken: token,
          deviceType,
          lastTokenUpdatedAt: new Date(),
        },
      },
      { new: true }
    ).select("fcmToken deviceType lastTokenUpdatedAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
      data: {
        deviceType: user.deviceType,
        lastTokenUpdatedAt: user.lastTokenUpdatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save FCM token",
    });
  }
};
