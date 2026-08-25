import crypto from "crypto";
import {
  Farmer,
  FarmerOrder,
  CollectionCentre,
  Pickup,
  QualityInspection,
} from "./models.js";
import { getIO } from "../../shared/socket.js";

const QUALITY_PENDING = "QUALITY_PENDING";
const INSPECTION = "INSPECTION";
const GRADING = "GRADING";
const GRADE_CONFIRMED = "GRADE_CONFIRMED";
const ORDER_COMPLETED = "ORDER_COMPLETED";
const LOCKED_STATUSES = [GRADE_CONFIRMED, ORDER_COMPLETED];
const RECEIVED_STATUSES = ["COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"];

export const QUALITY_PARAM_OPTIONS = {
  freshness: ["Excellent", "Good", "Average", "Poor"],
  size: ["Uniform", "Mixed", "Small", "Large"],
  colour: ["Good", "Average", "Poor"],
  appearance: ["Excellent", "Good", "Average", "Poor"],
  cleanliness: ["Clean", "Acceptable", "Poor"],
  damage: ["None", "Low", "Medium", "High"],
  moisture: ["Normal", "High", "Low"],
  weight: ["Verified", "Variation"],
  overallQuality: ["Excellent", "Good", "Average", "Poor"],
};

export const REJECTION_REASONS = [
  "Poor Quality",
  "Damaged",
  "Overripe",
  "Undersized",
  "Contamination",
  "Excess Moisture",
  "Other",
];

const REQUIRED_PARAMS = [
  "freshness",
  "size",
  "colour",
  "appearance",
  "cleanliness",
  "damage",
  "moisture",
  "weight",
  "overallQuality",
];

const FINAL_TIMELINE = [
  { key: "ACCEPTED", label: "Order Accepted" },
  { key: "PREPARING", label: "Order Preparation" },
  { key: "PACKING", label: "Packing Completed" },
  { key: "READY_FOR_PICKUP", label: "Pickup" },
  { key: "QR_VERIFIED", label: "QR Verification" },
  { key: "COLLECTION_CENTRE_RECEIVED", label: "Collection Centre Received" },
  { key: "WEIGHT_VERIFICATION", label: "Weight Verification" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "GRADING_COMPLETED", label: "Grading Completed" },
  { key: "ORDER_COMPLETED", label: "Order Completed" },
];

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

function managerIdOf(req) {
  return req.user?.managerId || req.user?.id || "";
}

function actorOf(req) {
  return {
    id: req.user?.id || req.user?.managerId || req.user?.vendorId || "",
    role: req.user?.role || "",
    name: req.user?.name || req.user?.vendorName || "",
  };
}

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function qty(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.round(v * 1000) / 1000;
}

function flattenOrder(order) {
  const plain = toPlain(order) || {};
  const first = plain.products?.[0] || {};
  return {
    productId: plain.productId || first.id || first.productId || "",
    productName: plain.productName || first.name || "",
    variety: plain.variety || "",
    grade: plain.grade || first.grade || "",
    orderedQuantity: Number(plain.orderedQuantity || first.quantity || plain.totalQuantity || 0),
    unit: plain.unit || first.unit || "Kg",
    price: Number(plain.price || first.price || 0),
    orderValue: Number(plain.orderValue || plain.totalAmount || plain.amount || 0),
  };
}

function isWeightVerified(pickup) {
  const rec = pickup?.receiving || {};
  const received =
    RECEIVED_STATUSES.includes(pickup?.status) || rec.status === "RECEIVED";
  return Boolean(received && rec.status === "RECEIVED" && rec.receivedAt);
}

