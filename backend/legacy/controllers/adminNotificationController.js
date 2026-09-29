import User from "../models/user.js";
import Order from "../models/order/Order.js";
import Payment from "../models/payment/Payment.js";
import SupportMessage from "../models/support/SupportMessage.js";
import Notification from "../models/Notification.js";
import ScheduledNotification from "../models/ScheduledNotification.js";
import {
  sendCustomNotification,
  sendOffer,
  sendToMultipleTokens,
} from "../services/notificationService.js";
import {
  AUDIENCE_LABELS,
  armScheduler,
  audienceFilter,
  broadcastPromotionalNotification,
  normalizeAudience,
} from "../services/promotionalBroadcast.js";

const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
const MAX_SCHEDULE_AHEAD_MS = 90 * 24 * 60 * 60 * 1000;

const PROMOTIONAL_TYPES = new Set(["offer", "promotional"]);

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

function normalizeImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const getPromotionalAudienceStats = async (req, res) => {
  try {
    const audience = normalizeAudience(req.query.accountType);
    const filter = audienceFilter(audience);
    const [totalUsers, pushEnabledUsers] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({
        ...filter,
        fcmToken: { $exists: true, $ne: "" },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        audience,
        audienceLabel: AUDIENCE_LABELS[audience],
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
    const audience = req.query.accountType ? normalizeAudience(req.query.accountType) : null;
    const history = await Notification.aggregate([
      {
        $match: {
          type: { $in: [...PROMOTIONAL_TYPES] },
          ...(audience ? { "data.audience": audience } : {}),
        },
      },
      {
        $group: {
          _id: {
            title: "$title",
            body: "$body",
            linkTarget: "$data.linkTarget",
            offerId: "$data.offerId",
            audience: "$data.audience",
            imageUrl: "$data.imageUrl",
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
        audience: item._id.audience || "all",
        imageUrl: item._id.imageUrl || "",
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

function mapScheduled(job) {
  return {
    id: job._id,
    audience: job.audience,
    title: job.title,
    body: job.body,
    imageUrl: job.imageUrl,
    linkTarget: job.data?.linkTarget || "none",
    productId: job.data?.offerId || "",
    sendAt: job.sendAt,
    status: job.status,
    summary: job.summary,
    error: job.error,
    sentAt: job.sentAt,
    createdAt: job.createdAt,
  };
}

export const getScheduledNotifications = async (req, res) => {
  try {
    const audience = normalizeAudience(req.query.accountType);
    const jobs = await ScheduledNotification.find({
      audience,
      status: { $in: ["scheduled", "sending", "failed"] },
    })
      .sort({ sendAt: 1 })
      .limit(50);
    return res.json({ success: true, data: jobs.map(mapScheduled) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load scheduled notifications",
    });
  }
};

export const cancelScheduledNotification = async (req, res) => {
  try {
    const job = await ScheduledNotification.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["scheduled", "failed"] } },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Scheduled notification not found or already sent",
      });
    }
    void armScheduler();
    return res.json({ success: true, data: mapScheduled(job) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel scheduled notification",
    });
  }
};

export const sendPromotionalNotification = async (req, res) => {
  try {
    const {
      title,
      body = "",
      linkTarget = "none",
      productId = "",
      accountType,
      imageUrl,
      scheduleAt,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let sendAt = null;
    if (scheduleAt) {
      sendAt = new Date(scheduleAt);
      const lead = sendAt.getTime() - Date.now();
      if (Number.isNaN(sendAt.getTime()) || lead < MIN_SCHEDULE_LEAD_MS) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be at least 1 minute in the future",
        });
      }
      if (lead > MAX_SCHEDULE_AHEAD_MS) {
        return res.status(400).json({
          success: false,
          message: "Notifications can be scheduled up to 90 days ahead",
        });
      }
    }

    const normalizedImageUrl = normalizeImageUrl(imageUrl);
    if (normalizedImageUrl === null) {
      return res.status(400).json({
        success: false,
        message: "Image URL must be a valid https:// link",
      });
    }
    const audience = normalizeAudience(accountType);

    const trimmedTitle = title.trim().slice(0, 200);
    const trimmedBody = String(body || "").trim().slice(0, 1000);
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

    if (sendAt) {
      const job = await ScheduledNotification.create({
        audience,
        title: trimmedTitle,
        body: trimmedBody,
        imageUrl: normalizedImageUrl,
        data,
        sendAt,
        createdBy: req.user?._id || null,
      });
      void armScheduler();
      return res.status(201).json({
        success: true,
        message: `Notification scheduled for ${AUDIENCE_LABELS[audience].toLowerCase()}`,
        data: { scheduled: true, item: mapScheduled(job) },
      });
    }

    const summary = await broadcastPromotionalNotification({
      title: trimmedTitle,
      body: trimmedBody,
      data,
      audience,
      imageUrl: normalizedImageUrl,
    });

    return res.status(200).json({
      success: true,
      message: `Notification sent to ${AUDIENCE_LABELS[audience].toLowerCase()}`,
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
        audience: normalizeAudience(req.body.accountType),
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
