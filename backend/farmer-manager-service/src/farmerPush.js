/**
 * Farmer app push notifications (Firebase project greengrocc-27df8, same as the delivery app).
 * Sockets update the open app; FCM reaches the farmer when the app is in background or closed.
 * Without Firebase Admin credentials on the server every send is skipped quietly.
 */
import crypto from "crypto";
import mongoose from "mongoose";
import {
  Farmer,
  FarmerOrder,
  FarmerHarvestOrder,
  FarmerDocument,
  FarmerProduct,
  Vendor,
} from "./models.js";

// Must match kFarmerChannelId in farmerapp/lib/services/push_notification_service.dart.
export const FARMER_CHANNEL_ID = "farmer_alerts_v2";
// farmerapp/android/app/src/main/res/raw/farmer_alert.mp3 (Android 8+ takes the sound from the channel).
const FARMER_SOUND = "farmer_alert";
const MAX_TOKENS_PER_FARMER = 5;
const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

// ── Farmer In-App Notification Schema ───────────────────────────────────────
const farmerNotificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    farmerId: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    type: { type: String, default: "orders" }, // 'orders', 'payments', 'documents', 'schemes', 'crops', 'inventory', 'account', 'system'
    orderCode: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
farmerNotificationSchema.index({ farmerId: 1, createdAt: -1 });

export const FarmerNotification =
  mongoose.models.FarmerNotification ||
  mongoose.model("FarmerNotification", farmerNotificationSchema);

let warnedNoFirebase = false;

