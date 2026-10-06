import User from "../models/user.js";

const ALLOWED_DEVICE_TYPES = new Set(["android", "ios", "web"]);
const MAX_DEVICES = 5;

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

    // A phone belongs to whoever signed in on it last.
    const now = new Date();
    await Promise.all([
      User.updateMany(
        { fcmToken: token, _id: { $ne: req.user._id } },
        { $set: { fcmToken: "", lastTokenUpdatedAt: now } }
      ),
      User.updateMany({ fcmTokens: token, _id: { $ne: req.user._id } }, { $pull: { fcmTokens: token } }),
    ]);

    const user = await User.findById(req.user._id).select("fcmToken fcmTokens deviceType lastTokenUpdatedAt");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const others = [user.fcmToken, ...(user.fcmTokens || [])].filter(
      (value) => isValidFcmToken(value) && value !== token
    );
    user.fcmTokens = [...new Set([...others, token])].slice(-MAX_DEVICES);
    user.fcmToken = token;
    user.deviceType = deviceType;
    user.lastTokenUpdatedAt = now;
    await user.save();

    res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
      data: {
        deviceType: user.deviceType,
        lastTokenUpdatedAt: user.lastTokenUpdatedAt,
        devices: user.fcmTokens.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save FCM token",
    });
  }
};

/**
 * Called on logout so the phone stops receiving this account's pushes. With a
 * `token` only that device is removed; without one every device is cleared.
 */
export const clearFcmToken = async (req, res) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    const user = await User.findById(req.user._id).select("fcmToken fcmTokens");
    if (user) {
      const remaining = token ? (user.fcmTokens || []).filter((value) => value !== token) : [];
      user.fcmTokens = remaining;
      if (!token || user.fcmToken === token) user.fcmToken = remaining[remaining.length - 1] || "";
      user.lastTokenUpdatedAt = new Date();
      await user.save();
    }
    res.status(200).json({ success: true, message: "FCM token cleared" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear FCM token",
    });
  }
};
