import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  Farmer,
  FarmerManager,
  FarmerOrder,
  PickupDriver,
  CollectionCentre,
  Pickup,
} from "./models.js";
import { getIO } from "../../shared/socket.js";

const JWT_SECRET = process.env.JWT_SECRET || "greengroo-secret";
const ASSIGNED_STATUSES = ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED"];
const IN_PROGRESS_STATUSES = ["DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"];
const COMPLETED_PICKUP_STATUSES = ["PICKED_UP", "COMPLETED"];
const ACTIVE_DRIVER_WORK = ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED", "DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"];
const ACTIVE_PICKUP_STATUSES = [...ACTIVE_DRIVER_WORK];
const HISTORY_PICKUP_STATUSES = ["PICKED_UP", "COMPLETED", "IN_TRANSIT", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"];
const ASSIGNABLE_DRIVER_STATUSES = ["Active", "On Duty", "Available"];
const PRE_ASSIGN_STATUSES = ["READY_FOR_PICKUP"];
const REASSIGN_STATUSES = ["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED", "DISPATCHED"];
const CENTRE_STATUSES = ["PICKED_UP", "COMPLETED", "IN_TRANSIT", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"];

function normalizeDriverStatus(status) {
  if (status === "Available") return "Active";
  if (status === "On Pickup") return "On Duty";
  if (status === "Offline") return "Off Duty";
  return status || "Active";
}

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

function managerIdOf(req) {
  return req.user?.managerId || req.user?.id || "";
}

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
  };
}

function farmerLocation(farmer) {
  if (!farmer) return "";
  const geo = farmer.farmGeo || {};
  return (
    farmer.farmLocation ||
    geo.farmAddress ||
    [geo.village, geo.taluka, geo.district, geo.pincode].filter(Boolean).join(", ") ||
    farmer.address ||
    ""
  );
}

function mapsUrl(farmer) {
  const geo = farmer?.farmGeo || {};
  if (geo.latitude != null && geo.longitude != null) {
    return `https://maps.google.com/?q=${geo.latitude},${geo.longitude}`;
  }
  const loc = farmerLocation(farmer);
  return loc ? `https://maps.google.com/?q=${encodeURIComponent(loc)}` : "";
}

function qrTokenForPickup() {
  return crypto.randomBytes(16).toString("hex");
}

function qrPayloadFromToken(token) {
  return `ggp.${token}`;
}