async function getMessagingSafe() {
  try {
    const mod = await import("../../legacy/config/firebaseAdmin.js");
    return mod.getFirebaseMessaging?.() || null;
  } catch (err) {
    console.warn("[FarmerPush] Firebase Admin unavailable:", err.message);
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

const langOf = (value) => (String(value || "").toLowerCase().startsWith("en") ? "en" : "mr");
const pick = (text, lang) => (typeof text === "string" ? text : text?.[lang] || text?.en || "");

/**
 * Sends one notification to every app install of a farmer and stores it in their inbox.
 * title / body: string or { en, mr }; tag: notifications with the same tag replace each other.
 */
export async function notifyFarmer(farmerKey, { title, body = "", data = {}, tag = "" }) {
  if (!farmerKey || !title) return { sent: 0, reason: "missing-input" };
  const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
    .select("id fcmTokens preferredLanguage")
    .lean();
  if (!farmer) return { sent: 0, reason: "farmer-not-found" };

  const lang = langOf(farmer.preferredLanguage || "mr");
  const t = pick(title, lang);
  const b = pick(body, lang);
  let rawType = String(data.type || "orders").toLowerCase();
  if (rawType === "order") rawType = "orders";
  if (rawType === "payment") rawType = "payments";
  if (rawType === "document") rawType = "documents";
  if (rawType === "scheme") rawType = "schemes";

  const orderCode = String(data.orderId || data.orderCode || "");
  const actionLabel =
    rawType === "payments"
      ? "हिशोब पहा"
      : rawType === "orders"
      ? "ऑर्डर पहा"
      : rawType === "documents"
      ? "कागदपत्रे पहा"
      : rawType === "schemes"
      ? "योजना पहा"
      : "पहा";

  // 1. ALWAYS persist real notification into MongoDB inbox
  await FarmerNotification.create({
    id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    farmerId: farmer.id,
    title: t,
    body: b,
    type: rawType,
    orderCode,
    actionLabel,
    data,
    read: false,
  }).catch((err) => console.warn("[FarmerPush] Failed to store notification in inbox:", err.message));

  // 2. Push to FCM if devices are registered
  const tokens = (farmer.fcmTokens || []).filter((t) => t?.token);
  if (!tokens.length) return { sent: 0, reason: "no-tokens", stored: true };

  const messaging = await getMessagingSafe();
  if (!messaging) {
    if (!warnedNoFirebase) {
      warnedNoFirebase = true;
      console.warn("[FarmerPush] Firebase Admin not configured — farmer push skipped (stored in app inbox).");
    }
    return { sent: 0, reason: "firebase-not-configured", stored: true };
  }

  const byLang = new Map();
  for (const tok of tokens) {
    const l = langOf(tok.language);
    byLang.set(l, [...(byLang.get(l) || []), tok.token]);
  }

  let sent = 0;
  const invalid = [];
  for (const [l, list] of byLang) {
    const pushTitle = pick(title, l);
    const pushBody = pick(body, l);
    try {
      const res = await messaging.sendEachForMulticast({
        tokens: [...new Set(list)],
        notification: { title: pushTitle, body: pushBody },
        data: stringifyData({ ...data, title: pushTitle, body: pushBody, tag }),
        android: {
          priority: "high",
          notification: {
            channelId: FARMER_CHANNEL_ID,
            sound: FARMER_SOUND,
            defaultVibrateTimings: true,
            visibility: "public",
            notificationPriority: "PRIORITY_MAX",
            ...(tag ? { tag } : {}),
          },
        },
        apns: { payload: { aps: { sound: "default" } } },
      });
      sent += res.successCount;
      res.responses.forEach((r, i) => {
        if (!r.success && INVALID_TOKEN_CODES.has(r.error?.code)) invalid.push(list[i]);
      });
    } catch (err) {
      console.warn("[FarmerPush] send failed:", err.message);
    }
  }

  if (invalid.length) {
    await Farmer.updateOne({ id: farmer.id }, { $pull: { fcmTokens: { token: { $in: invalid } } } }).catch(() => {});
  }
  return { sent, invalid: invalid.length, stored: true };
}

export async function registerFarmerPushToken(farmerKey, { token, platform = "android", language = "mr" }) {
  const clean = String(token || "").trim();
  if (!clean) return null;
  const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] }).select("id fcmTokens");
  if (!farmer) return null;
  // A phone belongs to one farmer at a time.
  await Farmer.updateMany({ id: { $ne: farmer.id }, "fcmTokens.token": clean }, { $pull: { fcmTokens: { token: clean } } });
  const others = (farmer.fcmTokens || []).filter((t) => t.token !== clean);
  farmer.fcmTokens = [
    { token: clean, platform: String(platform).slice(0, 20), language: langOf(language), updatedAt: new Date() },
    ...others,
  ].slice(0, MAX_TOKENS_PER_FARMER);
  await farmer.save();
  return farmer.fcmTokens.length;
}

export async function removeFarmerPushToken(farmerKey, token) {
  const clean = String(token || "").trim();
  if (!clean) return;
  await Farmer.updateOne(
    { $or: [{ id: farmerKey }, { farmerId: farmerKey }] },
    { $pull: { fcmTokens: { token: clean } } }
  );
}

const authFarmerKey = (req) => req.user?.farmerId || req.user?.id || "";

export async function saveFarmerPushToken(req, res) {
  try {
    const count = await registerFarmerPushToken(authFarmerKey(req), req.body || {});
    if (count == null) return res.status(400).json({ message: "A valid push token is required" });
    res.json({ success: true, devices: count });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save push token" });
  }
}

