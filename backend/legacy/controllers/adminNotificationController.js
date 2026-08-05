import User from "../models/user.js";
import Order from "../models/order/Order.js";
import Payment from "../models/payment/Payment.js";
import SupportMessage from "../models/support/SupportMessage.js";
import Notification from "../models/Notification.js";
import {
  sendCustomNotification,
  sendOffer,
  sendToMultipleTokens,
} from "../services/notificationService.js";

const PROMOTIONAL_TYPES = new Set(["offer", "promotional"]);
const BROADCAST_BATCH_SIZE = 25;

function parseSinceDate(value) {
  if (!value) return null;
  const sinceDate = new Date(value);
  if (Number.isNaN(sinceDate.getTime())) {
    return null;
  }
  return sinceDate;
}

function buildSinceFilter(sinceDate) {
  return sinceDate ? { createdAt: { $gt: sinceDate } } : {};
}

export const getAdminInboxSummary = async (req, res) => {
  try {
    const {
      supportSince,
      placedSince,
      attemptedSince,
      paymentSince,
    } = req.query;

    const supportDate = parseSinceDate(supportSince);
    const placedDate = parseSinceDate(placedSince);
    const attemptedDate = parseSinceDate(attemptedSince);
    const paymentDate = parseSinceDate(paymentSince);

    const mapRecentOrder = (order) => ({
      id: order._id,
      orderNumber: order.orderNumber || "",
      customerName:
        order.user?.name || order.deliveryAddress?.fullName || "A customer",
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });

    const attemptedSinceFilter = attemptedDate
      ? { updatedAt: { $gt: attemptedDate } }
      : {};

    const [supportCount, placedCount, attemptedCount, paymentCount, recentPlaced, recentAttempted] =
      await Promise.all([
        SupportMessage.countDocuments(buildSinceFilter(supportDate)),
        Order.countDocuments({
          status: { $ne: "attempted" },
          ...buildSinceFilter(placedDate),
        }),
        Order.countDocuments({
          status: "attempted",
          ...attemptedSinceFilter,
        }),
        Payment.countDocuments({ status: "pending", ...buildSinceFilter(paymentDate) }),
        Order.find({
          status: { $ne: "attempted" },
          ...buildSinceFilter(placedDate),
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name")
          .select("orderNumber status createdAt updatedAt deliveryAddress.fullName user"),
        Order.find({
          status: "attempted",
          ...attemptedSinceFilter,
        })
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate("user", "name")
          .select("orderNumber status createdAt updatedAt deliveryAddress.fullName user"),
      ]);

    return res.json({
      success: true,
      data: {
        support: { count: supportCount },
        orders: {
          placedCount,
          attemptedCount,
          count: placedCount + attemptedCount,
          recentPlaced: recentPlaced.map(mapRecentOrder),
          recentAttempted: recentAttempted.map(mapRecentOrder),
        },
        payments: { count: paymentCount },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load admin inbox summary",
    });
  }
};

function mapAdminInboxAlert(notification) {
  return {
    id: notification._id,
    type: notification.type,
    title: notification.data?.showTitle === false ? "" : notification.title,
    message: notification.body,
    link: notification.data?.link || "",
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export const getAdminInboxAlerts = async (req, res) => {
  try {
    const alerts = await Notification.find({
      user: req.user._id,
      isRead: false,
      "data.channel": "admin_inbox",
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      success: true,
      data: alerts.map(mapAdminInboxAlert),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load admin notifications",
    });
  }
};

export const createAdminInboxAlert = async (req, res) => {
  try {
    const { type, title, message, link = "", order = null, eventKey = "" } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: "Notification type and message are required",
      });
    }

    const notificationData = {
      user: req.user._id,
      title: title || message,
      body: message,
      type,
      order: order || null,
      isRead: false,
      data: {
        channel: "admin_inbox",
        eventKey: eventKey || undefined,
        link,
        showTitle: Boolean(title),
      },
    };

    const notification = eventKey
      ? await Notification.findOneAndUpdate(
          {
            user: req.user._id,
            "data.channel": "admin_inbox",
            "data.eventKey": String(eventKey),
          },
          { $setOnInsert: notificationData },
          { new: true, upsert: true, runValidators: true }
        )
      : await Notification.create(notificationData);

    return res.status(201).json({
      success: true,
      data: mapAdminInboxAlert(notification),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save admin notification",
    });
  }
};

export const markAdminInboxAlertRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        "data.channel": "admin_inbox",
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update admin notification",
    });
  }
};

export const markAllAdminInboxAlertsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
        "data.channel": "admin_inbox",
      },
      { $set: { isRead: true } }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear admin notifications",
    });
  }
};

function normalizeUserIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((id) => String(id).trim()).filter(Boolean))];
}

function buildPromotionalPayload({ linkTarget = "none", productId = "" } = {}) {
  const normalizedTarget = String(linkTarget || "none").trim().toLowerCase();
  const data = {
    linkTarget: normalizedTarget,
    type: "offer",
  };

  if (normalizedTarget === "product" && productId) {
    data.offerId = String(productId).trim();
  }

  return data;
}

async function deliverPromotionalToUser(userId, { title, body, data }) {
  const hasNavigation =
    data.linkTarget && data.linkTarget !== "none" && data.linkTarget !== "general";

  if (hasNavigation || data.offerId) {
    return sendOffer(userId, { title, body, data });
  }

  return sendCustomNotification(userId, {
    title,
    body,
    type: "promotional",
    data: { ...data, type: "promotional" },
  });
}