function parseQualityQr(payload) {
  const raw = String(payload || "").trim();
  const pickupMatch = raw.match(/^(?:ggp\.|greengroo:pickup:)([A-Za-z0-9_-]+)$/i);
  if (pickupMatch) return { token: pickupMatch[1] };
  const orderCode = raw.match(/^(?:ggp\.order\.|greengroo:order:)([A-Za-z0-9_-]+)$/i);
  if (orderCode) return { orderId: orderCode[1] };
  if (/^[A-Fa-f0-9]{20,}$/.test(raw)) return { token: raw };
  return { orderId: raw.replace(/^order[:#\s]+/i, "").trim() };
}

function qrMatches(pickup, order, raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  const parsed = parseQualityQr(value);
  if (pickup.qrPayload && value === pickup.qrPayload) return true;
  if (pickup.qrToken && (parsed.token === pickup.qrToken || value === pickup.qrToken)) return true;
  const ids = [order?.id, order?.orderId, pickup?.orderId].filter(Boolean).map(String);
  if (parsed.orderId && ids.includes(parsed.orderId)) return true;
  return ids.some((id) => value.includes(id));
}

function receivedQuantity(pickup, order) {
  const rec = pickup?.receiving || {};
  const accepted = qty(rec.acceptedWeight);
  if (accepted > 0) return accepted;
  const actual = qty(rec.actualWeight);
  if (actual > 0) return actual;
  return qty(pickup?.confirmedQuantity || pickup?.packedQuantity || order?.packedQuantity || 0);
}

function parametersComplete(params = {}) {
  return REQUIRED_PARAMS.every((key) => String(params[key] || "").trim());
}

function sanitizeParameters(body = {}) {
  const src = body.qualityParameters || body.parameters || body;
  const next = {};
  for (const key of REQUIRED_PARAMS) {
    const value = String(src[key] || "").trim();
    const allowed = QUALITY_PARAM_OPTIONS[key];
    if (value && !allowed.includes(value)) {
      const err = new Error(`Invalid ${key} value`);
      err.status = 400;
      throw err;
    }
    next[key] = value;
  }
  return next;
}

function sanitizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((p) => {
      if (typeof p === "string") return { url: p, label: "", uploadedAt: new Date() };
      return {
        url: String(p.url || p.src || ""),
        label: String(p.label || p.kind || ""),
        uploadedAt: p.uploadedAt ? new Date(p.uploadedAt) : new Date(),
      };
    })
    .filter((p) => p.url && p.url.length > 20 && p.url.length < 2_500_000)
    .filter((p) => p.url.startsWith("data:image/") || p.url.startsWith("http://") || p.url.startsWith("https://"))
    .slice(0, 8);
}

function recordAction(inspection, req, action) {
  const actor = actorOf(req);
  inspection.lastActionBy = actor.id;
  inspection.lastActionRole = actor.role;
  inspection.lastActionAt = new Date();
  inspection.actions = [
    ...(inspection.actions || []),
    { action, userId: actor.id, role: actor.role, at: new Date() },
  ];
}

async function applyOrderStatus(order, status, note) {
  if (!order) return;
  order.status = status;
  order.preparationStatus = status;
  order.timeline = [...(order.timeline || []), { status, at: new Date(), note }];
  await order.save();
}

function emitQualityUpdate(payload) {
  try {
    const io = getIO();
    if (payload.farmerId) io.to(`farmer_${payload.farmerId}`).emit("quality_updated", payload);
    if (payload.managerId) io.to(`manager_${payload.managerId}`).emit("quality_updated", payload);
    if (payload.vendorId) io.to(`vendor_${payload.vendorId}`).emit("quality_updated", payload);
  } catch {
    // optional
  }
}

async function assertQualityAccess(req, pickup, farmer) {
  if (req.user?.role === "VENDOR") {
    if (pickup.vendorId !== vendorIdOf(req)) {
      const err = new Error("Forbidden — this order is not in your vendor scope");
      err.status = 403;
      throw err;
    }
    return;
  }
  if (req.user?.role === "FARMER_MANAGER") {
    const f = farmer || (await Farmer.findOne({ id: pickup.farmerId }).lean());
    if (!f || f.managerId !== managerIdOf(req)) {
      const err = new Error("Forbidden — this order is not assigned to you");
      err.status = 403;
      throw err;
    }
    return;
  }
  const err = new Error("Forbidden — Quality inspection requires Vendor or Manager access");
  err.status = 403;
  throw err;
}

async function scopedFarmerIds(req) {
  if (req.user?.role === "VENDOR") {
    const farmers = await Farmer.find({ vendorId: vendorIdOf(req) }).select("id").lean();
    return farmers.map((f) => f.id);
  }
  const farmers = await Farmer.find({ managerId: managerIdOf(req) }).select("id").lean();
  return farmers.map((f) => f.id);
}

async function findPickupForOrder(orderId) {
  return Pickup.findOne({
    $or: [{ orderId }, { id: orderId }, { pickupId: orderId }],
  });
}

async function findOrder(orderId) {
  return FarmerOrder.findOne({ $or: [{ id: orderId }, { orderId }] });
}

async function ensureInspection(pickup, order) {
  const orderId = order?.id || pickup.orderId;
  let inspection = await QualityInspection.findOne({
    $or: [{ orderId }, { pickupId: pickup.id }, { batchId: pickup.id }],
  });
  if (inspection) return inspection;
  const flat = flattenOrder(order || {});
  inspection = await QualityInspection.create({
    inspectionId: newId("qi"),
    orderId,
    farmerId: pickup.farmerId,
    productId: flat.productId || order?.productId || "",
    batchId: pickup.id,
    collectionCentreId: pickup.collectionCentreId || "",
    pickupId: pickup.id,
    vendorId: pickup.vendorId,
    status: QUALITY_PENDING,
  });
  return inspection;
}

function splitTotals(inspection, totalReceived) {
  const gradeA = qty(inspection.gradeAQuantity);
  const gradeB = qty(inspection.gradeBQuantity);
  const gradeC = qty(inspection.gradeCQuantity);
  const rejected = qty(inspection.rejectedQuantity);
  const allocated = qty(gradeA + gradeB + gradeC + rejected);
  const remaining = qty(totalReceived - allocated);
  return { gradeA, gradeB, gradeC, rejected, allocated, remaining, totalReceived };
}

function assertSplitValid(split, inspection) {
  if (split.allocated > split.totalReceived + 0.001) {
    const err = new Error("Grade quantities cannot exceed the received quantity");
    err.status = 400;
    throw err;
  }
  if (Math.abs(split.remaining) > 0.001) {
    const err = new Error("Remaining quantity must be 0 before grading can be confirmed");
    err.status = 400;
    throw err;
  }
  if (split.rejected > 0) {
    const reason = String(inspection.rejectionReason || "").trim();
    if (!reason || !REJECTION_REASONS.includes(reason)) {
      const err = new Error("Rejected quantity requires a rejection reason");
      err.status = 400;
      throw err;
    }
    if (reason === "Other" && !String(inspection.rejectionRemarks || "").trim()) {
      const err = new Error("Other reason is required when rejection reason is Other");
      err.status = 400;
      throw err;
    }
  }
}

function formatReceivedAt(pickup) {
  const at = pickup?.receiving?.receivedAt;
  if (!at) return { date: "", time: "" };
  const d = new Date(at);
  return {
    date: d.toLocaleDateString("en-IN"),
    time: d.toLocaleTimeString("en-IN"),
    iso: d.toISOString(),
  };
}

function buildTimeline(order, pickup, inspection) {
  const events = [
    ...(order?.timeline || []),
    ...(pickup?.timeline || []),
  ].map((e) => ({
    status: e.status,
    at: e.at,
    note: e.note || "",
  }));
  const rec = pickup?.receiving || {};
  if (rec.receivedAt) {
    events.push({ status: "COLLECTION_CENTRE_RECEIVED", at: rec.receivedAt, note: "Received at collection centre" });
    events.push({ status: "WEIGHT_VERIFICATION", at: rec.receivedAt, note: "Weight verification completed" });
  }
  if (inspection?.inspectionStartedAt) {
    events.push({ status: "QUALITY_CHECK", at: inspection.inspectionStartedAt, note: "Quality check started" });
  }
  if (inspection?.gradingConfirmedAt) {
    events.push({ status: "GRADING_COMPLETED", at: inspection.gradingConfirmedAt, note: "Grading confirmed" });
  }
  if (inspection?.status === ORDER_COMPLETED) {
    events.push({ status: "ORDER_COMPLETED", at: inspection.updatedAt || inspection.gradingConfirmedAt, note: "Order completed" });
  }

  const aliases = {
    ACCEPTED: "ACCEPTED",
    PREPARING: "PREPARING",
    PACKING: "PACKING",
    READY_FOR_PICKUP: "READY_FOR_PICKUP",
    DRIVER_ASSIGNED: "READY_FOR_PICKUP",
    DISPATCHED: "READY_FOR_PICKUP",
    DRIVER_ARRIVED: "READY_FOR_PICKUP",
    ORDER_VERIFIED: "READY_FOR_PICKUP",
    QR_VERIFIED: "QR_VERIFIED",
    PICKED_UP: "QR_VERIFIED",
    COLLECTION_CENTRE_RECEIVED: "COLLECTION_CENTRE_RECEIVED",
    RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
    WEIGHT_CHECK: "WEIGHT_VERIFICATION",
    WEIGHT_VERIFICATION: "WEIGHT_VERIFICATION",
    QUALITY_PENDING: "QUALITY_CHECK",
    INSPECTION: "QUALITY_CHECK",
    GRADING: "QUALITY_CHECK",
    GRADE_CONFIRMED: "GRADING_COMPLETED",
    ORDER_COMPLETED: "ORDER_COMPLETED",
  };

  const latest = {};
  for (const e of events) {
    const key = aliases[e.status] || e.status;
    const prev = latest[key];
    if (!prev || new Date(e.at || 0) > new Date(prev.at || 0)) latest[key] = { ...e, status: key };
  }

  let reached = true;
  return FINAL_TIMELINE.map((step) => {
    const hit = latest[step.key];
    if (!hit) reached = false;
    return {
      key: step.key,
      label: step.label,
      done: Boolean(hit),
      at: hit?.at || null,
      note: hit?.note || "",
    };
  }).map((step, i, arr) => {
    if (i > 0 && !arr[i - 1].done) return { ...step, done: false };
    return step;
  });
}

async function presentInspection(inspection, pickup, order, farmer, centre) {
  const rec = pickup?.receiving || {};
  const flat = flattenOrder(order || {});
  const received = formatReceivedAt(pickup);
  const totalReceived = receivedQuantity(pickup, order);
  const split = splitTotals(inspection, totalReceived);
  const unit = rec.weightUnit || pickup?.unit || flat.unit || "Kg";
  const price = flat.price;
  const payableQty = qty(split.gradeA + split.gradeB + split.gradeC);
  const finalAmount = qty(price ? payableQty * price : (order?.orderValue || 0));
  const locked = LOCKED_STATUSES.includes(inspection.status);
  return {
    inspectionId: inspection.inspectionId,
    orderId: order?.id || inspection.orderId,
    orderDisplayId: order?.orderId || order?.id || inspection.orderId,
    qrPayload: pickup?.qrPayload || "",
    qrToken: pickup?.qrToken || "",
    farmerId: inspection.farmerId,
    farmerName: farmer?.name || "",
    farmerMobile: farmer?.mobile || "",
    productId: inspection.productId || flat.productId,
    product: flat.productName,
    productName: flat.productName,
    variety: flat.variety || pickup?.variety || "",
    orderedQuantity: qty(flat.orderedQuantity),
    receivedQuantity: totalReceived,
    actualWeight: qty(rec.actualWeight),
    acceptedWeight: qty(rec.acceptedWeight || totalReceived),
    acceptedQuantity: qty(rec.acceptedWeight || totalReceived),
    finalWeight: qty(rec.acceptedWeight || rec.actualWeight || totalReceived),
    batchId: inspection.batchId || pickup?.id || "",
    pickupId: pickup?.id || inspection.pickupId || "",
    collectionCentreId: inspection.collectionCentreId || pickup?.collectionCentreId || "",
    collectionCentre: centre?.name || order?.collectionCentre || "Main Collection Centre",
    receivedDate: received.date,
    receivedTime: received.time,
    receivedAt: received.iso || rec.receivedAt || null,
    unit,
    inspectorId: inspection.inspectorId,
    inspectorRole: inspection.inspectorRole,
    inspectorName: inspection.inspectorName,
    qualityParameters: {
      freshness: inspection.qualityParameters?.freshness || "",
      size: inspection.qualityParameters?.size || "",
      colour: inspection.qualityParameters?.colour || "",
      appearance: inspection.qualityParameters?.appearance || "",
      cleanliness: inspection.qualityParameters?.cleanliness || "",
      damage: inspection.qualityParameters?.damage || "",
      moisture: inspection.qualityParameters?.moisture || "",
      weight: inspection.qualityParameters?.weight || "",
      overallQuality: inspection.qualityParameters?.overallQuality || "",
    },
    qualityRemarks: inspection.qualityRemarks || "",
    qualityPhotos: (inspection.qualityPhotos || []).map((p) => ({
      url: p.url,
      label: p.label || "",
      uploadedAt: p.uploadedAt,
    })),
    gradeAQuantity: split.gradeA,
    gradeBQuantity: split.gradeB,
    gradeCQuantity: split.gradeC,
    rejectedQuantity: split.rejected,
    allocatedQuantity: split.allocated,
    remainingQuantity: split.remaining,
    rejectionReason: inspection.rejectionReason || "",
    rejectionRemarks: inspection.rejectionRemarks || "",
    status: inspection.status,
    qualityStatus: inspection.status,
    parametersComplete: parametersComplete(inspection.qualityParameters),
    weightVerified: isWeightVerified(pickup),
    locked,
    inspectionStartedAt: inspection.inspectionStartedAt,
    inspectionCompletedAt: inspection.inspectionCompletedAt,
    gradingConfirmedAt: inspection.gradingConfirmedAt,
    lastActionBy: inspection.lastActionBy,
    lastActionRole: inspection.lastActionRole,
    lastActionAt: inspection.lastActionAt,
    price,
    finalAmount,
    paymentStatus: order?.paymentStatus || "Pending",
    paramOptions: QUALITY_PARAM_OPTIONS,
    rejectionReasons: REJECTION_REASONS,
    timeline: buildTimeline(order, pickup, inspection),
  };
}

async function loadBundleByOrderId(orderId) {
  const inspection = await QualityInspection.findOne({
    $or: [{ orderId }, { inspectionId: orderId }, { pickupId: orderId }, { batchId: orderId }],
  });
  const pickup = await findPickupForOrder(inspection?.orderId || inspection?.pickupId || orderId);
  if (!pickup) return null;
  const order = await findOrder(pickup.orderId || inspection?.orderId || orderId);
  return { inspection, pickup, order };
}

async function requireEligibleBundle(req, orderId) {
  const bundle = await loadBundleByOrderId(orderId);
  if (!bundle?.pickup) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  const farmer = await Farmer.findOne({ id: bundle.pickup.farmerId });
  await assertQualityAccess(req, bundle.pickup, farmer);
  if (!isWeightVerified(bundle.pickup)) {
    const err = new Error("Quality check can start only after collection centre receiving and weight verification");
    err.status = 400;
    throw err;
  }
  const order = bundle.order || (await findOrder(bundle.pickup.orderId));
  const inspection = bundle.inspection || (await ensureInspection(bundle.pickup, order));
  const centre = bundle.pickup.collectionCentreId
    ? await CollectionCentre.findOne({ id: bundle.pickup.collectionCentreId }).lean()
    : null;
  return { inspection, pickup: bundle.pickup, order, farmer, centre };
}

const BUCKETS = {
  pending: [QUALITY_PENDING],
  inspection: [INSPECTION],
  grading: [GRADING],
  completed: [GRADE_CONFIRMED, ORDER_COMPLETED],
};

export async function listQualityPending(req, res) {
  try {
    const bucket = String(req.query.bucket || req.query.stage || req.query.filter || "pending").toLowerCase();
    const statuses = BUCKETS[bucket] || BUCKETS.pending;
    const farmerIds = await scopedFarmerIds(req);
    const pickups = await Pickup.find({
      farmerId: { $in: farmerIds },
      status: { $in: RECEIVED_STATUSES },
      "receiving.status": "RECEIVED",
    }).lean();

    if (statuses.includes(QUALITY_PENDING)) {
      for (const pickup of pickups) {
        const order = await findOrder(pickup.orderId);
        await ensureInspection(pickup, order);
      }
    }

    const pickupIds = pickups.map((p) => p.id);
    const inspections = await QualityInspection.find({
      $or: [{ pickupId: { $in: pickupIds } }, { farmerId: { $in: farmerIds } }],
      status: { $in: statuses },
    }).sort({ updatedAt: -1 });

    const rows = [];
    for (const inspection of inspections) {
      const pickup = pickups.find((p) => p.id === inspection.pickupId || p.orderId === inspection.orderId)
        || (await findPickupForOrder(inspection.orderId));
      if (!pickup) continue;
      try {
        await assertQualityAccess(req, pickup);
      } catch {
        continue;
      }
      if (!isWeightVerified(pickup)) continue;
      const order = await findOrder(inspection.orderId);
      const farmer = await Farmer.findOne({ id: inspection.farmerId }).lean();
      const centre = pickup.collectionCentreId
        ? await CollectionCentre.findOne({ id: pickup.collectionCentreId }).lean()
        : null;
      rows.push(await presentInspection(inspection, pickup, order, farmer, centre));
    }
    res.json({ items: rows, bucket, count: rows.length });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to list quality inspections" });
  }
}

export async function getQualityInspection(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    res.json(await presentInspection(inspection, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to load quality inspection" });
  }
}

export async function verifyQualityQr(req, res) {
  try {
    const raw = String(req.body?.qrPayload || req.body?.qr || req.body?.code || "").trim();
    if (!raw) return res.status(400).json({ message: "QR / order code is required" });
    const parsed = parseQualityQr(raw);
    let pickup = null;
    if (parsed.token) {
      pickup = await Pickup.findOne({ $or: [{ qrToken: parsed.token }, { qrPayload: raw }] });
    }
    if (!pickup && parsed.orderId) {
      pickup = await findPickupForOrder(parsed.orderId);
    }
    if (!pickup) {
      pickup = await Pickup.findOne({
        $or: [{ qrPayload: raw }, { orderId: raw }, { id: raw }],
      });
    }
    if (!pickup) return res.status(404).json({ message: "Order not found for this QR" });
    const order = await findOrder(pickup.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const farmer = await Farmer.findOne({ id: pickup.farmerId });
    await assertQualityAccess(req, pickup, farmer);
    if (order.farmerId && order.farmerId !== pickup.farmerId) {
      return res.status(400).json({ message: "QR does not match the farmer for this order" });
    }
    const flat = flattenOrder(order);
    if (pickup.productName && flat.productName && pickup.productName !== flat.productName) {
      return res.status(400).json({ message: "QR does not match the product for this order" });
    }
    if (!RECEIVED_STATUSES.includes(pickup.status) && pickup.receiving?.status !== "RECEIVED") {
      return res.status(400).json({ message: "Order has not been received by the collection centre" });
    }
    if (!isWeightVerified(pickup)) {
      return res.status(400).json({ message: "Weight verification is not completed" });
    }
    if (!qrMatches(pickup, order, raw)) {
      return res.status(400).json({ message: "QR / order code does not match this order" });
    }
    const inspection = await ensureInspection(pickup, order);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({
        message: "Quality inspection is already completed for this order",
        orderId: order.id,
        status: inspection.status,
      });
    }
    if (inspection.batchId && pickup.id && inspection.batchId !== pickup.id) {
      return res.status(400).json({ message: "QR does not match the batch for this order" });
    }
    const centre = pickup.collectionCentreId
      ? await CollectionCentre.findOne({ id: pickup.collectionCentreId }).lean()
      : null;
    res.json({
      verified: true,
      orderId: order.id,
      inspectionId: inspection.inspectionId,
      inspection: await presentInspection(inspection, pickup, order, farmer, centre),
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "QR verification failed" });
  }
}

export async function startQualityCheck(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({ message: "Quality inspection is already completed" });
    }
    if (inspection.status !== QUALITY_PENDING && inspection.status !== INSPECTION) {
      return res.status(400).json({ message: `Cannot start quality check from ${inspection.status}` });
    }
    const actor = actorOf(req);
    const now = new Date();
    inspection.status = INSPECTION;
    inspection.inspectionStartedAt = inspection.inspectionStartedAt || now;
    inspection.inspectorId = actor.id;
    inspection.inspectorRole = actor.role;
    inspection.inspectorName = actor.name;
    recordAction(inspection, req, "START_QUALITY_CHECK");
    await inspection.save();
    await applyOrderStatus(order, INSPECTION, "Quality inspection started.");
    emitQualityUpdate({
      orderId: order.id,
      farmerId: inspection.farmerId,
      vendorId: pickup.vendorId,
      managerId: farmer?.managerId || pickup.managerId,
      status: inspection.status,
    });
    res.json(await presentInspection(inspection, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to start quality check" });
  }
}

export async function saveQualityPhotos(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({ message: "Quality inspection is locked after grading confirmation" });
    }
    if (inspection.status === QUALITY_PENDING) {
      return res.status(400).json({ message: "Start quality check before uploading photos" });
    }
    const incoming = sanitizePhotos(req.body?.photos || req.body?.qualityPhotos || []);
    if (req.body?.replace === true) {
      inspection.qualityPhotos = incoming;
    } else {
      inspection.qualityPhotos = sanitizePhotos([...(inspection.qualityPhotos || []), ...incoming]);
    }
    if (req.body?.removeIndex != null) {
      const idx = Number(req.body.removeIndex);
      inspection.qualityPhotos = (inspection.qualityPhotos || []).filter((_, i) => i !== idx);
    }
    recordAction(inspection, req, "UPLOAD_QUALITY_PHOTOS");
    await inspection.save();
    res.json(await presentInspection(inspection, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to save quality photos" });
  }
}

export async function saveQualityParameters(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({ message: "Quality parameters cannot be edited after grading confirmation" });
    }
    if (inspection.status === QUALITY_PENDING) {
      return res.status(400).json({ message: "Start quality check before entering parameters" });
    }
    const next = sanitizeParameters(req.body);
    inspection.qualityParameters = { ...(inspection.qualityParameters || {}), ...next };
    if (req.body.qualityRemarks != null) inspection.qualityRemarks = String(req.body.qualityRemarks);
    recordAction(inspection, req, "SAVE_QUALITY_PARAMETERS");
    await inspection.save();
    res.json(await presentInspection(inspection, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to save quality parameters" });
  }
}

export async function saveQualityGrading(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({ message: "Grading cannot be edited after confirmation" });
    }
    if (inspection.status === QUALITY_PENDING) {
      return res.status(400).json({ message: "Start quality check before grading" });
    }
    if (!parametersComplete(inspection.qualityParameters)) {
      return res.status(400).json({ message: "Complete all mandatory quality parameters before grading" });
    }
    inspection.gradeAQuantity = qty(req.body.gradeAQuantity);
    inspection.gradeBQuantity = qty(req.body.gradeBQuantity);
    inspection.gradeCQuantity = qty(req.body.gradeCQuantity);
    inspection.rejectedQuantity = qty(req.body.rejectedQuantity);
    inspection.rejectionReason = String(req.body.rejectionReason || "").trim();
    inspection.rejectionRemarks = String(req.body.rejectionRemarks || req.body.otherReason || "").trim();
    if (req.body.qualityRemarks != null) inspection.qualityRemarks = String(req.body.qualityRemarks);
    const split = splitTotals(inspection, receivedQuantity(pickup, order));
    if (split.allocated > split.totalReceived + 0.001) {
      return res.status(400).json({ message: "Grade quantities cannot exceed the received quantity" });
    }
    if (split.rejected > 0 && !inspection.rejectionReason) {
      return res.status(400).json({ message: "Rejected quantity requires a rejection reason" });
    }
    if (inspection.rejectionReason && !REJECTION_REASONS.includes(inspection.rejectionReason)) {
      return res.status(400).json({ message: "Invalid rejection reason" });
    }
    inspection.status = GRADING;
    recordAction(inspection, req, "ASSIGN_GRADE");
    await inspection.save();
    await applyOrderStatus(order, GRADING, "Grade quantities assigned.");
    emitQualityUpdate({
      orderId: order.id,
      farmerId: inspection.farmerId,
      vendorId: pickup.vendorId,
      managerId: farmer?.managerId || pickup.managerId,
      status: inspection.status,
    });
    res.json(await presentInspection(inspection, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to save grading" });
  }
}

export async function confirmQualityGrading(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    if (LOCKED_STATUSES.includes(inspection.status)) {
      return res.status(409).json({ message: "Grading is already confirmed for this order" });
    }
    if (!parametersComplete(inspection.qualityParameters)) {
      return res.status(400).json({ message: "Complete all mandatory quality parameters before confirming grading" });
    }
    const split = splitTotals(inspection, receivedQuantity(pickup, order));
    assertSplitValid(split, inspection);
    const actor = actorOf(req);
    const now = new Date();
    const updated = await QualityInspection.findOneAndUpdate(
      {
        inspectionId: inspection.inspectionId,
        status: { $in: [INSPECTION, GRADING] },
        gradingConfirmedAt: null,
      },
      {
        $set: {
          status: GRADE_CONFIRMED,
          inspectorId: inspection.inspectorId || actor.id,
          inspectorRole: inspection.inspectorRole || actor.role,
          inspectorName: inspection.inspectorName || actor.name,
          inspectionCompletedAt: now,
          gradingConfirmedAt: now,
          lastActionBy: actor.id,
          lastActionRole: actor.role,
          lastActionAt: now,
        },
        $push: {
          actions: { action: "CONFIRM_GRADING", userId: actor.id, role: actor.role, at: now },
        },
      },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ message: "Duplicate grading confirmation is not allowed" });
    }
    order.gradeAQuantity = split.gradeA;
    order.gradeBQuantity = split.gradeB;
    order.gradeCQuantity = split.gradeC;
    order.rejectedQuantity = split.rejected;
    order.qualityStatus = GRADE_CONFIRMED;
    await applyOrderStatus(order, GRADE_CONFIRMED, "Grading confirmed.");
    updated.status = ORDER_COMPLETED;
    updated.actions = [
      ...(updated.actions || []),
      { action: "ORDER_COMPLETED", userId: actor.id, role: actor.role, at: new Date() },
    ];
    await updated.save();
    await applyOrderStatus(order, ORDER_COMPLETED, "Order completed after quality grading.");
    emitQualityUpdate({
      orderId: order.id,
      farmerId: updated.farmerId,
      vendorId: pickup.vendorId,
      managerId: farmer?.managerId || pickup.managerId,
      status: ORDER_COMPLETED,
    });
    res.json(await presentInspection(updated, pickup, order, farmer, centre));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to confirm grading" });
  }
}

export async function getQualityFinalSummary(req, res) {
  try {
    const { inspection, pickup, order, farmer, centre } = await requireEligibleBundle(req, req.params.orderId);
    const data = await presentInspection(inspection, pickup, order, farmer, centre);
    res.json({
      orderId: data.orderDisplayId,
      internalOrderId: data.orderId,
      qrPayload: data.qrPayload,
      farmerName: data.farmerName,
      product: data.product,
      orderedQuantity: data.orderedQuantity,
      receivedQuantity: data.receivedQuantity,
      acceptedQuantity: data.acceptedQuantity,
      gradeAQuantity: data.gradeAQuantity,
      gradeBQuantity: data.gradeBQuantity,
      gradeCQuantity: data.gradeCQuantity,
      rejectedQuantity: data.rejectedQuantity,
      finalWeight: data.finalWeight,
      finalQualityStatus: data.status,
      finalAmount: data.finalAmount,
      paymentStatus: data.paymentStatus,
      unit: data.unit,
      batchId: data.batchId,
      collectionCentre: data.collectionCentre,
      timeline: data.timeline,
      inspection: data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to load final summary" });
  }
}