export async function deleteFarmerPushToken(req, res) {
  try {
    await removeFarmerPushToken(authFarmerKey(req), req.body?.token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to remove push token" });
  }
}

/** Sends a test notification to the logged-in farmer's own devices. */
export async function sendFarmerTestPush(req, res) {
  try {
    const result = await notifyFarmer(authFarmerKey(req), {
      title: { en: "Test notification", mr: "चाचणी सूचना" },
      body: { en: "Notifications are working on this phone.", mr: "या फोनवर सूचना व्यवस्थित येत आहेत." },
      data: { type: "TEST", screen: "notifications" },
      tag: "test",
    });
    res.json({ success: result.sent > 0, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to send test notification" });
  }
}

// ── Auto-seed real notifications from farmer's actual database records ────────
async function autoSeedRealFarmerNotifications(farmer) {
  try {
    const farmerId = farmer.id || farmer.farmerId;
    if (!farmerId) return;

    // 1. Fetch real orders
    const [harvestOrders, classicOrders] = await Promise.all([
      FarmerHarvestOrder.find({ farmerId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
      FarmerOrder.find({ farmerId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
    ]);

    const allOrders = [...harvestOrders, ...classicOrders];
    const seen = new Set();
    const uniqueOrders = [];
    for (const o of allOrders) {
      const oid = String(o.id || o.orderId || o._id);
      if (!seen.has(oid)) {
        seen.add(oid);
        uniqueOrders.push(o);
      }
    }

    const vendorIds = [...new Set(uniqueOrders.map((o) => o.vendorId).filter(Boolean))];
    const vendors = vendorIds.length
      ? await Vendor.find({ $or: [{ id: { $in: vendorIds } }, { vendorId: { $in: vendorIds } }] })
          .select("id vendorId vendorName ownerName businessName")
          .lean()
          .catch(() => [])
      : [];
    const vendorMap = new Map();
    for (const v of vendors) {
      const name = v.businessName || v.vendorName || v.ownerName || "अधिकृत व्हेंडर";
      if (v.id) vendorMap.set(String(v.id), name);
      if (v.vendorId) vendorMap.set(String(v.vendorId), name);
    }

    const toInsert = [];

    for (const order of uniqueOrders) {
      const orderId = order.orderId || order.id;
      const code = order.orderCode || `#${orderId}`;
      const vendorName = vendorMap.get(String(order.vendorId)) || farmer.vendorName || "अधिकृत व्हेंडर";
      const product = order.productName || order.products?.[0]?.name || "शेतमाल";
      const qty = Number(order.totalQuantity || order.quantity || order.orderedQuantity || 0);
      const unit = order.unit || order.products?.[0]?.unit || "Kg";
      const amount = Number(order.totalAmount || order.amount || 0);
      const status = String(order.status || "").toUpperCase();

      if (status.includes("COMPLET") || status.includes("PAID")) {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `पेमेंट जमा: ₹${amount.toLocaleString("en-IN")}`,
          body: `${vendorName} कडून ${product} ची काढणी ऑर्डर पूर्ण झाली असून हिशोब जमा झाला आहे. (${code})`,
          type: "payments",
          orderCode: code,
          actionLabel: "हिशोब पहा",
          data: { type: "PAYMENT", screen: "earnings", orderId },
          read: true,
          createdAt: order.updatedAt || order.createdAt || new Date(),
        });
      } else if (status.includes("READY")) {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `पिकअप स्लॉट तयार: ${code}`,
          body: `${product} चा माल पिकअपसाठी तयार ठेवा. संकलन केंद्र: ${order.collectionCentre || "मुख्य संकलन केंद्र"}`,
          type: "orders",
          orderCode: code,
          actionLabel: "ऑर्डर पहा",
          data: { type: "ORDER", screen: "order", orderId },
          read: false,
          createdAt: order.updatedAt || order.createdAt || new Date(),
        });
      } else if (status.includes("REJECT") || status.includes("CANCEL")) {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `ऑर्डर नाकारली: ${code}`,
          body: `${product} ची ऑर्डर नाकारण्यात आली आहे.${order.rejectionReason ? ` कारण: ${order.rejectionReason}` : ""}`,
          type: "orders",
          orderCode: code,
          actionLabel: "ऑर्डर पहा",
          data: { type: "ORDER", screen: "order", orderId },
          read: true,
          createdAt: order.updatedAt || order.createdAt || new Date(),
        });
      } else {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `नवीन ऑर्डर: ₹${amount.toLocaleString("en-IN")}`,
          body: `${vendorName} यांनी ${product} ची ${qty} ${unit} ऑर्डर नोंदवली आहे. (${code})`,
          type: "orders",
          orderCode: code,
          actionLabel: "ऑर्डर पहा",
          data: { type: "ORDER", screen: "order", orderId },
          read: false,
          createdAt: order.createdAt || new Date(),
        });
      }
    }

    // 2. Fetch real documents
    const docs = await FarmerDocument.find({ farmerId }).lean().catch(() => []);
    for (const doc of docs) {
      const st = String(doc.status || "").toLowerCase();
      if (st === "approved") {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `कागदपत्र मंजूर ✓: ${doc.name || doc.type || "कागदपत्र"}`,
          body: `व्हेंडरने तुमचे ${doc.name || doc.type || "कागदपत्र"} तपासून मंजूर केले आहे.`,
          type: "documents",
          orderCode: String(doc.type || "").toUpperCase(),
          actionLabel: "कागदपत्रे पहा",
          data: { type: "DOCUMENT", screen: "documents", docId: doc.id },
          read: true,
          createdAt: doc.updatedAt || doc.createdAt || new Date(),
        });
      } else if (st === "rejected") {
        toInsert.push({
          id: `FN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          farmerId: farmer.id,
          title: `कागदपत्र अमान्य ⚠️: ${doc.name || doc.type || "कागदपत्र"}`,
          body: `व्हेंडरने तुमचे ${doc.name || doc.type || "कागदपत्र"} अमान्य केले आहे.${doc.rejectionReason ? ` कारण: ${doc.rejectionReason}.` : ""} कृपया स्पष्ट प्रत पुन्हा अपलोड करा.`,
          type: "documents",
          orderCode: String(doc.type || "").toUpperCase(),
          actionLabel: "पुन्हा अपलोड करा",
          data: { type: "DOCUMENT", screen: "documents", docId: doc.id },
          read: false,
          createdAt: doc.updatedAt || doc.createdAt || new Date(),
        });
      }
    }

    if (toInsert.length > 0) {
      toInsert.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      await FarmerNotification.insertMany(toInsert).catch((err) =>
        console.warn("[FarmerPush] Auto-seed insert error:", err.message)
      );
    }
  } catch (err) {
    console.warn("[FarmerPush] autoSeedRealFarmerNotifications failed:", err.message);
  }
}

// ── Farmer Notifications API Endpoints ────────────────────────────────────────
export async function listFarmerNotifications(req, res) {
  try {
    const farmerKey = authFarmerKey(req);
    const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
      .select("id farmerId vendorId vendorName preferredLanguage")
      .lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const filter = { farmerId: farmer.id };
    if (req.query.category && req.query.category !== "all") {
      filter.type = String(req.query.category).toLowerCase();
    }

    let rows = await FarmerNotification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    // If completely empty, auto-seed from real orders & documents
    if (rows.length === 0 && (!req.query.category || req.query.category === "all")) {
      await autoSeedRealFarmerNotifications(farmer);
      rows = await FarmerNotification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    }

    const unread = await FarmerNotification.countDocuments({ farmerId: farmer.id, read: false });

    res.json({
      unread,
      data: rows.map(({ _id, __v, ...row }) => row),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load notifications" });
  }
}

export async function readAllFarmerNotifications(req, res) {
  try {
    const farmerKey = authFarmerKey(req);
    const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
      .select("id")
      .lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    await FarmerNotification.updateMany({ farmerId: farmer.id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark notifications as read" });
  }
}

export async function markFarmerNotificationRead(req, res) {
  try {
    const farmerKey = authFarmerKey(req);
    const { id } = req.params;
    const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
      .select("id")
      .lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    await FarmerNotification.updateOne({ farmerId: farmer.id, id }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark notification as read" });
  }
}

export async function deleteFarmerNotification(req, res) {
  try {
    const farmerKey = authFarmerKey(req);
    const { id } = req.params;
    const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
      .select("id")
      .lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    await FarmerNotification.deleteOne({ farmerId: farmer.id, id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete notification" });
  }
}

export async function clearAllFarmerNotifications(req, res) {
  try {
    const farmerKey = authFarmerKey(req);
    const farmer = await Farmer.findOne({ $or: [{ id: farmerKey }, { farmerId: farmerKey }] })
      .select("id")
      .lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    await FarmerNotification.deleteMany({ farmerId: farmer.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to clear notifications" });
  }
}

// ── Event texts ───────────────────────────────────────────────────────────────

const ORDER_STATUS_TEXT = {
  ACCEPTED: { en: "Order accepted", mr: "ऑर्डर स्वीकारली" },
  PREPARING: { en: "Order is being prepared", mr: "ऑर्डरची तयारी सुरू आहे" },
  PACKING: { en: "Order is being packed", mr: "ऑर्डर पॅक होत आहे" },
  READY_FOR_PICKUP: { en: "Order ready for pickup", mr: "ऑर्डर पिकअपसाठी तयार आहे" },
  DRIVER_ASSIGNED: { en: "Pickup scheduled", mr: "पिकअप नियोजित झाले" },
  PICKUP_SCHEDULED: { en: "Pickup scheduled", mr: "पिकअप नियोजित झाले" },
  DISPATCHED: { en: "Driver is on the way", mr: "ड्रायव्हर पिकअपसाठी निघाला आहे" },
  DRIVER_ARRIVED: { en: "Driver has arrived for pickup", mr: "ड्रायव्हर पिकअपसाठी पोहोचला" },
  ARRIVED: { en: "Driver has arrived for pickup", mr: "ड्रायव्हर पिकअपसाठी पोहोचला" },
  PICKED_UP: { en: "Produce picked up", mr: "तुमचा माल उचलला गेला" },
  PICKUP_CONFIRMED: { en: "Produce picked up", mr: "तुमचा माल उचलला गेला" },
  IN_TRANSIT: { en: "On the way to the collection centre", mr: "माल संकलन केंद्राकडे जात आहे" },
  ARRIVED_AT_CENTRE: { en: "Reached the collection centre", mr: "माल संकलन केंद्रात पोहोचला" },
  COLLECTION_CENTRE_RECEIVED: { en: "Received at the collection centre", mr: "संकलन केंद्रात माल स्वीकारला" },
  RECEIVED_AT_COLLECTION_CENTRE: { en: "Received at the collection centre", mr: "संकलन केंद्रात माल स्वीकारला" },
  QUALITY_PENDING: { en: "Quality check started", mr: "गुणवत्ता तपासणी सुरू झाली" },
  INSPECTION: { en: "Quality check started", mr: "गुणवत्ता तपासणी सुरू झाली" },
  GRADING: { en: "Grading in progress", mr: "ग्रेडिंग सुरू आहे" },
  GRADE_CONFIRMED: { en: "Grading completed", mr: "ग्रेडिंग पूर्ण झाले" },
  QUALITY_COMPLETED: { en: "Grading completed", mr: "ग्रेडिंग पूर्ण झाले" },
  COMPLETED: { en: "Order completed", mr: "ऑर्डर पूर्ण झाली" },
  ORDER_COMPLETED: { en: "Order completed", mr: "ऑर्डर पूर्ण झाली" },
  REJECTED: { en: "Order rejected", mr: "ऑर्डर नाकारली" },
  CANCELLED: { en: "Order cancelled", mr: "ऑर्डर रद्द झाली" },
};

const PAID_STATUS = /^(paid|credited|completed|settled|success|payment[_ ](completed|received))$/i;

const DOC_TITLES = {
  aadhaar: { en: "Aadhaar Card", mr: "आधार कार्ड" },
  farmer_id: { en: "Farmer ID", mr: "शेतकरी ओळखपत्र" },
  land_712: { en: "7/12 Extract", mr: "७/१२ उतारा" },
  land_8a: { en: "8A Extract", mr: "८-अ उतारा" },
  bank: { en: "Bank Passbook", mr: "बँक पासबुक" },
  farmer_photo: { en: "Farmer Photo", mr: "शेतकरी फोटो" },
  address_proof: { en: "Address Proof", mr: "रहिवासी दाखला" },
  pan: { en: "PAN Card", mr: "पॅन कार्ड" },
};

function orderSummary(order) {
  const product = order.productName || order.products?.[0]?.name || "Produce";
  const qty = Number(order.totalQuantity || order.orderedQuantity || 0);
  const unit = order.unit || order.products?.[0]?.unit || "Kg";
  const amount = Number(order.totalAmount || order.amount || 0);
  const parts = [product];
  if (qty > 0) parts.push(`${qty} ${unit}`);
  if (amount > 0) parts.push(`₹${amount.toLocaleString("en-IN")}`);
  return parts.join(" · ");
}

export async function notifyFarmerOrderChange(order, { isNew, statusChanged, paymentChanged }) {
  const orderId = order.orderId || order.id;
  const code = order.orderCode ? `#${order.orderCode}` : `#${orderId}`;
  const data = { type: "ORDER", screen: "order", orderId };
  const tag = `order_${orderId}`;
  const summary = orderSummary(order);
  const status = String(order.status || "").toUpperCase();

  let vendorName = order.vendorBusinessName || order.vendorName || "";
  if (!vendorName && order.vendorId) {
    const v = await Vendor.findOne({ $or: [{ id: order.vendorId }, { vendorId: order.vendorId }] })
      .select("businessName vendorName ownerName")
      .lean()
      .catch(() => null);
    if (v) vendorName = v.businessName || v.vendorName || v.ownerName || "";
  }
  const vPrefix = vendorName ? `${vendorName}: ` : "";

  if (isNew) {
    return notifyFarmer(order.farmerId, {
      title: { en: `${vPrefix}New harvest order`, mr: `${vPrefix}नवीन काढणी ऑर्डर` },
      body: { en: `${summary} · ${code}`, mr: `${summary} · ${code}` },
      data: { ...data, event: "ORDER_NEW", status },
      tag,
    });
  }
  if (paymentChanged && PAID_STATUS.test(String(order.paymentStatus || ""))) {
    return notifyFarmer(order.farmerId, {
      title: { en: "Payment credited", mr: "पेमेंट जमा झाले" },
      body: { en: `${summary} · ${code}`, mr: `${summary} · ${code}` },
      data: { ...data, type: "PAYMENT", screen: "earnings", event: "PAYMENT" },
      tag: `payment_${orderId}`,
    });
  }
  if (!statusChanged) return null;
  if (status === "REJECTED" && String(order.rejectedBy || "").toUpperCase() === "FARMER") return null;
  const text = ORDER_STATUS_TEXT[status];
  if (!text) return null;
  const reason = order.rejectionReason ? ` · ${order.rejectionReason}` : "";
  return notifyFarmer(order.farmerId, {
    title: {
      en: `${vPrefix}${text.en}`,
      mr: `${vPrefix}${text.mr}`,
    },
    body: {
      en: `${summary} · ${code}${["REJECTED", "CANCELLED"].includes(status) ? reason : ""}`,
      mr: `${summary} · ${code}${["REJECTED", "CANCELLED"].includes(status) ? reason : ""}`,
    },
    data: { ...data, event: "ORDER_STATUS", status },
    tag,
  });
}

const plainOf = (doc) => (typeof doc?.toObject === "function" ? doc.toObject() : doc);

/** Fire-and-forget wrappers: a slow or failing push must never delay or break an API response. */
export function pushFarmerOrderChange(order, flags) {
  const plain = plainOf(order);
  if (!plain?.farmerId) return;
  notifyFarmerOrderChange(plain, flags).catch((err) => console.warn("[FarmerPush] order push failed:", err.message));
}

export function pushFarmerDocumentReview(doc) {
  const plain = plainOf(doc);
  if (!plain?.farmerId || !["Approved", "Rejected"].includes(plain.status)) return;
  notifyFarmerDocumentReview(plain).catch((err) => console.warn("[FarmerPush] document push failed:", err.message));
}

/**
 * True when a vendor, farmer manager, admin or pickup driver made the change.
 * Farmers are not notified about their own edits; the open /api/farmer(s) routes are the farmer side.
 */
export function isStaffChange(req) {
  const role = String(req?.user?.role || "").toUpperCase();
  if (role) return role !== "FARMER";
  return !/^\/api\/farmers?(\/|$)/.test(req?.baseUrl || "");
}

const fmtQty = (n) => {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

/** changes: [{ grade, change, next }] — one notification per product. */
export function pushFarmerStockChange({ farmerId, productId, productName, unit = "Kg", changes = [] }) {
  const rows = changes.filter((c) => Number(c?.change || 0) !== 0);
  if (!farmerId || !rows.length) return;
  const name = productName || "Product";
  const parts = rows.map((c) => {
    const delta = Number(c.change);
    const grade = String(c.grade || "").replace(/^grade\s*/i, "");
    return `${grade ? `${grade}: ` : ""}${delta > 0 ? "+" : "−"}${fmtQty(Math.abs(delta))} ${unit} (${fmtQty(c.next)} ${unit})`;
  });
  notifyFarmer(farmerId, {
    title: { en: `Stock updated: ${name}`, mr: `स्टॉक अपडेट: ${name}` },
    body: { en: parts.join(" · "), mr: parts.join(" · ") },
    data: { type: "INVENTORY", screen: "inventory", productId: String(productId || "") },
    tag: `stock_${productId || name}`,
  }).catch((err) => console.warn("[FarmerPush] stock push failed:", err.message));
}

export function pushFarmerCropChange(crop, { isNew = false } = {}) {
  const plain = plainOf(crop);
  if (!plain?.farmerId) return;
  const cropId = String(plain.id || plain.cropId || "");
  const name = [plain.cropName || plain.name, plain.variety].filter(Boolean).join(" · ") || "Crop";
  notifyFarmer(plain.farmerId, {
    title: isNew ? { en: "New crop added", mr: "नवीन पीक जोडले" } : { en: "Crop updated", mr: "पीक अपडेट झाले" },
    body: { en: name, mr: name },
    data: { type: "CROP", screen: "crops", cropId },
    tag: `crop_${cropId}`,
  }).catch((err) => console.warn("[FarmerPush] crop push failed:", err.message));
}

export function pushFarmerProductChange(product, { isNew = false } = {}) {
  const plain = plainOf(product);
  if (!plain?.farmerId) return;
  const productId = String(plain.id || plain.productId || "");
  const name = [plain.name || plain.productName, plain.variety].filter(Boolean).join(" · ") || "Product";
  notifyFarmer(plain.farmerId, {
    title: isNew ? { en: "New product added", mr: "नवीन उत्पादन जोडले" } : { en: "Product updated", mr: "उत्पादन अपडेट झाले" },
    body: { en: name, mr: name },
    data: { type: "PRODUCT", screen: "products", productId },
    tag: `product_${productId}`,
  }).catch((err) => console.warn("[FarmerPush] product push failed:", err.message));
}

export function pushFarmerProductReview(product) {
  const plain = plainOf(product);
  if (!plain?.farmerId || !plain.reviewedAt) return;
  notifyFarmerProductReview(plain).catch((err) => console.warn("[FarmerPush] product push failed:", err.message));
}

export function pushFarmerAccountStatus(farmer) {
  const plain = plainOf(farmer);
  if (!plain?.id) return;
  notifyFarmerAccountStatus(plain).catch((err) => console.warn("[FarmerPush] account push failed:", err.message));
}

export async function notifyFarmerProductReview(product) {
  const rejected = product.status === "Rejected";
  const productId = product.id || product.productId || "";
  const name = [product.name, product.variety].filter(Boolean).join(" · ") || "Product";
  const reason = rejected && product.rejectionReason ? product.rejectionReason : "";
  return notifyFarmer(product.farmerId, {
    title: rejected
      ? { en: "Product rejected", mr: "उत्पादन नाकारले" }
      : { en: "Product approved", mr: "उत्पादन मंजूर झाले" },
    body: rejected
      ? { en: `${name}${reason ? ` · Reason: ${reason}` : ""}`, mr: `${name}${reason ? ` · कारण: ${reason}` : ""}` }
      : { en: `${name} is now live for your collection centre.`, mr: `${name} आता तुमच्या संकलन केंद्रासाठी उपलब्ध आहे.` },
    data: { type: "PRODUCT", screen: "products", productId, status: product.status },
    tag: `product_${productId}`,
  });
}

export async function notifyFarmerAccountStatus(farmer) {
  const active = String(farmer.status || "").toLowerCase() === "active";
  return notifyFarmer(farmer.id, {
    title: active
      ? { en: "Account activated", mr: "खाते सक्रिय झाले" }
      : { en: "Account deactivated", mr: "खाते निष्क्रिय केले" },
    body: active
      ? { en: "Your collection centre has activated your account.", mr: "तुमच्या संकलन केंद्राने तुमचे खाते सक्रिय केले आहे." }
      : {
          en: "Your collection centre has deactivated your account. Please contact them.",
          mr: "तुमच्या संकलन केंद्राने तुमचे खाते निष्क्रिय केले आहे. कृपया त्यांच्याशी संपर्क साधा.",
        },
    data: { type: "ACCOUNT", screen: "notifications", status: String(farmer.status || "") },
    tag: "account_status",
  });
}

export async function notifyFarmerDocumentReview(doc) {
  const approved = doc.status === "Approved";
  const docTitle = DOC_TITLES[String(doc.type || "").toLowerCase()] || { en: doc.name || "Document", mr: doc.name || "कागदपत्र" };
  const reason = doc.rejectionReason ? doc.rejectionReason : "";
  return notifyFarmer(doc.farmerId, {
    title: approved
      ? { en: `Document approved: ${docTitle.en}`, mr: `कागदपत्र मंजूर: ${docTitle.mr}` }
      : { en: `Document rejected: ${docTitle.en}`, mr: `कागदपत्र अमान्य: ${docTitle.mr}` },
    body: approved
      ? { en: "Your document has been verified.", mr: "तुमचे कागदपत्र तपासून मंजूर केले आहे." }
      : {
          en: `${reason ? `Reason: ${reason}. ` : ""}Please upload a clear copy again.`,
          mr: `${reason ? `कारण: ${reason}. ` : ""}कृपया स्पष्ट प्रत पुन्हा अपलोड करा.`,
        },
    data: { type: "DOCUMENT", screen: "documents", documentId: doc.id, docType: doc.type, status: doc.status },
    tag: `doc_${doc.type || doc.id}`,
  });
}

const SCHEME_STATUS_TEXT = {
  accepted: { en: "Scheme application approved", mr: "योजना अर्ज मंजूर झाला" },
  rejected: { en: "Scheme application rejected", mr: "योजना अर्ज नाकारला" },
};

export async function notifyFarmerSchemeUpdate(application) {
  const status = String(application.status || "").trim().toLowerCase();
  const text = SCHEME_STATUS_TEXT[status];
  if (!application.farmerId || !text) return null;
  const scheme = application.schemeTitle || application.schemeName || "Government scheme";
  return notifyFarmer(application.farmerId, {
    title: text,
    body: { en: scheme, mr: scheme },
    data: { type: "SCHEME", screen: "schemes", applicationId: String(application._id || application.id || ""), status },
    tag: `scheme_${application._id || application.id || scheme}`,
  });
}
