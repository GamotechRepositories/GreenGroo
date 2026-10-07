/**
 * Pickup driver (vendor-created, farm → collection centre) notifications.
 * Same Firebase project as the delivery app (greengrocc-27df8): FCM reaches the
 * driver when the app is in background or closed; every notification is also
 * stored so the app can list them. Without Firebase Admin credentials the push
 * is skipped quietly and only the stored copy remains.
 */
import crypto from "node:crypto";
import mongoose from "mongoose";
import { PickupDriver } from "./models.js";

export const DRIVER_CHANNEL_ID = "high_importance_channel";
const MAX_TOKENS_PER_DRIVER = 5;
const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const driverNotificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    driverId: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    type: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
driverNotificationSchema.index({ driverId: 1, createdAt: -1 });

export const PickupDriverNotification =
  mongoose.models.PickupDriverNotification ||
  mongoose.model("PickupDriverNotification", driverNotificationSchema);

let warnedNoFirebase = false;

async function getMessagingSafe() {
  try {
    const mod = await import("../../legacy/config/firebaseAdmin.js");
    return mod.getFirebaseMessaging?.() || null;
  } catch (err) {
    console.warn("[DriverPush] Firebase Admin unavailable:", err.message);
    return null;
  }
}

function stringifyData(data = {}) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null || v === "") continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

