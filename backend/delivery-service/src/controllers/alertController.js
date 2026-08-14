import Alert from "../models/Alert.js";
import { getIO } from "../../../socket.js";

/**
 * Internal helper function: Creates an operational alert and emits socket notification.
 */
export async function createAlert({
  managerId,
  storeId,
  type,
  message,
  relatedOrderId = null,
  relatedRiderId = null,
}) {
  try {
    const targetManagerId = managerId || storeId;
    if (!targetManagerId || !type || !message) {
      throw new Error("managerId, type, and message are required to create an alert");
    }

    const alert = await Alert.create({
      managerId: targetManagerId,
      storeId: targetManagerId,
      type,
      message,
      relatedOrderId,
      relatedRiderId,
    });

    try {
      getIO().to(`store_${targetManagerId}`).emit("new_alert", {
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
 * Manager only — Returns unread (or all) operational alerts for req.user.id (managerId).
 */
export const getAlertsForStore = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can view alerts",
      });
    }

    const managerId = req.user.id;
    const { unreadOnly } = req.query;

    const filter = {
      $or: [{ managerId }, { storeId: managerId }],
    };

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
 * Manager only — Mark an alert as read. Verifies ownership against req.user.id.
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
    const managerId = req.user.id;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Ownership check
    if (
      alert.managerId?.toString() !== managerId &&
      alert.storeId?.toString() !== managerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Alert does not belong to your store",
      });
    }

    alert.isRead = true;
    await alert.save();

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
