import Alert from "../models/Alert.js";
import { getIO } from "../../../socket.js";

/**
 * Internal helper function: Creates an operational alert and emits socket notification.
 */
export async function createAlert({
  storeId,
  type,
  message,
  relatedOrderId = null,
  relatedRiderId = null,
}) {
  try {
    if (!storeId || !type || !message) {
      throw new Error("storeId, type, and message are required to create an alert");
    }

    const alert = await Alert.create({
      storeId,
      type,
      message,
      relatedOrderId,
      relatedRiderId,
    });

    try {
      getIO().to(`store_${storeId}`).emit("new_alert", {
        alertId: alert._id,
        type: alert.type,
        message: alert.message,
        relatedOrderId,
        relatedRiderId,
        createdAt: alert.createdAt,
      });
    } catch (ioErr) {
      console.warn("[createAlert] Socket emit warning:", ioErr.message);
    }

    return alert;
  } catch (error) {
    console.error("[createAlert] Error creating alert:", error.message);
    return null;
  }
}

/**
 * Manager only — Returns unread (or all) operational alerts for a storeId.
 */
export const getAlertsForStore = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can view alerts",
      });
    }

    const storeId = req.query.storeId || req.user.id;
    const { unreadOnly } = req.query;

    const filter = { storeId };
    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const alerts = await Alert.find(filter)
      .populate("relatedOrderId", "status customerAddress customerPhone")
      .populate("relatedRiderId", "name phone status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch alerts",
    });
  }
};

/**
 * Manager only — Mark an alert as read.
 */
export const markAlertRead = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can update alert status",
      });
    }

    const { alertId } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark alert as read",
    });
  }
};