/** Stores the notification and pushes it to every device of the driver. */
export async function notifyPickupDriver(driverId, { title, body = "", data = {}, tag = "" }) {
  if (!driverId || !title) return { sent: 0, reason: "missing-input" };
  const stored = await PickupDriverNotification.create({
    id: `PDN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    driverId,
    title,
    body,
    type: String(data.type || ""),
    data,
  }).catch(() => null);

  const driver = await PickupDriver.findOne({ id: driverId }).select("id fcmTokens").lean();
  const tokens = [...new Set((driver?.fcmTokens || []).map((t) => t?.token).filter(Boolean))];
  if (!tokens.length) return { sent: 0, reason: "no-tokens" };

  const messaging = await getMessagingSafe();
  if (!messaging) {
    if (!warnedNoFirebase) {
      warnedNoFirebase = true;
      console.warn("[DriverPush] Firebase Admin not configured — driver push skipped (stored in app inbox).");
    }
    return { sent: 0, reason: "firebase-not-configured" };
  }

  let sent = 0;
  const invalid = [];
  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringifyData({
        ...data,
        audience: "pickup_driver",
        notificationId: stored?.id || "",
        title,
        body,
        tag,
      }),
      android: {
        priority: "high",
        notification: { channelId: DRIVER_CHANNEL_ID, sound: "default", ...(tag ? { tag } : {}) },
      },
      apns: { payload: { aps: { sound: "default" } } },
    });
    sent = res.successCount;
    res.responses.forEach((r, i) => {
      if (!r.success && INVALID_TOKEN_CODES.has(r.error?.code)) invalid.push(tokens[i]);
    });
  } catch (err) {
    console.warn("[DriverPush] send failed:", err.message);
  }
  if (invalid.length) {
    await PickupDriver.updateOne({ id: driverId }, { $pull: { fcmTokens: { token: { $in: invalid } } } }).catch(() => {});
  }
  return { sent, invalid: invalid.length };
}

// ── Event wrappers (fire-and-forget: never delay or break an API response) ──

const plainOf = (doc) => (typeof doc?.toObject === "function" ? doc.toObject() : doc);

function pickupSummary(p) {
  const qty = Number(p.packedQuantity || p.expectedQuantity || 0);
  const parts = [p.orderId ? `#${p.orderId}` : "", p.productName || ""];
  if (qty > 0) parts.push(`${qty} ${p.unit || "Kg"}`);
  return parts.filter(Boolean).join(" · ");
}

function pickupData(p, event) {
  return {
    type: "PICKUP",
    event,
    screen: "pickup",
    pickupId: p.id || p.pickupId || "",
    orderId: p.orderId || "",
    batchId: p.collectionBatchId || "",
    status: p.status || "",
  };
}

function fire(promise) {
  promise.catch((err) => console.warn("[DriverPush] push failed:", err.message));
}

export function pushDriverPickupAssigned(pickup, { reassign = false, previousDriverId = "" } = {}) {
  const p = plainOf(pickup);
  if (!p?.driverId) return;
  const when = [p.pickupDate || p.scheduledDate, p.pickupTime || p.scheduledTime].filter(Boolean).join(" ");
  fire(
    notifyPickupDriver(p.driverId, {
      title: reassign ? "Pickup assigned to you" : "New pickup assigned",
      body: [pickupSummary(p), when ? `Pickup ${when}` : ""].filter(Boolean).join(" · "),
      data: pickupData(p, "PICKUP_ASSIGNED"),
      tag: `pickup_${p.id}`,
    })
  );
  if (previousDriverId && previousDriverId !== p.driverId) {
    fire(
      notifyPickupDriver(previousDriverId, {
        title: "Pickup reassigned",
        body: `${pickupSummary(p)} has been given to another driver.`,
        data: { ...pickupData(p, "PICKUP_UNASSIGNED"), screen: "notifications" },
        tag: `pickup_${p.id}`,
      })
    );
  }
}

export function pushDriverPickupReceived(pickup) {
  const p = plainOf(pickup);
  if (!p?.driverId) return;
  fire(
    notifyPickupDriver(p.driverId, {
      title: "Received at collection centre",
      body: `${pickupSummary(p)} was received by the centre.`,
      data: pickupData(p, "PICKUP_RECEIVED"),
      tag: `pickup_${p.id}`,
    })
  );
}

export function pushDriverAccountStatus(driver) {
  const d = plainOf(driver);
  if (!d?.id) return;
  const status = String(d.status || "");
  const inactive = status.toLowerCase() === "inactive";
  fire(
    notifyPickupDriver(d.id, {
      title: inactive ? "Account deactivated" : "Account status updated",
      body: inactive
        ? "Your vendor has deactivated your driver account. Please contact them."
        : `Your driver status is now ${status}.`,
      data: { type: "ACCOUNT", event: "ACCOUNT_STATUS", screen: "notifications", status },
      tag: "account_status",
    })
  );
}

// ── Driver endpoints ────────────────────────────────────────────────────────

const authDriverId = (req) => req.user?.driverId || req.user?.id || "";

export async function saveDriverPushToken(req, res) {
  try {
    const token = String(req.body?.token || req.body?.fcmToken || "").trim();
    if (!token) return res.status(400).json({ message: "A valid push token is required" });
    const driverId = authDriverId(req);
    const driver = await PickupDriver.findOne({ id: driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    // A phone belongs to one driver at a time.
    await PickupDriver.updateMany({ id: { $ne: driverId }, "fcmTokens.token": token }, { $pull: { fcmTokens: { token } } });
    const others = (driver.fcmTokens || []).filter((t) => t.token !== token);
    driver.fcmTokens = [
      { token, platform: String(req.body?.platform || "android").slice(0, 20), updatedAt: new Date() },
      ...others,
    ].slice(0, MAX_TOKENS_PER_DRIVER);
    await driver.save();
    res.json({ success: true, devices: driver.fcmTokens.length });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save push token" });
  }
}

export async function deleteDriverPushToken(req, res) {
  try {
    const token = String(req.body?.token || req.body?.fcmToken || "").trim();
    if (token) {
      await PickupDriver.updateOne({ id: authDriverId(req) }, { $pull: { fcmTokens: { token } } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to remove push token" });
  }
}

export async function sendDriverTestPush(req, res) {
  try {
    const result = await notifyPickupDriver(authDriverId(req), {
      title: "Test notification",
      body: "Notifications are working on this phone.",
      data: { type: "TEST", screen: "notifications" },
      tag: "test",
    });
    res.json({ success: result.sent > 0, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to send test notification" });
  }
}

export async function listDriverNotifications(req, res) {
  try {
    const driverId = authDriverId(req);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const [rows, unread] = await Promise.all([
      PickupDriverNotification.find({ driverId }).sort({ createdAt: -1 }).limit(limit).lean(),
      PickupDriverNotification.countDocuments({ driverId, read: false }),
    ]);
    res.json({
      unread,
      data: rows.map(({ _id, __v, ...row }) => row),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load notifications" });
  }
}

export async function readAllDriverNotifications(req, res) {
  try {
    await PickupDriverNotification.updateMany({ driverId: authDriverId(req), read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update notifications" });
  }
}