async function broadcastPromotionalNotification({ title, body, data }) {
  const users = await User.find({ role: "user" }).select("_id").lean();
  const summary = {
    targetedUsers: users.length,
    inAppSaved: 0,
    pushDelivered: 0,
    pushFailed: 0,
    noToken: 0,
  };

  for (let index = 0; index < users.length; index += BROADCAST_BATCH_SIZE) {
    const batch = users.slice(index, index + BROADCAST_BATCH_SIZE);
    const results = await Promise.all(
      batch.map((user) => deliverPromotionalToUser(user._id, { title, body, data }))
    );

    results.forEach((result) => {
      if (!result?.notification) return;

      summary.inAppSaved += 1;

      if (result.delivered) {
        summary.pushDelivered += 1;
        return;
      }

      if (result.reason === "No FCM token registered") {
        summary.noToken += 1;
        return;
      }

      if (result.error) {
        summary.pushFailed += 1;
      }
    });
  }

  return summary;
}

export const getPromotionalAudienceStats = async (req, res) => {
  try {
    const [totalUsers, pushEnabledUsers] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({
        role: "user",
        fcmToken: { $exists: true, $ne: "" },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        pushEnabledUsers,
        inAppOnlyUsers: Math.max(totalUsers - pushEnabledUsers, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load promotional audience stats",
    });
  }
};

export const getPromotionalNotificationHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const history = await Notification.aggregate([
      {
        $match: {
          type: { $in: [...PROMOTIONAL_TYPES] },
        },
      },
      {
        $group: {
          _id: {
            title: "$title",
            body: "$body",
            linkTarget: "$data.linkTarget",
            offerId: "$data.offerId",
            minuteBucket: {
              $dateToString: {
                format: "%Y-%m-%d %H:%M",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
          },
          recipients: { $sum: 1 },
          pushDelivered: {
            $sum: {
              $cond: [{ $eq: ["$fcmSent", true] }, 1, 0],
            },
          },
          createdAt: { $max: "$createdAt" },
          type: { $first: "$type" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);

    return res.json({
      success: true,
      data: history.map((item) => ({
        title: item._id.title,
        body: item._id.body,
        type: item.type,
        linkTarget: item._id.linkTarget || "none",
        productId: item._id.offerId || "",
        recipients: item.recipients,
        pushDelivered: item.pushDelivered,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load promotional notification history",
    });
  }
};

export const sendPromotionalNotification = async (req, res) => {
  try {
    const { title, body, linkTarget = "none", productId = "" } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    const trimmedTitle = title.trim().slice(0, 200);
    const trimmedBody = body.trim().slice(0, 1000);
    const normalizedTarget = String(linkTarget || "none").trim().toLowerCase();

    if (normalizedTarget === "product" && !String(productId || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required when link target is Product",
      });
    }

    const data = buildPromotionalPayload({
      linkTarget: normalizedTarget,
      productId,
    });

    const summary = await broadcastPromotionalNotification({
      title: trimmedTitle,
      body: trimmedBody,
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Promotional notification sent to all customers",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send promotional notification",
    });
  }
};

export const sendAdminNotification = async (req, res) => {
  try {
    const {
      mode = "single",
      userId,
      userIds = [],
      title,
      body,
      type = "custom",
      data = {},
      broadcast = false,
    } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title and body are required",
      });
    }

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const notificationType = type.trim() || "custom";

    if (broadcast === true || mode === "broadcast") {
      const payloadData =
        notificationType === "offer"
          ? buildPromotionalPayload({
              linkTarget: data?.linkTarget || "none",
              productId: data?.offerId || data?.productId || "",
            })
          : { ...data, type: notificationType };

      const summary = await broadcastPromotionalNotification({
        title: trimmedTitle,
        body: trimmedBody,
        data: payloadData,
      });

      return res.status(200).json({
        success: true,
        message: "Broadcast notification processed",
        data: summary,
      });
    }

    if (mode === "multiple") {
      const ids = normalizeUserIds(userIds);
      if (!ids.length) {
        return res.status(400).json({
          success: false,
          message: "userIds are required for multiple mode",
        });
      }

      const results = await Promise.all(
        ids.map((id) =>
          notificationType === "offer"
            ? sendOffer(id, { title: trimmedTitle, body: trimmedBody, data })
            : sendCustomNotification(id, {
                title: trimmedTitle,
                body: trimmedBody,
                type: notificationType,
                data,
              })
        )
      );

      return res.status(200).json({
        success: true,
        message: "Notifications sent to selected users",
        data: { results },
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required for single mode",
      });
    }

    const result =
      notificationType === "offer"
        ? await sendOffer(userId, { title: trimmedTitle, body: trimmedBody, data })
        : await sendCustomNotification(userId, {
            title: trimmedTitle,
            body: trimmedBody,
            type: notificationType,
            data,
          });

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send notification",
    });
  }
};

export const sendAdminMulticast = async (req, res) => {
  try {
    const { tokens = [], title, body, data = {} } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title and body are required",
      });
    }

    const result = await sendToMultipleTokens(tokens, {
      title: title.trim(),
      body: body.trim(),
      data,
    });

    res.status(200).json({
      success: true,
      message: "Multicast notification processed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send multicast notification",
    });
  }
};