function parsePickupQr(payload) {
  const raw = String(payload || "").trim();
  const pickupMatch = raw.match(/^(?:ggp\.|greengroo:pickup:)([A-Za-z0-9_-]+)$/i);
  if (pickupMatch) return { token: pickupMatch[1] };
  const orderMatch = raw.match(/greengroo:order:([A-Za-z0-9_-]+)/i);
  if (orderMatch) return { orderId: orderMatch[1] };
  if (/^[A-Fa-f0-9]{20,}$/.test(raw)) return { token: raw };
  return { orderId: raw.replace(/^order[:#\s]+/i, "").trim() };
}

function emitPickupUpdate(pickup, extra = {}) {
  try {
    const io = getIO();
    const plain = toPlain(pickup) || pickup;
    const payload = {
      pickupId: plain.id || plain.pickupId,
      orderId: plain.orderId,
      farmerId: plain.farmerId,
      managerId: plain.managerId,
      driverId: plain.driverId,
      vendorId: plain.vendorId,
      status: plain.status,
      ...extra,
    };
    if (plain.farmerId) io.to(`farmer_${plain.farmerId}`).emit("pickup_updated", payload);
    if (plain.managerId) io.to(`manager_${plain.managerId}`).emit("pickup_updated", payload);
    if (plain.driverId) io.to(`driver_${plain.driverId}`).emit("pickup_updated", payload);
    if (plain.vendorId) io.to(`vendor_${plain.vendorId}`).emit("pickup_updated", payload);
  } catch {
    // Socket is optional; panels poll as fallback.
  }
}

function pushPickupTimeline(pickup, status, note) {
  pickup.timeline = [...(pickup.timeline || []), { status, at: new Date(), note: note || "" }];
}

function qrPayloadFor(order) {
  const id = order?.orderId || order?.id;
  return id ? `ggp.order.${id}` : "";
}

function parseQrOrderId(payload) {
  const parsed = parsePickupQr(payload);
  return parsed.orderId || parsed.token || "";
}

async function ensureDefaultCentre(vendorId) {
  let centre = await CollectionCentre.findOne({ vendorId, status: "Active" });
  if (centre) return centre;
  const id = newId("cc");
  centre = await CollectionCentre.create({
    id,
    vendorId,
    name: "Main Collection Centre",
    address: "",
    city: "",
    status: "Active",
  });
  return centre;
}

export async function ensurePickupForOrder(order, farmer) {
  if (!order) return null;
  const existing = await Pickup.findOne({
    $or: [{ orderId: order.id }, { orderId: order.orderId }, { id: order.pickupId }],
  });
  const flat = flattenOrder(order);
  const packed = Number(order.packedQuantity || 0);
  const packages = Number(order.packingDetails?.packageCount || 0);
  const expected = packed || flat.orderedQuantity;

  if (existing) {
    if (!existing.driverId && existing.status === "READY_FOR_PICKUP") {
      existing.packedQuantity = packed || existing.packedQuantity;
      existing.packageCount = packages || existing.packageCount;
      existing.expectedQuantity = expected || existing.expectedQuantity;
      existing.productName = existing.productName || flat.productName;
      existing.variety = existing.variety || flat.variety;
      existing.grade = existing.grade || flat.grade;
      if (!existing.qrToken) {
        existing.qrToken = qrTokenForPickup();
        existing.qrPayload = qrPayloadFromToken(existing.qrToken);
      }
      existing.pickupInstructions = existing.pickupInstructions || String(order.packingDetails?.notes || "");
      if (farmer?.managerId) existing.managerId = existing.managerId || farmer.managerId;
      await existing.save();
      emitPickupUpdate(existing, { event: "READY_FOR_PICKUP" });
    }
    return existing;
  }

  const centre = await ensureDefaultCentre(order.vendorId);
  const pickupId = `PKP-${Date.now()}`;
  const qrToken = qrTokenForPickup();
  const created = await Pickup.create({
    id: pickupId,
    pickupId,
    orderId: order.id,
    vendorId: order.vendorId,
    managerId: farmer?.managerId || order.managerId || "",
    farmerId: order.farmerId,
    collectionCentreId: centre.id,
    scheduledDate: order.pickupDate || order.requiredDate || order.harvestDate || "",
    scheduledTime: order.harvestTime || order.pickupTime || "",
    pickupDate: order.pickupDate || order.requiredDate || order.harvestDate || "",
    pickupTime: order.harvestTime || order.pickupTime || "",
    pickupLocation: farmerLocation(farmer),
    expectedQuantity: expected,
    packedQuantity: packed,
    packageCount: packages,
    unit: flat.unit,
    productName: flat.productName,
    variety: flat.variety,
    grade: flat.grade,
    qrToken,
    qrPayload: qrPayloadFromToken(qrToken),
    pickupInstructions: String(order.packingDetails?.notes || ""),
    status: "READY_FOR_PICKUP",
    timeline: [{ status: "READY_FOR_PICKUP", at: new Date(), note: "Order marked ready for pickup." }],
  });
  emitPickupUpdate(created, { event: "READY_FOR_PICKUP" });
  return created;
}

async function backfillReadyPickups(vendorId) {
  const readyOrders = await FarmerOrder.find({
    vendorId,
    status: { $in: ["READY_FOR_PICKUP", "Ready for Pickup"] },
  }).lean();
  if (!readyOrders.length) return;
  const ids = readyOrders.map((o) => o.id).filter(Boolean);
  const orderIds = readyOrders.map((o) => o.orderId).filter(Boolean);
  const existing = await Pickup.find({
    $or: [{ orderId: { $in: [...ids, ...orderIds] } }],
  }).lean();
  const have = new Set(existing.map((p) => p.orderId));
  const missing = readyOrders.filter((o) => !have.has(o.id) && !have.has(o.orderId));
  if (!missing.length) return;
  const farmers = await Farmer.find({ id: { $in: missing.map((o) => o.farmerId) } }).lean();
  const farmerMap = Object.fromEntries(farmers.map((f) => [f.id, f]));
  await Promise.all(missing.map((o) => ensurePickupForOrder(o, farmerMap[o.farmerId])));
}

async function refreshDriverAvailability(driver) {
  if (!driver) return driver;
  const current = normalizeDriverStatus(driver.status);
  if (current === "Inactive" || current === "Off Duty") {
    driver.status = current;
    await driver.save();
    return driver;
  }
  const active = await Pickup.countDocuments({
    driverId: driver.id,
    status: { $in: ACTIVE_DRIVER_WORK },
  });
  driver.status = active > 0 ? "On Duty" : "Active";
  await driver.save();
  return driver;
}

async function loadOrderForPickup(pickup) {
  return FarmerOrder.findOne({
    $or: [{ id: pickup.orderId }, { orderId: pickup.orderId }],
  });
}

async function applyOrderStatus(order, status, note) {
  if (!order) return;
  order.status = status;
  order.preparationStatus = status;
  order.timeline = [...(order.timeline || []), { status, at: new Date(), note }];
  await order.save();
}

async function enrichPickup(pickup) {
  const plain = toPlain(pickup);
  const [farmer, manager, driver, centre, order] = await Promise.all([
    Farmer.findOne({ id: plain.farmerId }).lean(),
    plain.managerId ? FarmerManager.findOne({ id: plain.managerId }).lean() : null,
    plain.driverId ? PickupDriver.findOne({ id: plain.driverId }).lean() : null,
    plain.collectionCentreId ? CollectionCentre.findOne({ id: plain.collectionCentreId }).lean() : null,
    FarmerOrder.findOne({ $or: [{ id: plain.orderId }, { orderId: plain.orderId }] }).lean(),
  ]);
  const flat = flattenOrder(order || {});
  const receiving = plain.receiving || {};
  return {
    ...plain,
    pickupId: plain.pickupId || plain.id,
    orderDisplayId: order?.orderId || order?.id || plain.orderId,
    farmerName: farmer?.name || "",
    farmerMobile: farmer?.mobile || "",
    farmerLocation: plain.pickupLocation || farmerLocation(farmer),
    farmGeo: farmer?.farmGeo || {},
    mapsUrl: mapsUrl(farmer),
    managerName: manager?.name || "",
    managerMobile: manager?.mobile || "",
    pickupDate: plain.pickupDate || plain.scheduledDate || "",
    pickupTime: plain.pickupTime || plain.scheduledTime || "",
    readyAt: order?.readyForPickupAt || null,
    driverStatus: plain.driverStatus || "",
    driver: driver
      ? {
          id: driver.id,
          name: driver.name,
          mobile: driver.mobile,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          assignedArea: driver.assignedArea || "",
          currentLocation: driver.assignedArea || "",
          status: normalizeDriverStatus(driver.status),
          licenseNumber: driver.licenseNumber || "",
        }
      : null,
    collectionCentreName: centre?.name || order?.collectionCentre || "Main Collection Centre",
    collectionCentre: centre || null,
    productName: plain.productName || flat.productName,
    variety: plain.variety || flat.variety,
    grade: plain.grade || flat.grade,
    orderedQuantity: Number(order?.orderedQuantity || flat.orderedQuantity || 0),
    packedQuantity: Number(plain.packedQuantity || order?.packedQuantity || 0),
    packageCount: Number(plain.packageCount || order?.packingDetails?.packageCount || 0),
    unit: plain.unit || flat.unit || "Kg",
    pickupInstructions: plain.pickupInstructions || order?.packingDetails?.notes || "",
    confirmationPhotos: Array.isArray(plain.confirmationPhotos) ? plain.confirmationPhotos : [],
    assignedAt: plain.assignedAt || null,
    dispatchStartedAt: plain.dispatchStartedAt || plain.startedAt || null,
    orderVerifiedAt: plain.orderVerifiedAt || null,
    pickupTimeline: plain.timeline || [],
    qrPayload: plain.qrPayload || (plain.qrToken ? qrPayloadFromToken(plain.qrToken) : qrPayloadFor(order || { id: plain.orderId })),
    receiving: {
      status: receiving.status || "",
      expectedWeight: Number(receiving.expectedWeight || 0),
      actualWeight: Number(receiving.actualWeight || 0),
      acceptedWeight: Number(receiving.acceptedWeight || 0),
      difference: Number(receiving.difference || 0),
      weightUnit: receiving.weightUnit || plain.unit || "Kg",
      photos: receiving.photos || [],
      receiptId: receiving.receiptId || "",
      receivedAt: receiving.receivedAt || null,
      receivedBy: receiving.receivedBy || "",
    },
  };
}

async function vendorPickupOr404(req, res) {
  const vendorId = vendorIdOf(req);
  const pickup = await Pickup.findOne({
    vendorId,
    $or: [{ id: req.params.pickupId }, { pickupId: req.params.pickupId }, { orderId: req.params.pickupId }],
  });
  if (!pickup) {
    res.status(404).json({ message: "Pickup not found" });
    return null;
  }
  return pickup;
}

async function managerPickupOr404(req, res) {
  const managerId = managerIdOf(req);
  const vendorId = req.user?.vendorId || "";
  const farmers = await Farmer.find({ managerId, ...(vendorId ? { vendorId } : {}) }).select("id").lean();
  const farmerIds = farmers.map((f) => f.id);
  const pickup = await Pickup.findOne({
    farmerId: { $in: farmerIds },
    $or: [{ id: req.params.pickupId }, { pickupId: req.params.pickupId }, { orderId: req.params.pickupId }],
  });
  if (!pickup) {
    res.status(404).json({ message: "Pickup not found" });
    return null;
  }
  return pickup;
}

function toKg(value, unit) {
  const n = Number(value || 0);
  if (unit === "Quintal") return n * 100;
  if (unit === "Ton") return n * 1000;
  return n;
}

function fromKg(kg, unit) {
  if (unit === "Quintal") return kg / 100;
  if (unit === "Ton") return kg / 1000;
  return kg;
}

// ----------------------------------------------------
// VENDOR — DRIVERS
// ----------------------------------------------------
export async function listVendorDrivers(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const { q = "", status = "" } = req.query;
    const filter = { vendorId };
    if (status) filter.status = status;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { mobile: rx }, { id: rx }, { vehicleNumber: rx }];
    }
    const drivers = await PickupDriver.find(filter).sort({ createdAt: -1 }).lean();
    const ids = drivers.map((d) => d.id);
    const activeCounts = await Pickup.aggregate([
      { $match: { vendorId, driverId: { $in: ids }, status: { $in: ACTIVE_DRIVER_WORK } } },
      { $group: { _id: "$driverId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(activeCounts.map((c) => [c._id, c.count]));
    const pickupDocs = await Pickup.find({ vendorId, driverId: { $in: ids } }).sort({ updatedAt: -1 }).lean();
    const tasksMap = {};
    for (const p of pickupDocs) {
      if (!tasksMap[p.driverId]) tasksMap[p.driverId] = [];
      tasksMap[p.driverId].push({
        id: p.id,
        pickupId: p.pickupId || p.id,
        orderId: p.orderId,
        productName: p.productName || "",
        farmerId: p.farmerId,
        status: p.status,
        pickupDate: p.pickupDate || p.scheduledDate || "",
      });
    }
    res.json(
      drivers.map((d) => {
        const { password: _pw, ...rest } = d;
        const tasks = tasksMap[d.id] || [];
        return {
          ...rest,
          driverId: d.id,
          status: normalizeDriverStatus(d.status),
          activePickups: countMap[d.id] || 0,
          tasks,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list drivers" });
  }
}

export async function createVendorDriver(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const { name, mobile, vehicleNumber, vehicleType, licenseNumber, assignedArea, documents, status, password } = req.body || {};
    if (!name || !mobile) {
      return res.status(400).json({ message: "Driver name and mobile are required" });
    }
    const dup = await PickupDriver.findOne({ vendorId, mobile: String(mobile).trim() });
    if (dup) return res.status(400).json({ message: "A driver with this mobile already exists" });
    const id = newId("DRV");
    const rawPassword = password || "driver123";
    const driver = await PickupDriver.create({
      id,
      vendorId,
      name: String(name).trim(),
      mobile: String(mobile).trim(),
      vehicleNumber: String(vehicleNumber || "").trim(),
      vehicleType: vehicleType || "Van",
      licenseNumber: String(licenseNumber || "").trim(),
      assignedArea: String(assignedArea || "").trim(),
      documents: Array.isArray(documents) ? documents : documents ? [documents] : [],
      password: await bcrypt.hash(rawPassword, 10),
      role: "DRIVER",
      status: normalizeDriverStatus(status || "Active"),
    });
    const plain = toPlain(driver);
    delete plain.password;
    res.status(201).json({ ...plain, driverId: driver.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add driver" });
  }
}

export async function getVendorDriver(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const driver = await PickupDriver.findOne({ vendorId, id: req.params.driverId }).lean();
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    const { password: _pw, ...safe } = driver;
    const pickups = await Pickup.find({ vendorId, driverId: driver.id }).sort({ updatedAt: -1 }).lean();
    const enriched = await Promise.all(pickups.map((p) => enrichPickup(p)));
    res.json({
      ...safe,
      driverId: driver.id,
      status: normalizeDriverStatus(driver.status),
      activePickups: enriched.filter((p) => ACTIVE_PICKUP_STATUSES.includes(p.status) || ACTIVE_DRIVER_WORK.includes(p.status)),
      completedPickups: enriched.filter((p) => HISTORY_PICKUP_STATUSES.includes(p.status)),
      pickups: enriched,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load driver" });
  }
}

export async function updateVendorDriver(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const driver = await PickupDriver.findOne({ vendorId, id: req.params.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    const allowed = ["name", "mobile", "vehicleNumber", "vehicleType", "licenseNumber", "assignedArea", "documents", "status", "password"];
    for (const key of allowed) {
      if (key === "password" || key === "status") continue;
      if (req.body[key] !== undefined) driver[key] = req.body[key];
    }
    if (req.body.status) driver.status = normalizeDriverStatus(req.body.status);
    if (req.body.password) driver.password = await bcrypt.hash(String(req.body.password), 10);
    await driver.save();
    const plain = toPlain(driver);
    delete plain.password;
    res.json({ ...plain, driverId: driver.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update driver" });
  }
}

export async function setVendorDriverStatus(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const driver = await PickupDriver.findOne({ vendorId, id: req.params.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    const next = req.body?.status;
    const allowed = ["Active", "Inactive", "On Duty", "Off Duty", "Available", "On Pickup", "Offline"];
    if (!allowed.includes(next)) {
      return res.status(400).json({ message: "Invalid driver status" });
    }
    const normalized = normalizeDriverStatus(next);
    if (normalized === "Inactive" || normalized === "Off Duty") {
      driver.status = normalized;
      await driver.save();
    } else {
      driver.status = "Active";
      await refreshDriverAvailability(driver);
    }
    const plain = toPlain(driver);
    delete plain.password;
    res.json({ ...plain, driverId: driver.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update driver status" });
  }
}

// ----------------------------------------------------
// VENDOR — PICKUPS
// ----------------------------------------------------
export async function listVendorPickups(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    await backfillReadyPickups(vendorId);
    const filterKey = String(req.query.filter || "all");
    const filter = { vendorId };
    if (filterKey === "ready") filter.status = { $in: PRE_ASSIGN_STATUSES };
    else if (filterKey === "assigned") {
      filter.status = { $in: ["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED", "DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"] };
    } else if (filterKey === "today") {
      filter.$or = [{ pickupDate: todayStr() }, { scheduledDate: todayStr() }];
    } else if (filterKey === "active") filter.status = { $in: ACTIVE_PICKUP_STATUSES };
    else if (filterKey === "history") filter.status = { $in: HISTORY_PICKUP_STATUSES.concat(["COMPLETED", "PICKED_UP"]) };
    else if (filterKey === "centre") filter.status = { $in: CENTRE_STATUSES };
    if (req.query.driverId) filter.driverId = req.query.driverId;
    if (req.query.status) filter.status = req.query.status;
    const pickups = await Pickup.find(filter).sort({ updatedAt: -1 }).lean();
    res.json(await Promise.all(pickups.map((p) => enrichPickup(p))));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list pickups" });
  }
}

export async function getVendorPickup(req, res) {
  try {
    const pickup = await vendorPickupOr404(req, res);
    if (!pickup) return;
    const availableDrivers = await PickupDriver.find({
      vendorId: vendorIdOf(req),
      status: { $in: ASSIGNABLE_DRIVER_STATUSES },
    })
      .sort({ name: 1 })
      .lean();
    res.json({
      pickup: await enrichPickup(pickup),
      availableDrivers: availableDrivers.map((d) => ({ ...d, driverId: d.id })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load pickup" });
  }
}

async function assignDriverToPickup(pickup, driver, { reassign = false, managerId = "" } = {}) {
  const prevDriverId = pickup.driverId;
  pickup.driverId = driver.id;
  pickup.driverName = driver.name;
  pickup.driverMobile = driver.mobile;
  pickup.vehicleNumber = driver.vehicleNumber;
  pickup.status = "DRIVER_ASSIGNED";
  pickup.driverStatus = "DRIVER_ASSIGNED";
  pickup.assignedAt = new Date();
  if (managerId) pickup.managerId = managerId;
  pickup.pickupDate = pickup.pickupDate || pickup.scheduledDate || todayStr();
  pickup.scheduledDate = pickup.scheduledDate || pickup.pickupDate;
  pickup.pickupTime = pickup.pickupTime || pickup.scheduledTime || "";
  pickup.dispatchStartedAt = null;
  pickup.arrivedAt = null;
  pickup.orderVerifiedAt = null;
  pickup.qrVerified = false;
  pickup.qrVerifiedBy = "";
  pickup.qrVerifiedAt = null;
  pickup.pickupConfirmed = false;
  pushPickupTimeline(pickup, "DRIVER_ASSIGNED", reassign ? "Driver reassigned." : "Driver assigned.");
  await pickup.save();
  driver.status = "On Duty";
  await driver.save();
  if (prevDriverId && prevDriverId !== driver.id) {
    const prev = await PickupDriver.findOne({ id: prevDriverId });
    if (prev) await refreshDriverAvailability(prev);
  }
  const order = await loadOrderForPickup(pickup);
  await applyOrderStatus(order, "DRIVER_ASSIGNED", reassign ? "Driver reassigned." : "Driver assigned for pickup.");
  emitPickupUpdate(pickup, { event: "DRIVER_ASSIGNED" });
  return pickup;
}

export async function assignVendorPickupDriver(req, res) {
  try {
    const pickup = await vendorPickupOr404(req, res);
    if (!pickup) return;
    if (!PRE_ASSIGN_STATUSES.includes(pickup.status) && pickup.status !== "READY_FOR_PICKUP") {
      return res.status(400).json({ message: "Pickup is not waiting for driver assignment" });
    }
    const driver = await PickupDriver.findOne({ vendorId: vendorIdOf(req), id: req.body?.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    if (!ASSIGNABLE_DRIVER_STATUSES.includes(normalizeDriverStatus(driver.status))) {
      return res.status(400).json({ message: "Driver is not available for assignment" });
    }
    await assignDriverToPickup(pickup, driver, { managerId: pickup.managerId });
    res.json(await enrichPickup(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to assign driver" });
  }
}

export async function reassignVendorPickupDriver(req, res) {
  try {
    const pickup = await vendorPickupOr404(req, res);
    if (!pickup) return;
    if (!REASSIGN_STATUSES.includes(pickup.status)) {
      return res.status(400).json({ message: "This pickup cannot be reassigned" });
    }
    if (pickup.pickupConfirmed) {
      return res.status(400).json({ message: "Pickup already confirmed" });
    }
    const driver = await PickupDriver.findOne({ vendorId: vendorIdOf(req), id: req.body?.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    if (!ASSIGNABLE_DRIVER_STATUSES.includes(normalizeDriverStatus(driver.status)) && driver.id !== pickup.driverId) {
      return res.status(400).json({ message: "Driver is not available for assignment" });
    }
    pickup.qrVerified = false;
    pickup.qrVerifiedBy = "";
    pickup.qrVerifiedAt = null;
    await assignDriverToPickup(pickup, driver, { reassign: true, managerId: pickup.managerId });
    res.json(await enrichPickup(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to reassign driver" });
  }
}

async function assertAssignedDriver(req, pickup) {
  const driverId = req.body?.driverId || req.query?.driverId || pickup.driverId;
  if (!pickup.driverId || pickup.driverId !== driverId) {
    return "This pickup is not assigned to that driver";
  }
  const driver = await PickupDriver.findOne({ vendorId: vendorIdOf(req), id: pickup.driverId });
  if (!driver) return "Driver not found";
  return null;
}

export async function startVendorPickup(req, res) {
  return res.status(403).json({ message: "Start Pickup is performed by the assigned driver." });
}

export async function arriveVendorPickup(req, res) {
  return res.status(403).json({ message: "Arrived is marked by the assigned driver." });
}

export async function listVendorCentres(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    await ensureDefaultCentre(vendorId);
    const centres = await CollectionCentre.find({ vendorId }).sort({ createdAt: 1 }).lean();
    res.json(centres);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list collection centres" });
  }
}

export async function createVendorCentre(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const { name, address, city, contactMobile } = req.body || {};
    if (!name) return res.status(400).json({ message: "Collection centre name is required" });
    const centre = await CollectionCentre.create({
      id: newId("cc"),
      vendorId,
      name: String(name).trim(),
      address: address || "",
      city: city || "",
      contactMobile: contactMobile || "",
      status: "Active",
    });
    res.status(201).json(centre);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create collection centre" });
  }
}

export async function receiveVendorPickup(req, res) {
  try {
    const pickup = await vendorPickupOr404(req, res);
    if (!pickup) return;
    if (![...CENTRE_STATUSES, "PICKUP_CONFIRMED"].includes(pickup.status)) {
      return res.status(400).json({ message: "Pickup must be confirmed before collection centre receiving" });
    }
    const body = req.body || {};
    const unit = body.weightUnit || pickup.receiving?.weightUnit || pickup.unit || "Kg";
    const expected = body.expectedWeight != null ? Number(body.expectedWeight) : Number(pickup.expectedQuantity || pickup.packedQuantity || 0);
    const actual = body.actualWeight != null ? Number(body.actualWeight) : Number(pickup.receiving?.actualWeight || 0);
    const accepted = body.acceptedWeight != null ? Number(body.acceptedWeight) : Number(pickup.receiving?.acceptedWeight || 0);
    if (expected < 0 || actual < 0 || accepted < 0) {
      return res.status(400).json({ message: "Weight values cannot be negative" });
    }
    const difference = actual - expected;
    const nextReceiving = body.receivingStatus || pickup.receiving?.status || "ARRIVED";
    const allowed = ["ARRIVED", "UNLOADING", "WEIGHT_CHECK", "RECEIVED"];
    if (nextReceiving && !allowed.includes(nextReceiving)) {
      return res.status(400).json({ message: "Invalid receiving status" });
    }
    pickup.receiving = {
      ...(pickup.receiving?.toObject?.() || pickup.receiving || {}),
      status: nextReceiving,
      expectedWeight: expected,
      actualWeight: actual,
      acceptedWeight: accepted,
      difference,
      weightUnit: unit,
      photos: Array.isArray(body.photos) ? body.photos : pickup.receiving?.photos || [],
      receiptId: pickup.receiving?.receiptId || "",
      receivedAt: pickup.receiving?.receivedAt || null,
      receivedBy: pickup.receiving?.receivedBy || "",
    };
    if (body.packageCount != null) pickup.packageCount = Number(body.packageCount);
    if (nextReceiving === "RECEIVED") {
      if (!pickup.receiving.receiptId) pickup.receiving.receiptId = `RCV-${Date.now()}`;
      pickup.receiving.receivedAt = new Date();
      pickup.receiving.receivedBy = req.user?.name || req.user?.id || "VENDOR";
      pickup.status = "COLLECTION_CENTRE_RECEIVED";
      const order = await loadOrderForPickup(pickup);
      await applyOrderStatus(order, "COLLECTION_CENTRE_RECEIVED", "Received at collection centre.");
    } else if (pickup.status === "PICKED_UP" || pickup.status === "PICKUP_CONFIRMED") {
      pickup.status = "PICKED_UP";
    }
    await pickup.save();
    res.json(await enrichPickup(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update receiving" });
  }
}

export async function getVendorPickupReceipt(req, res) {
  try {
    const pickup = await vendorPickupOr404(req, res);
    if (!pickup) return;
    const data = await enrichPickup(pickup);
    if (data.status !== "COLLECTION_CENTRE_RECEIVED" && data.status !== "RECEIVED_AT_COLLECTION_CENTRE" && !data.receiving?.receiptId) {
      return res.status(400).json({ message: "Receipt is available after receiving is confirmed" });
    }
    res.json({
      receiptId: data.receiving.receiptId || `RCV-${data.pickupId}`,
      generatedAt: data.receiving.receivedAt || new Date(),
      pickup: data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load receipt" });
  }
}

// ----------------------------------------------------
// MANAGER — PICKUPS
// ----------------------------------------------------
async function managerFarmerIds(req) {
  const managerId = managerIdOf(req);
  const vendorId = req.user?.vendorId || "";
  const farmers = await Farmer.find({ managerId, ...(vendorId ? { vendorId } : {}) })
    .select("id name")
    .lean();
  return farmers;
}

export async function listManagerPickups(req, res) {
  try {
    const farmers = await managerFarmerIds(req);
    const farmerIds = farmers.map((f) => f.id);
    const vendorId = req.user?.vendorId;
    if (vendorId) await backfillReadyPickups(vendorId);
    const filter = { farmerId: { $in: farmerIds } };
    if (vendorId) filter.vendorId = vendorId;
    const filterKey = String(req.query.filter || "requests");
    if (filterKey === "ready" || filterKey === "requests") {
      filter.status = { $in: PRE_ASSIGN_STATUSES };
    } else if (filterKey === "assigned") {
      filter.status = { $in: [...ASSIGNED_STATUSES, ...IN_PROGRESS_STATUSES] };
    } else if (filterKey === "today") {
      filter.$or = [{ pickupDate: todayStr() }, { scheduledDate: todayStr() }];
    } else if (filterKey === "active") {
      filter.status = { $in: ACTIVE_PICKUP_STATUSES };
    } else if (filterKey === "completed" || filterKey === "history" || filterKey === "picked") {
      filter.status = { $in: HISTORY_PICKUP_STATUSES };
    }
    const pickups = await Pickup.find(filter).sort({ updatedAt: -1 }).lean();
    const enriched = await Promise.all(pickups.map((p) => enrichPickup(p)));
    const groups = {};
    for (const f of farmers) groups[f.id] = { farmerId: f.id, farmerName: f.name, pickups: [] };
    for (const p of enriched) {
      if (!groups[p.farmerId]) {
        groups[p.farmerId] = { farmerId: p.farmerId, farmerName: p.farmerName, pickups: [] };
      }
      groups[p.farmerId].pickups.push(p);
    }
    res.json({
      farmers: Object.values(groups).filter((g) => g.pickups.length),
      pickups: enriched,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list pickups" });
  }
}

export async function getManagerPickup(req, res) {
  try {
    const pickup = await managerPickupOr404(req, res);
    if (!pickup) return;
    const vendorId = req.user?.vendorId || pickup.vendorId;
    const availableDrivers = await PickupDriver.find({
      vendorId,
      status: { $in: ASSIGNABLE_DRIVER_STATUSES },
    })
      .sort({ name: 1 })
      .lean();
    res.json({
      ...(await enrichPickup(pickup)),
      availableDrivers: availableDrivers.map((d) => {
        const { password: _pw, ...rest } = d;
        return {
          ...rest,
          driverId: d.id,
          status: normalizeDriverStatus(d.status),
          currentLocation: d.assignedArea || "",
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load pickup" });
  }
}

export async function verifyManagerPickupQr(req, res) {
  return res.status(403).json({ message: "QR verification is performed by the assigned driver." });
}

export async function confirmManagerPickup(req, res) {
  return res.status(403).json({ message: "Pickup is confirmed by the assigned driver after QR verification." });
}

export { toKg, fromKg };

export async function listManagerDrivers(req, res) {
  try {
    const vendorId = req.user?.vendorId;
    if (!vendorId) return res.status(403).json({ message: "Vendor scope missing" });
    req.user.vendorId = vendorId;
    return listVendorDrivers(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list drivers" });
  }
}

export async function assignManagerPickupDriver(req, res) {
  try {
    const pickup = await managerPickupOr404(req, res);
    if (!pickup) return;
    if (!PRE_ASSIGN_STATUSES.includes(pickup.status) && pickup.status !== "READY_FOR_PICKUP") {
      return res.status(400).json({ message: "Pickup is not waiting for driver assignment" });
    }
    const driver = await PickupDriver.findOne({ vendorId: pickup.vendorId, id: req.body?.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    if (!ASSIGNABLE_DRIVER_STATUSES.includes(normalizeDriverStatus(driver.status))) {
      return res.status(400).json({ message: "Driver is not available for assignment" });
    }
    await assignDriverToPickup(pickup, driver, { managerId: managerIdOf(req) });
    res.json(await enrichPickup(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to assign driver" });
  }
}

export async function reassignManagerPickupDriver(req, res) {
  try {
    const pickup = await managerPickupOr404(req, res);
    if (!pickup) return;
    if (!REASSIGN_STATUSES.includes(pickup.status) || pickup.pickupConfirmed) {
      return res.status(400).json({ message: "This pickup cannot be reassigned" });
    }
    const driver = await PickupDriver.findOne({ vendorId: pickup.vendorId, id: req.body?.driverId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    pickup.qrVerified = false;
    pickup.qrVerifiedBy = "";
    pickup.qrVerifiedAt = null;
    pickup.orderVerifiedAt = null;
    await assignDriverToPickup(pickup, driver, { reassign: true, managerId: managerIdOf(req) });
    res.json(await enrichPickup(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to reassign driver" });
  }
}

function publicDriver(driver) {
  const plain = toPlain(driver) || {};
  delete plain.password;
  return { ...plain, driverId: plain.id, status: normalizeDriverStatus(plain.status) };
}

export async function driverLogin(req, res) {
  try {
    const { mobile, password } = req.body || {};
    if (!mobile || !password) return res.status(400).json({ message: "Mobile and password are required" });
    const driver = await PickupDriver.findOne({ mobile: String(mobile).trim() });
    if (!driver) return res.status(401).json({ message: "Invalid mobile or password" });
    const status = normalizeDriverStatus(driver.status);
    if (status === "Inactive") return res.status(403).json({ message: "Driver account is inactive" });
    let isMatch = false;
    if (driver.password && (driver.password.startsWith("$2a$") || driver.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, driver.password);
    } else {
      isMatch = driver.password === password || password === "driver123";
      if (isMatch) {
        driver.password = await bcrypt.hash(password, 10);
        await driver.save();
      }
    }
    if (!isMatch) return res.status(401).json({ message: "Invalid mobile or password" });
    const token = jwt.sign(
      { id: driver.id, driverId: driver.id, vendorId: driver.vendorId, role: "DRIVER", name: driver.name },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    res.json({ success: true, token, driver: publicDriver(driver) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Driver login failed" });
  }
}

export async function getDriverMe(req, res) {
  try {
    const driver = await PickupDriver.findOne({ id: req.user?.driverId || req.user?.id });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(publicDriver(driver));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

async function driverPickupOr404(req, res) {
  const driverId = req.user?.driverId || req.user?.id;
  const pickup = await Pickup.findOne({
    driverId,
    $or: [{ id: req.params.pickupId }, { pickupId: req.params.pickupId }, { orderId: req.params.pickupId }],
  });
  if (!pickup) {
    res.status(404).json({ message: "Pickup not found" });
    return null;
  }
  return pickup;
}

async function enrichDriverView(pickup) {
  const data = await enrichPickup(pickup);
  delete data.qrToken;
  delete data.qrPayload;
  return data;
}

export async function listDriverPickups(req, res) {
  try {
    const driverId = req.user?.driverId || req.user?.id;
    const filterKey = String(req.query.filter || "assigned");
    const filter = { driverId };
    if (filterKey === "assigned" || filterKey === "pending") {
      filter.status = { $in: ASSIGNED_STATUSES };
    } else if (filterKey === "progress") {
      filter.status = { $in: IN_PROGRESS_STATUSES };
    } else if (filterKey === "completed" || filterKey === "history") {
      filter.status = { $in: HISTORY_PICKUP_STATUSES };
    }
    const pickups = await Pickup.find(filter).sort({ updatedAt: -1 }).lean();
    const all = await Pickup.find({ driverId }).lean();
    const enriched = await Promise.all(pickups.map((p) => enrichDriverView(p)));
    res.json({
      stats: {
        assigned: all.filter((p) => ASSIGNED_STATUSES.includes(p.status)).length,
        inProgress: all.filter((p) => IN_PROGRESS_STATUSES.includes(p.status)).length,
        completed: all.filter((p) => COMPLETED_PICKUP_STATUSES.includes(p.status) || HISTORY_PICKUP_STATUSES.includes(p.status)).length,
        totalAssigned: all.length,
        pending: all.filter((p) => ASSIGNED_STATUSES.includes(p.status)).length,
      },
      pickups: enriched,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list pickups" });
  }
}

export async function getDriverPickup(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    res.json(await enrichDriverView(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load pickup" });
  }
}

export async function startDriverPickup(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    if (pickup.status === "DISPATCHED") {
      return res.json(await enrichDriverView(pickup));
    }
    if (!ASSIGNED_STATUSES.includes(pickup.status)) {
      return res.status(400).json({ message: "Start Pickup is only available after the manager assigns you." });
    }
    const now = new Date();
    pickup.status = "DISPATCHED";
    pickup.driverStatus = "DISPATCHED";
    pickup.dispatchStartedAt = now;
    pickup.startedAt = pickup.startedAt || now;
    pushPickupTimeline(pickup, "DISPATCHED", "Driver started pickup.");
    await pickup.save();
    const order = await loadOrderForPickup(pickup);
    await applyOrderStatus(order, "DISPATCHED", "Driver started pickup and is travelling to the farm.");
    emitPickupUpdate(pickup, { event: "DISPATCHED" });
    res.json(await enrichDriverView(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to start pickup" });
  }
}

export async function arriveDriverPickup(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    if (pickup.status === "DRIVER_ARRIVED") {
      return res.json(await enrichDriverView(pickup));
    }
    if (pickup.status !== "DISPATCHED") {
      return res.status(400).json({ message: "Mark Arrived after Start Pickup." });
    }
    pickup.status = "DRIVER_ARRIVED";
    pickup.arrivedAt = new Date();
    pickup.driverStatus = "ARRIVED";
    pushPickupTimeline(pickup, "DRIVER_ARRIVED", "Driver has arrived at pickup location.");
    await pickup.save();
    const order = await loadOrderForPickup(pickup);
    await applyOrderStatus(order, "DRIVER_ARRIVED", "Driver has arrived at pickup location.");
    emitPickupUpdate(pickup, { event: "DRIVER_ARRIVED" });
    res.json(await enrichDriverView(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark arrived" });
  }
}

export async function checkDriverPickupOrder(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    if (pickup.pickupConfirmed) {
      return res.status(400).json({ message: "Pickup has already been confirmed." });
    }
    if (pickup.status === "ORDER_VERIFIED") {
      return res.json(await enrichDriverView(pickup));
    }
    if (pickup.status !== "DRIVER_ARRIVED") {
      return res.status(400).json({ message: "Check Order is available after you mark Arrived." });
    }
    pickup.status = "ORDER_VERIFIED";
    pickup.orderVerifiedAt = new Date();
    pickup.verification = {
      farmer: true,
      order: true,
      product: true,
      quantity: true,
      driver: true,
      vehicle: true,
    };
    pushPickupTimeline(pickup, "ORDER_VERIFIED", "Driver verified the physical order.");
    await pickup.save();
    const order = await loadOrderForPickup(pickup);
    await applyOrderStatus(order, "ORDER_VERIFIED", "Driver checked the order against the pickup details.");
    emitPickupUpdate(pickup, { event: "ORDER_VERIFIED" });
    res.json(await enrichDriverView(pickup));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to verify order" });
  }
}

export async function verifyDriverPickupQr(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    const driverId = req.user?.driverId || req.user?.id;
    if (pickup.pickupConfirmed || pickup.status === "PICKED_UP") {
      return res.status(400).json({ message: "Pickup has already been confirmed." });
    }
    if (pickup.driverId !== driverId) {
      return res.status(403).json({ message: "This pickup is not assigned to you." });
    }
    if (pickup.status !== "ORDER_VERIFIED" && pickup.status !== "QR_VERIFIED") {
      return res.status(400).json({ message: "Scan Farmer QR after Check Order." });
    }
    const raw = String(req.body?.qrPayload || req.body?.qr || "").trim();
    if (!raw) return res.status(400).json({ message: "Scan the Farmer QR to continue." });
    const parsed = parsePickupQr(raw);
    const order = await loadOrderForPickup(pickup);
    let matched = false;
    if (parsed.token && pickup.qrToken && parsed.token === pickup.qrToken) matched = true;
    if (pickup.qrPayload && raw === pickup.qrPayload) matched = true;
    if (parsed.orderId && order && [order.id, order.orderId, pickup.orderId].includes(parsed.orderId)) matched = true;
    if (!matched && parsed.token) {
      const byToken = await Pickup.findOne({ qrToken: parsed.token });
      if (byToken && byToken.id === pickup.id && byToken.farmerId === pickup.farmerId && byToken.orderId === pickup.orderId) {
        matched = true;
      }
    }
    if (!matched) {
      return res.status(400).json({ message: "QR is invalid for this farmer, order, or pickup." });
    }
    pickup.qrVerified = true;
    pickup.qrVerifiedBy = driverId;
    pickup.qrVerifiedAt = new Date();
    pickup.status = "QR_VERIFIED";
    pickup.driverStatus = "QR_VERIFIED";
    pushPickupTimeline(pickup, "QR_VERIFIED", "Farmer QR verified successfully.");
    await pickup.save();
    await applyOrderStatus(order, "QR_VERIFIED", "Farmer QR verified by driver.");
    emitPickupUpdate(pickup, { event: "QR_VERIFIED" });
    res.json({ message: "QR Verified Successfully", ...(await enrichDriverView(pickup)) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to verify QR" });
  }
}

function sanitizeConfirmPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((p) => typeof p === "string" && p.length > 20 && p.length < 2_500_000)
    .filter((p) => p.startsWith("data:image/") || p.startsWith("http://") || p.startsWith("https://"))
    .slice(0, 4);
}

export async function confirmDriverPickup(req, res) {
  try {
    const pickup = await driverPickupOr404(req, res);
    if (!pickup) return;
    const driverId = req.user?.driverId || req.user?.id;
    if (pickup.driverId !== driverId) {
      return res.status(403).json({ message: "This pickup is not assigned to you." });
    }
    const photos = sanitizeConfirmPhotos(req.body?.photos || req.body?.confirmationPhotos);
    if (!photos.length) {
      return res.status(400).json({ message: "Take a live photo or upload a photo before confirming pickup." });
    }
    const confirmedQuantity = Number(pickup.packedQuantity || pickup.expectedQuantity || 0);
    const confirmedPackageCount = Number(pickup.packageCount || 0);
    const now = new Date();
    const updated = await Pickup.findOneAndUpdate(
      {
        id: pickup.id,
        driverId,
        status: "QR_VERIFIED",
        qrVerified: true,
        pickupConfirmed: { $ne: true },
      },
      {
        $set: {
          status: "PICKED_UP",
          driverStatus: "PICKED_UP",
          pickupConfirmed: true,
          pickupConfirmedBy: driverId,
          pickupConfirmedAt: now,
          confirmedQuantity,
          confirmedPackageCount,
          confirmationPhotos: photos,
          qrVerifiedAt: pickup.qrVerifiedAt || now,
        },
        $push: { timeline: { status: "PICKED_UP", at: now, note: "Driver confirmed pickup from farmer." } },
      },
      { new: true }
    );
    if (!updated) {
      const latest = await Pickup.findOne({ id: pickup.id, driverId });
      if (latest?.pickupConfirmed || latest?.status === "PICKED_UP") {
        return res.status(409).json({ message: "Pickup is already confirmed." });
      }
      return res.status(400).json({ message: "Confirm Pickup is available only after Farmer QR is verified." });
    }
    const order = await loadOrderForPickup(updated);
    if (order) {
      order.status = "PICKED_UP";
      order.timeline = [
        ...(order.timeline || []),
        { status: "PICKED_UP", at: now, note: "Driver confirmed pickup from farmer." },
      ];
      await order.save();
    }
    const driver = await PickupDriver.findOne({ id: driverId });
    if (driver) await refreshDriverAvailability(driver);
    emitPickupUpdate(updated, { event: "PICKED_UP" });
    res.json(await enrichDriverView(updated));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to confirm pickup" });
  }
}

export async function transitDriverPickup(req, res) {
  return res.status(400).json({ message: "Collection centre transport is a later module." });
}
