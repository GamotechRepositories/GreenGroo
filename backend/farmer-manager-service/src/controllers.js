import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  Vendor,
  Farmer,
  FarmerManager,
  FarmerProduct,
  FarmerStockHistory,
  FarmerOrder,
  FarmerEarning,
  FarmerDocument,
  FarmerHarvestOrder,
  ensureFarmerIndexes,
  FarmerCrop,
  FarmerCropPlan,
  Pickup,
  CollectionCentre,
} from "./models.js";
import { ensurePickupForOrder, ensureCentreBusinessId, ensureDefaultCentre } from "./pickupControllers.js";
import { getIO } from "../../shared/socket.js";
import { generateId } from "../../erp-service/src/services/idGenerator.js";
import { categoryFromName, cropCodeFromName, varietyCodeFromName, farmerSerialFromId } from "../../erp-service/src/config/idRegistry.js";
import {
  assignFarmerBusinessId,
  ensureFarmForFarmer,
  syncFarmerCropToErp,
  syncFarmerProductToErp,
  ensureEntityQr,
  ensureSharedCropBusinessId,
  upgradeFarmerProductId,
  productIdFromCropId,
} from "../../erp-service/src/services/farmerSync.js";

const JWT_SECRET = process.env.JWT_SECRET || "greengroo-secret";
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

const DEFAULT_VENDOR_ID = "vendor-1";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

async function generateUniqueFarmerId() {
  for (let i = 0; i < 6; i++) {
    const id = `farmer-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const exists = await Farmer.exists({ id });
    if (!exists) return id;
  }
  return `farmer-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function defaultKycDocumentShells({ farmerId, vendorId, managerId }) {
  const types = [
    { type: "aadhaar", name: "Aadhaar / ID Proof" },
    { type: "pan", name: "PAN" },
    { type: "address", name: "Address Proof" },
    { type: "bank", name: "Bank Details" },
    { type: "other", name: "Other Documents" },
  ];
  return types.map((d) => ({
    id: `doc-${farmerId}-${d.type}`,
    vendorId,
    managerId: managerId || "",
    farmerId,
    name: d.name,
    type: d.type,
    fileName: "",
    uploadedAt: null,
    status: "Not Uploaded",
  }));
}

function isAdult(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return dob <= cutoff;
}

async function resolveReferralCode(code) {
  const referralCode = String(code || "").trim();
  if (!referralCode) return { referralCode: "", managerId: "", vendorId: "" };
  const manager = await FarmerManager.findOne({
    $or: [{ id: referralCode }, { mobile: referralCode }],
  })
    .select("id vendorId")
    .lean();
  return {
    referralCode,
    managerId: manager?.id || "",
    vendorId: manager?.vendorId || "",
  };
}

// ----------------------------------------------------
// REMOVE KNOWN DEMO RECORDS (no dummy seed)
// ----------------------------------------------------
export async function seedInitialData() {
  try {
    const dummyFarmerIds = ["farmer-1", "farmer-2", "farmer-3"];
    const dummyManagerIds = ["mgr-1", "mgr-2"];
    const dummyProductIds = ["fp-1", "fp-2", "fp-3"];
    const dummyOrderIds = ["fo-101", "fo-102"];
    const dummyEarningIds = ["earn-1", "earn-2"];
    const dummyStockIds = ["sh-1", "sh-2"];
    const dummyDocIds = [
      "doc-farmer-1-aadhaar",
      "doc-farmer-1-pan",
      "doc-farmer-1-bank",
      "doc-farmer-1-address",
    ];

    await Promise.all([
      Farmer.deleteMany({ id: { $in: dummyFarmerIds } }),
      FarmerManager.deleteMany({ id: { $in: dummyManagerIds } }),
      FarmerProduct.deleteMany({ id: { $in: dummyProductIds } }),
      FarmerOrder.deleteMany({ id: { $in: dummyOrderIds } }),
      FarmerEarning.deleteMany({ id: { $in: dummyEarningIds } }),
      FarmerStockHistory.deleteMany({ id: { $in: dummyStockIds } }),
      FarmerDocument.deleteMany({ id: { $in: dummyDocIds } }),
    ]);

    await Promise.all([
      FarmerProduct.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
      FarmerOrder.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
      FarmerEarning.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
      FarmerStockHistory.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
      FarmerDocument.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
      FarmerHarvestOrder.deleteMany({ farmerId: { $in: dummyFarmerIds } }),
    ]);

    ensureFarmerIndexes().catch(() => {});
  } catch (err) {
    console.error("Failed to clean dummy Farmer Manager data:", err);
  }
}

function toPlain(doc) {
  if (!doc) return doc;
  return doc.toObject ? doc.toObject() : { ...doc };
}

async function aggFarmerStats(farmerIds) {
  if (!farmerIds?.length) {
    return { productStats: new Map(), orderStats: new Map(), earningStats: new Map() };
  }

  const [products, orders, earnings] = await Promise.all([
    FarmerProduct.aggregate([
      { $match: { farmerId: { $in: farmerIds } } },
      { $group: { _id: "$farmerId", count: { $sum: 1 }, stock: { $sum: { $ifNull: ["$stock", 0] } } } },
    ]),
    FarmerOrder.aggregate([
      { $match: { farmerId: { $in: farmerIds } } },
      { $group: { _id: "$farmerId", count: { $sum: 1 } } },
    ]),
    FarmerEarning.aggregate([
      { $match: { farmerId: { $in: farmerIds } } },
      { $group: { _id: "$farmerId", total: { $sum: { $ifNull: ["$netEarnings", 0] } } } },
    ]),
  ]);

  return {
    productStats: new Map(products.map((r) => [r._id, { count: r.count, stock: r.stock }])),
    orderStats: new Map(orders.map((r) => [r._id, r.count])),
    earningStats: new Map(earnings.map((r) => [r._id, r.total])),
  };
}

function assignedFarmerQuery(req) {
  return { managerId: req.user.managerId, vendorId: req.user.vendorId };
}

function indexFarmersByIdentity(farmers) {
  const farmerMap = new Map();
  const ids = [];
  farmers.forEach((f) => {
    [f.id, f.farmerId].filter(Boolean).forEach((id) => {
      ids.push(id);
      farmerMap.set(id, f);
    });
  });
  return { ids: [...new Set(ids)], farmerMap };
}

function accessibleFarmerQuery(req, farmerId) {
  const query = { id: farmerId };
  if (req.user?.role === "FARMER_MANAGER") {
    query.managerId = req.user.managerId;
    query.vendorId = req.user.vendorId;
  } else if (req.user?.role === "VENDOR" && req.user.vendorId) {
    query.vendorId = req.user.vendorId;
  }
  return query;
}

async function getAssignedFarmers(req, select = "-password") {
  return Farmer.find(assignedFarmerQuery(req)).select(select).sort({ createdAt: -1 }).lean();
}

function enrichProductRow(p, farmerName = "") {
  const totalQty = p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0);
  const gradesSummary = p.grades?.map((g) => `${g.label} - ${g.quantity} ${p.unit || "Kg"}`).join(", ") || "";
  return {
    ...p,
    totalQuantity: totalQty,
    stock: totalQty,
    availableQuantity: totalQty,
    gradesSummary,
    farmerName: farmerName || p.farmerName || "",
  };
}

function lineProductId(p = {}) {
  const raw = String(p.productId || "").trim();
  if (raw && !/^[a-f0-9]{24}$/i.test(raw)) return raw;
  const id = String(p.id || "").trim();
  if (id && !/^[a-f0-9]{24}$/i.test(id)) return id;
  return raw || "";
}

function toISODate(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ORDER_STATUS_ALIASES = {
  NEW: "NEW",
  New: "NEW",
  ACCEPTED: "ACCEPTED",
  Accepted: "ACCEPTED",
  Confirmed: "NEW",
  Approved: "NEW",
  PREPARING: "PREPARING",
  Preparing: "PREPARING",
  Processing: "PREPARING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  "Ready for Pickup": "READY_FOR_PICKUP",
  PACKING: "PACKING",
  Packing: "PACKING",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  DISPATCHED: "DISPATCHED",
  Dispatched: "DISPATCHED",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  ARRIVED: "DRIVER_ARRIVED",
  ORDER_VERIFIED: "ORDER_VERIFIED",
  QR_VERIFIED: "QR_VERIFIED",
  PICKUP_CONFIRMED: "PICKED_UP",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  COLLECTION_CENTRE_RECEIVED: "COLLECTION_CENTRE_RECEIVED",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
  QUALITY_PENDING: "QUALITY_PENDING",
  INSPECTION: "INSPECTION",
  GRADING: "GRADING",
  GRADE_CONFIRMED: "GRADE_CONFIRMED",
  ORDER_COMPLETED: "ORDER_COMPLETED",
  COMPLETED: "COMPLETED",
  Completed: "COMPLETED",
  REJECTED: "REJECTED",
  Rejected: "REJECTED",
  CANCELLED: "CANCELLED",
  Cancelled: "CANCELLED",
};

const ORDER_FILTERS = {
  new: ["NEW"],
  preparing: ["ACCEPTED", "PREPARING", "PACKING"],
  ready: ["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED", "DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"],
  completed: ["PICKUP_CONFIRMED", "PICKED_UP", "COMPLETED", "IN_TRANSIT", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE", "QUALITY_PENDING", "INSPECTION", "GRADING", "GRADE_CONFIRMED", "ORDER_COMPLETED"],
  rejected: ["REJECTED", "CANCELLED"],
};

const REJECTION_REASONS = [
  "Stock Unavailable",
  "Product Unavailable",
  "Quality Issue",
  "Pickup Issue",
  "Quantity Issue",
  "Other",
];

function normalizeOrderStatus(status) {
  return ORDER_STATUS_ALIASES[status] || status || "NEW";
}

function withCanonicalOrderStatus(order) {
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    rejectionReason: order.rejectionReason || "",
    rejectionNote: order.rejectionNote || "",
    rejectedBy: order.rejectedBy || "",
    rejectedAt: order.rejectedAt || null,
  };
}

function mapFarmerOrdersToHarvest(farmerOrders) {
  return farmerOrders.map((o) => {
    const prods =
      o.products && o.products.length > 0
        ? o.products
        : [
            {
              name: o.productName || "Farm Fresh Produce",
              quantity: o.totalQuantity || 0,
              grade: o.grade || "Grade A",
              unit: o.unit || "Kg",
              productId: o.productId || "",
            },
          ];
    const first = prods[0] || {};
    const gradesList = Array.isArray(o.grades) && o.grades.length
      ? o.grades
      : prods.map((p) => ({
          name: p.grade || p.name || "Grade A",
          label: p.grade || p.name || "Grade A",
          quantity: Number(p.quantity || 0),
        }));
    const totalQuantity =
      Number(o.totalQuantity || 0) ||
      prods.reduce((sum, p) => sum + Number(p.quantity || 0), 0) ||
      gradesList.reduce((sum, g) => sum + Number(g.quantity || 0), 0);

    return {
      id: o.id || o.orderId || String(o._id),
      orderId: o.id || o.orderId,
      vendorId: o.vendorId,
      farmerId: o.farmerId,
      farmerName: o.farmerName || "",
      productId: o.productId || lineProductId(first),
      productName: o.productName || first.name || "Farm Fresh Produce",
      category: first.category || o.category || "Produce",
      date: toISODate(o.orderDate) || toISODate(o.harvestDate) || toISODate(o.date) || toISODate(o.createdAt),
      day: o.day || "",
      unit: o.unit || first.unit || "Kg",
      grades: gradesList,
      rejectionQty: Number(o.rejectionQty || 0),
      totalQuantity,
      totalAmount: Number(o.totalAmount || o.amount || 0),
      status: normalizeOrderStatus(o.status),
      rejectionReason: o.rejectionReason || "",
      rejectionNote: o.rejectionNote || "",
      rejectedBy: o.rejectedBy || "",
      rejectedAt: o.rejectedAt || null,
      createdAt: o.createdAt,
      products: o.products,
      harvestDate: o.harvestDate || o.date || "",
      amount: o.amount,
      orderDate: o.orderDate,
      requiredDate: o.requiredDate || o.pickupDate || "",
      pickupDate: o.pickupDate || o.requiredDate || "",
      pickupTime: o.pickupTime || o.harvestTime || "",
      harvestTime: o.harvestTime || o.pickupTime || "",
    };
  });
}

function harvestOrderKeys(item) {
  return [...new Set([item?.id, item?.orderId, item?._id ? String(item._id) : ""].filter(Boolean).map(String))];
}

function mergeHarvestLists(harvestOrders, mappedFarmerOrders) {
  const idMap = new Map();
  const remember = (item) => {
    harvestOrderKeys(item).forEach((key) => idMap.set(key, item));
  };
  harvestOrders.forEach((item) => remember({ ...item, status: normalizeOrderStatus(item.status) }));
  mappedFarmerOrders.forEach((item) => {
    const keys = harvestOrderKeys(item);
    const existing = keys.map((key) => idMap.get(key)).find(Boolean);
    remember(existing ? { ...existing, ...item } : { ...item });
  });
  const seen = new Set();
  const merged = [];
  idMap.forEach((item) => {
    const keys = harvestOrderKeys(item);
    if (!keys.length || keys.some((k) => seen.has(k))) return;
    keys.forEach((k) => seen.add(k));
    merged.push(item);
  });
  return merged.sort(
    (a, b) => new Date(b.date || b.orderDate || b.createdAt || 0) - new Date(a.date || a.orderDate || a.createdAt || 0)
  );
}

// Helper to enrich a single farmer object with calculated stats
async function enrichFarmerDoc(farmerDoc) {
  const f = toPlain(farmerDoc);
  const farmerId = f.id;

  const [manager, stats] = await Promise.all([
    f.managerId ? FarmerManager.findOne({ id: f.managerId }).select("name").lean() : null,
    aggFarmerStats([farmerId]),
  ]);

  const pStat = stats.productStats.get(farmerId) || { count: 0, stock: 0 };
  delete f.password;

  return {
    ...f,
    farmerId: f.farmerId || f.id,
    loginEnabled: f.loginEnabled !== false,
    managerName: manager?.name || "—",
    initials: initials(f.name),
    totalProducts: pStat.count,
    totalStock: pStat.stock,
    totalInventory: pStat.stock,
    totalOrders: stats.orderStats.get(farmerId) || 0,
    totalEarnings: stats.earningStats.get(farmerId) || 0,
  };
}

// Batch helper: 3 aggregations + 1 manager lookup instead of loading every related document
async function enrichFarmerDocsBatch(farmerDocs) {
  if (!farmerDocs || !farmerDocs.length) return [];

  const rawFarmers = farmerDocs.map(toPlain);
  const farmerIds = rawFarmers.map((f) => f.id).filter(Boolean);
  const managerIds = Array.from(new Set(rawFarmers.map((f) => f.managerId).filter(Boolean)));

  const [managers, stats] = await Promise.all([
    managerIds.length ? FarmerManager.find({ id: { $in: managerIds } }).select("id name").lean() : [],
    aggFarmerStats(farmerIds),
  ]);

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));

  return rawFarmers.map((f) => {
    delete f.password;
    const pStat = stats.productStats.get(f.id) || { count: 0, stock: 0 };
    return {
      ...f,
      farmerId: f.farmerId || f.id,
      loginEnabled: f.loginEnabled !== false,
      managerName: managerMap.get(f.managerId) || "—",
      initials: initials(f.name),
      totalProducts: pStat.count,
      totalStock: pStat.stock,
      totalInventory: pStat.stock,
      totalOrders: stats.orderStats.get(f.id) || 0,
      totalEarnings: stats.earningStats.get(f.id) || 0,
    };
  });
}

// ----------------------------------------------------
// FARMER CONTROLLERS
// ----------------------------------------------------
export async function getFarmers(req, res) {
  try {
    const { q = "", status = "", managerId = "", location = "", vendorId = DEFAULT_VENDOR_ID } = req.query;

    const query = { vendorId };
    if (status) query.status = status;
    if (managerId) query.managerId = managerId;
    if (location) query.farmLocation = { $regex: location, $options: "i" };

    let farmerDocs = await Farmer.find(query).select("-password").sort({ createdAt: -1 }).lean();

    let enriched = await enrichFarmerDocsBatch(farmerDocs);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          f.managerName.toLowerCase().includes(needle) ||
          f.mobile.includes(needle) ||
          f.farmName.toLowerCase().includes(needle) ||
          (f.farmerCode && f.farmerCode.toLowerCase().includes(needle))
      );
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmers" });
  }
}

export async function getFarmerById(req, res) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmer" });
  }
}

export async function createFarmer(req, res) {
  try {
    const payload = req.body;
    const vendorId = req.user?.vendorId || payload.vendorId || DEFAULT_VENDOR_ID;
    const managerId =
      req.user?.role === "FARMER_MANAGER"
        ? req.user.managerId
        : payload.managerId || "";

    if (!payload.name || !payload.mobile) {
      return res.status(400).json({ success: false, message: "Farmer name and mobile are required" });
    }

    const cleanMobile = String(payload.mobile).trim();
    const existing = await Farmer.findOne({ mobile: cleanMobile });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Farmer with this mobile number already exists.",
      });
    }

    const rawPassword = payload.password || "123456";
    if (String(rawPassword).length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const { farmerId: businessId, loc } = await assignFarmerBusinessId({
      state: payload.state || payload.address?.state || "Maharashtra",
      district: payload.district || payload.address?.district || "",
      taluka: payload.taluka || payload.address?.taluka || "",
      village: payload.village || payload.address?.village || "",
    });
    const id = businessId;
    const farmerCode = businessId;

    const farmer = new Farmer({
      id,
      farmerId: businessId,
      farmerCode,
      companyId: "GGC",
      stateId: loc.stateId,
      districtId: loc.districtId,
      talukaId: loc.talukaId,
      villageId: loc.villageId,
      vendorId,
      managerId,
      name: payload.name.trim(),
      mobile: cleanMobile,
      email: payload.email || "",
      password: hashedPassword,
      loginEnabled: payload.loginEnabled !== false,
      profileImage: payload.profileImage || "",
      farmName: payload.farmName || "",
      farmLocation: payload.farmLocation || "",
      farmAddress: payload.farmAddress || "",
      farmArea: payload.farmArea || "",
      farmType: payload.farmType || "Organic",
      address: payload.address || {},
      status: payload.status || "Active",
      verificationStatus: payload.verificationStatus || "Approved",
      verificationRequired: false,
      bank: {
        accountHolder: payload.bank?.accountHolder || payload.name,
        bankName: payload.bank?.bankName || "",
        accountNumber: payload.bank?.accountNumber || "",
        ifsc: payload.bank?.ifsc || "",
      },
    });

    await farmer.save();
    await ensureFarmForFarmer(farmer, loc);
    await farmer.save();
    await ensureEntityQr({
      entityType: "FARMER",
      entityId: farmer.farmerId || farmer.id,
      links: { farmerId: farmer.farmerId || farmer.id, farmId: farmer.farm?.farmId || "" },
    });

    // Create default document shells
    const defaultDocTypes = [
      { type: "aadhaar", name: "Aadhaar / ID Proof" },
      { type: "pan", name: "PAN" },
      { type: "address", name: "Address Proof" },
      { type: "bank", name: "Bank Details" },
      { type: "other", name: "Other Documents" },
    ];

    const docsToCreate = defaultDocTypes.map((d) => ({
      id: `doc-${farmer.id}-${d.type}`,
      vendorId,
      managerId: farmer.managerId,
      farmerId: farmer.id,
      name: d.name,
      type: d.type,
      fileName: payload.documents?.[d.type] || "",
      uploadedAt: payload.documents?.[d.type] ? new Date() : null,
      status: payload.documents?.[d.type] ? "Pending" : "Not Uploaded",
    }));

    await FarmerDocument.insertMany(docsToCreate);

    const enriched = await enrichFarmerDoc(farmer);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create farmer" });
  }
}

export async function updateFarmer(req, res) {
  try {
    const { farmerId } = req.params;
    const payload = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    if (payload.name) farmer.name = payload.name;
    if (payload.mobile) farmer.mobile = payload.mobile;
    if (payload.email !== undefined) farmer.email = payload.email;
    if (payload.farmName !== undefined) farmer.farmName = payload.farmName;
    if (payload.farmLocation !== undefined) farmer.farmLocation = payload.farmLocation;
    if (payload.farmAddress !== undefined) farmer.farmAddress = payload.farmAddress;
    if (payload.farmArea !== undefined) farmer.farmArea = payload.farmArea;
    if (payload.farmType !== undefined) farmer.farmType = payload.farmType;
    if (payload.status) farmer.status = payload.status;
    if (payload.verificationStatus) farmer.verificationStatus = payload.verificationStatus;
    if (payload.managerId !== undefined) farmer.managerId = payload.managerId;
    if (payload.profileImage !== undefined) farmer.profileImage = payload.profileImage;

    if (payload.address) {
      farmer.address = { ...farmer.address, ...payload.address };
    }
    if (payload.bank) {
      farmer.bank = { ...farmer.bank, ...payload.bank };
    }

    await farmer.save();

    if (payload.managerId !== undefined) {
      await FarmerProduct.updateMany({ farmerId }, { managerId: payload.managerId });
      await FarmerDocument.updateMany({ farmerId }, { managerId: payload.managerId });
    }

    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update farmer" });
  }
}

export async function deleteFarmer(req, res) {
  try {
    const { farmerId } = req.params;
    await Farmer.deleteOne({ id: farmerId });
    await FarmerProduct.deleteMany({ farmerId });
    await FarmerOrder.deleteMany({ farmerId });
    await FarmerEarning.deleteMany({ farmerId });
    await FarmerDocument.deleteMany({ farmerId });
    await FarmerStockHistory.deleteMany({ farmerId });
    res.json({ success: true, message: "Farmer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete farmer" });
  }
}

export async function setFarmerStatus(req, res) {
  try {
    const { farmerId } = req.params;
    const { status } = req.body;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    farmer.status = status;
    await farmer.save();
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update status" });
  }
}

export async function farmerLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: "Mobile number and password are required" });
    }

    const cleanMobile = String(mobile).trim();
    const farmer = await Farmer.findOne({ mobile: cleanMobile });
    if (!farmer) {
      return res.status(401).json({ success: false, message: "Invalid mobile number or password" });
    }

    if (farmer.loginEnabled === false) {
      return res.status(403).json({
        success: false,
        message: "Farmer login is currently disabled. Please contact your manager.",
      });
    }

    if (farmer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Farmer account is currently ${farmer.status.toLowerCase()}. Please contact your manager.`,
      });
    }

    let isMatch = false;
    if (farmer.password && (farmer.password.startsWith("$2a$") || farmer.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, farmer.password);
    } else {
      isMatch = farmer.password === password;
      if (isMatch) {
        farmer.password = await bcrypt.hash(password, 10);
        await farmer.save();
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid mobile number or password" });
    }

    const token = signToken({
      id: farmer.id,
      farmerId: farmer.id,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId || "",
      role: "FARMER",
      name: farmer.name,
    });

    const enriched = await enrichFarmerDoc(farmer);

    res.json({
      success: true,
      message: "Login successful",
      token,
      farmer: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
}

const SELF_REGISTER_GENDERS = ["Male", "Female", "Other"];

export async function registerFarmer(req, res) {
  try {
    const payload = req.body || {};
    const name = String(payload.name || "").trim();
    const dateOfBirth = String(payload.dateOfBirth || "").trim();
    const gender = String(payload.gender || "").trim();
    const cleanMobile = String(payload.mobile || "").replace(/\D/g, "");
    const village = String(payload.village || payload.address?.village || "").trim();
    const taluka = String(payload.taluka || payload.address?.taluka || "").trim();
    const district = String(payload.district || payload.address?.district || "").trim();
    const pincode = String(payload.pincode || payload.address?.pincode || "").trim();
    const profileImage = String(payload.profileImage || payload.photo || "").trim();
    const state = String(payload.state || payload.address?.state || "Maharashtra").trim();

    if (!name || name.length < 3) {
      return res.status(400).json({ success: false, message: "Enter farmer full name (min 3 characters)" });
    }
    if (!dateOfBirth || !isAdult(dateOfBirth)) {
      return res.status(400).json({ success: false, message: "Enter a valid date of birth. Farmer must be 18 or older." });
    }
    if (!SELF_REGISTER_GENDERS.includes(gender)) {
      return res.status(400).json({ success: false, message: "Select a valid gender" });
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    }
    if (!village || !taluka || !district) {
      return res.status(400).json({ success: false, message: "Village, taluka and district are required" });
    }
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: "Enter a valid 6-digit pincode" });
    }
    if (!profileImage) {
      return res.status(400).json({ success: false, message: "Farmer photo is required" });
    }
    const rawPassword = String(payload.password || "");
    if (rawPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await Farmer.findOne({ mobile: cleanMobile }).select("id").lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A farmer account already exists with this mobile number.",
      });
    }

    const referral = await resolveReferralCode(payload.referralCode || payload.agentCode);
    const vendorId = referral.vendorId || DEFAULT_VENDOR_ID;
    const { farmerId, loc } = await assignFarmerBusinessId({
      state,
      district,
      taluka,
      village,
    });
    const farmerCode = farmerId;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const farmLocation = [village, district, state].filter(Boolean).join(", ");

    const farmer = new Farmer({
      id: farmerId,
      farmerId,
      farmerCode,
      companyId: "GGC",
      stateId: loc.stateId,
      districtId: loc.districtId,
      talukaId: loc.talukaId,
      villageId: loc.villageId,
      vendorId,
      managerId: referral.managerId,
      name,
      mobile: cleanMobile,
      email: payload.email || "",
      password: hashedPassword,
      loginEnabled: true,
      profileImage,
      farmName: payload.farmName || "",
      farmLocation,
      farmAddress: [village, taluka, district, state, pincode].filter(Boolean).join(", "),
      farmArea: payload.farmArea || "",
      farmType: payload.farmType || "Organic",
      dateOfBirth,
      gender,
      referralCode: referral.referralCode,
      preferredLanguage: payload.preferredLanguage || "",
      bankVerificationStatus: "PENDING",
      farm: {
        farmId: "",
        farmName: payload.farmName || "",
        totalFarmAreaUnit: "Acre",
        cultivatedAreaUnit: "Acre",
        farmingType: payload.farmType || "",
      },
      farmGeo: {
        village,
        taluka,
        district,
        pincode,
        farmAddress: [village, taluka, district, state, pincode].filter(Boolean).join(", "),
      },
      address: {
        village,
        taluka,
        district,
        state,
        pincode,
      },
      status: "Active",
      verificationStatus: "Pending",
      verificationRequired: false,
      registrationStatus: "REGISTERED",
      kycStatus: "PENDING",
      authType: "direct",
      mobileVerified: false,
      role: "FARMER",
      bank: {
        accountHolder: name,
        bankName: "",
        accountNumber: "",
        ifsc: "",
      },
    });

    await farmer.save();
    await ensureFarmForFarmer(farmer, loc);
    await farmer.save();
    await ensureEntityQr({
      entityType: "FARMER",
      entityId: farmer.farmerId || farmer.id,
      links: { farmerId: farmer.farmerId || farmer.id, farmId: farmer.farm?.farmId || "" },
    });
    await FarmerDocument.insertMany(
      defaultKycDocumentShells({
        farmerId: farmer.id,
        vendorId,
        managerId: farmer.managerId,
      })
    );

    const token = signToken({
      id: farmer.id,
      farmerId: farmer.id,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId || "",
      role: "FARMER",
      name: farmer.name,
    });

    const { password: _pw, ...farmerData } = farmer.toObject();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      farmer: {
        ...farmerData,
        farmerId: farmer.id,
        role: "FARMER",
        registrationStatus: "REGISTERED",
        kycStatus: "PENDING",
        initials: initials(farmer.name),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Registration failed" });
  }
}

function authFarmerId(req) {
  return req.user?.farmerId || req.user?.id || "";
}

function areaInAcres(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return String(unit).toLowerCase() === "hectare" ? n * 2.47105 : n;
}

function publicFarmLocation(farmer) {
  const geo = farmer.farmGeo || {};
  return {
    village: geo.village || farmer.address?.village || "",
    taluka: geo.taluka || farmer.address?.taluka || "",
    district: geo.district || farmer.address?.district || "",
    pincode: geo.pincode || farmer.address?.pincode || "",
    farmAddress: geo.farmAddress || farmer.farmAddress || "",
    latitude: geo.latitude ?? null,
    longitude: geo.longitude ?? null,
    hasPin: geo.latitude != null && geo.longitude != null,
    confirmed: Boolean(geo.confirmed),
  };
}

async function buildSelfFarmerPayload(farmer) {
  const enriched = await enrichFarmerDoc(farmer);
  const bankDoc = await FarmerDocument.findOne({ farmerId: farmer.id, type: "bank" }).select("status").lean();
  let bankVerificationStatus = farmer.bankVerificationStatus || "PENDING";
  if (bankDoc?.status === "Approved" || bankDoc?.status === "approved") bankVerificationStatus = "VERIFIED";
  if (bankDoc?.status === "Rejected" || bankDoc?.status === "rejected") bankVerificationStatus = "REJECTED";

  return {
    ...enriched,
    farmerId: farmer.id,
    farm: farmer.farm || {},
    farmLocation: publicFarmLocation(farmer),
    bankVerificationStatus,
    kycStatus: farmer.kycStatus || "PENDING",
  };
}

export async function getFarmerMe(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    res.json(await buildSelfFarmerPayload(farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load farmer profile" });
  }
}

export async function updateFarmerSelfProfile(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const payload = req.body || {};
    const name = String(payload.name || "").trim();
    const cleanMobile = String(payload.mobile || farmer.mobile || "").replace(/\D/g, "");
    const village = String(payload.village || payload.address?.village || "").trim();
    const taluka = String(payload.taluka || payload.address?.taluka || "").trim();
    const district = String(payload.district || payload.address?.district || "").trim();
    const pincode = String(payload.pincode || payload.address?.pincode || "").trim();
    const preferredLanguage = String(payload.preferredLanguage || "").trim();

    if (!name || name.length < 3) {
      return res.status(400).json({ message: "Farmer name is required" });
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }
    if (!village) return res.status(400).json({ message: "Village is required" });
    if (!taluka) return res.status(400).json({ message: "Taluka is required" });
    if (!district) return res.status(400).json({ message: "District is required" });
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Enter a valid 6-digit pincode" });
    }
    if (!preferredLanguage) {
      return res.status(400).json({ message: "Preferred language is required" });
    }

    if (cleanMobile !== farmer.mobile) {
      const taken = await Farmer.findOne({ mobile: cleanMobile, id: { $ne: farmer.id } }).select("id").lean();
      if (taken) {
        return res.status(409).json({ message: "A farmer account already exists with this mobile number." });
      }
    }

    farmer.name = name;
    farmer.mobile = cleanMobile;
    farmer.preferredLanguage = preferredLanguage;
    if (payload.profileImage !== undefined) farmer.profileImage = payload.profileImage;
    farmer.address = {
      ...(farmer.address || {}),
      village,
      taluka,
      district,
      pincode,
      state: farmer.address?.state || "Maharashtra",
    };

    await farmer.save();
    res.json(await buildSelfFarmerPayload(farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update farmer profile" });
  }
}

export async function updateFarmerFarmProfile(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const payload = req.body || {};
    const farmName = String(payload.farmName || "").trim();
    const totalFarmArea = Number(payload.totalFarmArea);
    const cultivatedArea = Number(payload.cultivatedArea);
    const totalFarmAreaUnit = payload.totalFarmAreaUnit === "Hectare" ? "Hectare" : "Acre";
    const cultivatedAreaUnit = payload.cultivatedAreaUnit === "Hectare" ? "Hectare" : "Acre";
    const soilType = String(payload.soilType || "").trim();
    const irrigationType = String(payload.irrigationType || "").trim();
    const waterSource = String(payload.waterSource || "").trim();
    const farmingMethod = String(payload.farmingMethod || "").trim();
    const farmingType = String(payload.farmingType || "").trim();
    const mainCrops = String(payload.mainCrops || "").trim();

    if (!farmName) return res.status(400).json({ message: "Farm name is required" });
    if (!Number.isFinite(totalFarmArea) || totalFarmArea <= 0) {
      return res.status(400).json({ message: "Total farm area must be greater than 0" });
    }
    if (!Number.isFinite(cultivatedArea) || cultivatedArea <= 0) {
      return res.status(400).json({ message: "Cultivated area must be greater than 0" });
    }
    if (areaInAcres(cultivatedArea, cultivatedAreaUnit) > areaInAcres(totalFarmArea, totalFarmAreaUnit) + 0.0001) {
      return res.status(400).json({ message: "Cultivated area cannot be greater than total farm area" });
    }
    if (!soilType || soilType === "Other") return res.status(400).json({ message: "Soil type is required" });
    if (!irrigationType || irrigationType === "Other") return res.status(400).json({ message: "Irrigation type is required" });
    if (!waterSource || waterSource === "Other") return res.status(400).json({ message: "Water source is required" });
    if (!farmingMethod || farmingMethod === "Other") return res.status(400).json({ message: "Farming method is required" });
    if (!farmingType || farmingType === "Other") return res.status(400).json({ message: "Farming type is required" });

    const farmPhotos = Array.isArray(payload.farmPhotos) ? payload.farmPhotos.filter(Boolean).slice(0, 4) : farmer.farm?.farmPhotos || [];
    const farmVideos = Array.isArray(payload.farmVideos) ? payload.farmVideos.filter(Boolean).slice(0, 2) : farmer.farm?.farmVideos || [];

    farmer.farm = {
      farmId: farmer.farm?.farmId || `farm-${farmer.id}`,
      farmName,
      totalFarmArea,
      totalFarmAreaUnit,
      cultivatedArea,
      cultivatedAreaUnit,
      soilType,
      irrigationType,
      waterSource,
      farmingMethod,
      farmingType,
      mainCrops,
      farmPhotos,
      farmVideos,
    };
    farmer.farmName = farmName;
    farmer.farmArea = `${totalFarmArea} ${totalFarmAreaUnit}`;
    farmer.farmType = farmingType || farmer.farmType;
    farmer.markModified("farm");
    await farmer.save();

    res.json(await buildSelfFarmerPayload(farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update farm profile" });
  }
}

function validateFarmLocationPayload(payload, farmer, requirePin) {
  const village = String(payload.village || "").trim();
  const taluka = String(payload.taluka || "").trim();
  const district = String(payload.district || "").trim();
  const pincode = String(payload.pincode || "").trim();
  const farmAddress = String(payload.farmAddress || "").trim();
  const latitude = payload.latitude != null ? Number(payload.latitude) : farmer.farmGeo?.latitude;
  const longitude = payload.longitude != null ? Number(payload.longitude) : farmer.farmGeo?.longitude;

  if (!village) return { error: "Village is required" };
  if (!taluka) return { error: "Taluka is required" };
  if (!district) return { error: "District is required" };
  if (!/^\d{6}$/.test(pincode)) return { error: "Enter a valid 6-digit pincode" };
  if (!farmAddress) return { error: "Farm address is required" };
  if (requirePin && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
    return { error: "Select and confirm the farm location on the map" };
  }
  return { village, taluka, district, pincode, farmAddress, latitude, longitude };
}

export async function updateFarmerFarmLocation(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const parsed = validateFarmLocationPayload(req.body || {}, farmer, false);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    farmer.farmGeo = {
      ...(farmer.farmGeo || {}),
      village: parsed.village,
      taluka: parsed.taluka,
      district: parsed.district,
      pincode: parsed.pincode,
      farmAddress: parsed.farmAddress,
      latitude: Number.isFinite(parsed.latitude) ? parsed.latitude : farmer.farmGeo?.latitude ?? null,
      longitude: Number.isFinite(parsed.longitude) ? parsed.longitude : farmer.farmGeo?.longitude ?? null,
      confirmed: false,
    };
    farmer.farmAddress = parsed.farmAddress;
    farmer.farmLocation = [parsed.village, parsed.district].filter(Boolean).join(", ");
    farmer.address = {
      ...(farmer.address || {}),
      village: parsed.village,
      taluka: parsed.taluka,
      district: parsed.district,
      pincode: parsed.pincode,
    };
    farmer.markModified("farmGeo");
    await farmer.save();
    res.json(await buildSelfFarmerPayload(farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save farm location" });
  }
}

export async function confirmFarmerFarmLocation(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const parsed = validateFarmLocationPayload(req.body || {}, farmer, true);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    farmer.farmGeo = {
      village: parsed.village,
      taluka: parsed.taluka,
      district: parsed.district,
      pincode: parsed.pincode,
      farmAddress: parsed.farmAddress,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      confirmed: true,
    };
    farmer.farmAddress = parsed.farmAddress;
    farmer.farmLocation = [parsed.village, parsed.district].filter(Boolean).join(", ");
    farmer.address = {
      ...(farmer.address || {}),
      village: parsed.village,
      taluka: parsed.taluka,
      district: parsed.district,
      pincode: parsed.pincode,
    };
    farmer.markModified("farmGeo");
    await farmer.save();
    res.json(await buildSelfFarmerPayload(farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to confirm farm location" });
  }
}

const CROP_STATUS_FLOW = {
  Planned: ["Planned", "Growing"],
  Growing: ["Growing", "Ready for Harvest"],
  "Ready for Harvest": ["Ready for Harvest", "Harvested"],
  Harvested: ["Harvested", "Completed"],
  Completed: ["Completed"],
};

function sanitizeCropPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((p) => typeof p === "string" && p.length > 20 && p.length < 2_500_000)
    .filter((p) => p.startsWith("data:image/") || p.startsWith("http://") || p.startsWith("https://"))
    .slice(0, 4);
}

function deriveCropStatus(sowingDate, harvestDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (harvestDate && harvestDate <= today) return "Ready for Harvest";
  if (sowingDate && sowingDate <= today) return "Growing";
  return "Planned";
}

function validateCropPayload(payload) {
  const cropName = String(payload.cropName || payload.crop || "").trim();
  const variety = String(payload.variety || "").trim();
  const area = Number(payload.area);
  const areaUnit = String(payload.areaUnit || "Acre").trim() || "Acre";
  const sowingDate = String(payload.sowingDate || "").trim();
  const expectedHarvestDate = String(payload.expectedHarvestDate || "").trim();
  const estimatedQuantity = Number(payload.estimatedQuantity);
  const unit = String(payload.unit || "").trim();
  const farmingMethod = String(payload.farmingMethod || "").trim();
  const farmingType = String(payload.farmingType || "").trim();
  const irrigationType = String(payload.irrigationType || "").trim();

  if (!cropName) return { error: "Crop name is required" };
  if (!variety) return { error: "Variety is required" };
  if (!Number.isFinite(area) || area <= 0) return { error: "Area must be greater than 0" };
  if (!sowingDate) return { error: "Sowing date is required" };
  if (!expectedHarvestDate) return { error: "Expected harvest date is required" };
  if (expectedHarvestDate < sowingDate) return { error: "Expected harvest date cannot be before sowing date" };
  if (!Number.isFinite(estimatedQuantity) || estimatedQuantity <= 0) {
    return { error: "Estimated quantity must be greater than 0" };
  }
  if (!unit) return { error: "Unit is required" };
  if (!farmingMethod || farmingMethod === "Other") return { error: "Farming method is required" };
  if (!irrigationType || irrigationType === "Other") return { error: "Irrigation type is required" };
  if (farmingType === "Other") return { error: "Please specify farming type" };

  return {
    cropName,
    variety,
    area,
    areaUnit,
    sowingDate,
    expectedHarvestDate,
    estimatedQuantity,
    unit,
    farmingMethod,
    farmingType,
    irrigationType,
    photos: sanitizeCropPhotos(payload.photos),
  };
}

function farmSummary(farmer) {
  return {
    farmId: farmer.farm?.farmId || `farm-${farmer.id}`,
    farmName: farmer.farm?.farmName || farmer.farmName || "",
    farmLocation: farmer.farmLocation || farmer.farmGeo?.farmAddress || farmer.farmAddress || "",
  };
}

function publicCrop(crop, farmer) {
  const plain = toPlain(crop);
  return {
    ...plain,
    cropId: plain.cropId || plain.id,
    ...farmSummary(farmer),
  };
}

function publicPlan(plan, crop) {
  const plain = toPlain(plan);
  return {
    ...plain,
    planId: plain.planId || plain.id,
    cropName: crop?.cropName || "",
    variety: crop?.variety || "",
    farmingMethod: crop?.farmingMethod || "",
    farmingType: crop?.farmingType || "",
  };
}

async function upsertCropPlan(farmerId, crop) {
  const planCropKey = crop.cropId || crop.id;
  const existing = await FarmerCropPlan.findOne({
    farmerId,
    $or: [{ cropId: crop.id }, { cropId: planCropKey }],
  });
  if (existing) {
    existing.cropId = planCropKey;
    existing.harvestDate = crop.expectedHarvestDate;
    existing.estimatedProduction = crop.estimatedQuantity;
    existing.unit = crop.unit;
    if (Number(existing.suggestedSaleQuantity) > Number(existing.estimatedProduction)) {
      existing.suggestedSaleQuantity = existing.estimatedProduction;
    }
    await existing.save();
    return existing;
  }
  const planId = `plan-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  return FarmerCropPlan.create({
    id: planId,
    planId,
    farmerId,
    cropId: planCropKey,
    harvestDate: crop.expectedHarvestDate,
    estimatedProduction: crop.estimatedQuantity,
    expectedDemand: 0,
    suggestedSaleQuantity: 0,
    unit: crop.unit,
    status: "Planned",
  });
}

async function loadOwnCrop(req, res) {
  const farmerId = authFarmerId(req);
  const cropId = req.params.cropId;
  const crop = await FarmerCrop.findOne({
    farmerId,
    $or: [{ id: cropId }, { cropId }, { previousCropId: cropId }],
  });
  if (!crop) {
    res.status(404).json({ message: "Crop not found" });
    return null;
  }
  return ensureSharedCropBusinessId(crop);
}

export async function listFarmerCrops(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const crops = await FarmerCrop.find({ farmerId }).sort({ createdAt: -1 });
    const normalized = [];
    for (const crop of crops) {
      normalized.push(await ensureSharedCropBusinessId(crop));
    }
    res.json(normalized.map((c) => publicCrop(c, farmer)));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crops" });
  }
}

export async function getFarmerCrop(req, res) {
  try {
    const crop = await loadOwnCrop(req, res);
    if (!crop) return;
    const farmer = await Farmer.findOne({ id: crop.farmerId });
    const plan = await FarmerCropPlan.findOne({
      farmerId: crop.farmerId,
      $or: [{ cropId: crop.id }, { cropId: crop.cropId }],
    }).lean();
    res.json({ ...publicCrop(crop, farmer), plan: plan ? publicPlan(plan, crop) : null });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crop" });
  }
}

async function resolveSharedCropBusinessId(parsed) {
  const cropName = String(parsed.cropName || "").trim();
  const variety = String(parsed.variety || "").trim();
  if (cropName) {
    const existing = await FarmerCrop.findOne({
      cropName: new RegExp(`^${cropName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ...(variety
        ? { variety: new RegExp(`^${variety.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        : {}),
    })
      .sort({ createdAt: 1 });
    if (existing) {
      const normalized = await ensureSharedCropBusinessId(existing);
      const shared = String(normalized?.cropId || normalized?.id || "").trim();
      if (shared.startsWith("GGC-CRP-")) return shared;
    }
  }
  return generateId({
    module: "CRP",
    category: categoryFromName(cropName),
    crop: cropCodeFromName(cropName),
    variety: varietyCodeFromName(variety),
  });
}

async function uniqueProductRecordId(productId, farmer) {
  const base = String(productId || "").trim();
  const taken = await FarmerProduct.exists({ id: base });
  if (!taken) return base;
  const serial = farmerSerialFromId(farmer.farmerId || farmer.id);
  let candidate = `${base}-F${serial}`;
  let n = 1;
  while (await FarmerProduct.exists({ id: candidate })) {
    n += 1;
    candidate = `${base}-F${serial}-${n}`;
  }
  return candidate;
}

async function resolveProductIdsFromCrop(farmer, crop, cropName, variety) {
  let cropDoc = crop;
  if (cropDoc) {
    cropDoc = await ensureSharedCropBusinessId(cropDoc);
  }
  const name = cropName || cropDoc?.cropName || "";
  const varName = variety || cropDoc?.variety || "";

  // Reuse shared productId if another farmer already has this crop+variety
  if (name) {
    const existing = await FarmerProduct.find({
      $or: [
        { cropName: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        { name: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        { productName: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
      ...(varName
        ? { variety: new RegExp(`^${String(varName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        : {}),
    })
      .sort({ createdAt: 1 })
      .limit(1);
    const sharedPid = String(existing[0]?.productId || "").trim();
    if (sharedPid.startsWith("GGC-ART-")) {
      const id = await uniqueProductRecordId(sharedPid, farmer);
      return {
        id,
        productId: sharedPid,
        cropBusinessId: cropDoc?.cropId || `GGC-CRP-${sharedPid.slice("GGC-ART-".length)}`,
      };
    }
  }

  let productId = productIdFromCropId(cropDoc?.cropId || "");
  if (!productId) {
    productId = await generateId({
      module: "ART",
      category: categoryFromName(name || cropDoc?.cropName),
      crop: cropCodeFromName(name || cropDoc?.cropName),
      variety: varietyCodeFromName(varName || cropDoc?.variety),
    });
  }
  const id = await uniqueProductRecordId(productId, farmer);
  return { id, productId, cropBusinessId: cropDoc?.cropId || "" };
}

async function persistNewCrop(farmer, parsed) {
  const cropId = await resolveSharedCropBusinessId(parsed);
  const id = await uniqueCropRecordId(cropId, farmer);
  const crop = await FarmerCrop.create({
    id,
    cropId,
    farmerId: farmer.id,
    farmId: farmSummary(farmer).farmId,
    cropName: parsed.cropName,
    variety: parsed.variety,
    area: parsed.area,
    areaUnit: parsed.areaUnit,
    sowingDate: parsed.sowingDate,
    expectedHarvestDate: parsed.expectedHarvestDate,
    estimatedQuantity: parsed.estimatedQuantity,
    unit: parsed.unit,
    farmingMethod: parsed.farmingMethod,
    farmingType: parsed.farmingType,
    irrigationType: parsed.irrigationType,
    photos: parsed.photos,
    status: deriveCropStatus(parsed.sowingDate, parsed.expectedHarvestDate),
  });
  await syncFarmerCropToErp(crop, farmer);
  await ensureEntityQr({
    entityType: "CROP",
    entityId: cropId,
    links: { farmerId: farmer.farmerId || farmer.id, farmId: crop.farmId, cropId },
  });
  const plan = await upsertCropPlan(farmer.id, crop);
  return { crop, plan };
}

async function applyCropUpdate(crop, payload) {
  const parsed = validateCropPayload({ ...toPlain(crop), ...(payload || {}) });
  if (parsed.error) return { error: parsed.error };
  const nextStatus = String(payload?.status || crop.status);
  const allowed = CROP_STATUS_FLOW[crop.status] || [crop.status];
  if (!allowed.includes(nextStatus)) {
    return { error: `Cannot change status from ${crop.status} to ${nextStatus}` };
  }
  crop.cropName = parsed.cropName;
  crop.variety = parsed.variety;
  crop.area = parsed.area;
  crop.areaUnit = parsed.areaUnit;
  crop.sowingDate = parsed.sowingDate;
  crop.expectedHarvestDate = parsed.expectedHarvestDate;
  crop.estimatedQuantity = parsed.estimatedQuantity;
  crop.unit = parsed.unit;
  crop.farmingMethod = parsed.farmingMethod;
  crop.farmingType = parsed.farmingType;
  crop.irrigationType = parsed.irrigationType;
  crop.photos = parsed.photos;
  crop.status = nextStatus;
  await crop.save();
  const plan = await upsertCropPlan(crop.farmerId, crop);
  return { crop, plan };
}

export async function createFarmerCrop(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: authFarmerId(req) });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const parsed = validateCropPayload(req.body || {});
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const { crop, plan } = await persistNewCrop(farmer, parsed);
    res.status(201).json({ ...publicCrop(crop, farmer), plan: publicPlan(plan, crop) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create crop" });
  }
}

export async function updateFarmerCrop(req, res) {
  try {
    const crop = await loadOwnCrop(req, res);
    if (!crop) return;
    const updated = await applyCropUpdate(crop, req.body || {});
    if (updated.error) return res.status(400).json({ message: updated.error });
    const farmer = await Farmer.findOne({ id: crop.farmerId });
    res.json({ ...publicCrop(updated.crop, farmer), plan: publicPlan(updated.plan, updated.crop) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update crop" });
  }
}

export async function deleteFarmerCrop(req, res) {
  try {
    const crop = await loadOwnCrop(req, res);
    if (!crop) return;
    await FarmerCropPlan.deleteMany({
      farmerId: crop.farmerId,
      $or: [{ cropId: crop.id }, { cropId: crop.cropId }],
    });
    await FarmerCrop.deleteOne({ id: crop.id });
    res.json({ success: true, message: "Crop deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete crop" });
  }
}

export async function getManagedFarmerCrops(req, res) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const crops = await FarmerCrop.find({ farmerId: farmer.id }).sort({ createdAt: -1 });
    const normalized = [];
    for (const crop of crops) {
      normalized.push(await ensureSharedCropBusinessId(crop));
    }
    res.json(normalized.map((c) => publicCrop(c, farmer)));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crops" });
  }
}

export async function getManagedFarmerCrop(req, res) {
  try {
    const { farmerId, cropId } = req.params;
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const crop = await FarmerCrop.findOne({
      farmerId: farmer.id,
      $or: [{ id: cropId }, { cropId }, { previousCropId: cropId }],
    });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    const normalized = await ensureSharedCropBusinessId(crop);
    const plan = await FarmerCropPlan.findOne({
      farmerId: farmer.id,
      $or: [{ cropId: normalized.id }, { cropId: normalized.cropId }],
    }).lean();
    res.json({ ...publicCrop(normalized, farmer), plan: plan ? publicPlan(plan, normalized) : null });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crop" });
  }
}

export async function createManagedFarmerCrop(req, res) {
  try {
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, req.params.farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const parsed = validateCropPayload(req.body || {});
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const { crop, plan } = await persistNewCrop(farmer, parsed);
    res.status(201).json({ ...publicCrop(crop, farmer), plan: publicPlan(plan, crop) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create crop" });
  }
}

export async function updateManagedFarmerCrop(req, res) {
  try {
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, req.params.farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const crop = await FarmerCrop.findOne({
      farmerId: farmer.id,
      $or: [{ id: req.params.cropId }, { cropId: req.params.cropId }, { previousCropId: req.params.cropId }],
    });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    const updated = await applyCropUpdate(crop, req.body || {});
    if (updated.error) return res.status(400).json({ message: updated.error });
    res.json({ ...publicCrop(updated.crop, farmer), plan: publicPlan(updated.plan, updated.crop) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update crop" });
  }
}

export async function deleteManagedFarmerCrop(req, res) {
  try {
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, req.params.farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const crop = await FarmerCrop.findOne({
      farmerId: farmer.id,
      $or: [{ id: req.params.cropId }, { cropId: req.params.cropId }, { previousCropId: req.params.cropId }],
    });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    await FarmerCropPlan.deleteMany({
      farmerId: farmer.id,
      $or: [{ cropId: crop.id }, { cropId: crop.cropId }],
    });
    await FarmerCrop.deleteOne({ id: crop.id });
    res.json({ success: true, message: "Crop deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete crop" });
  }
}

export async function listFarmerCropPlans(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const plans = await FarmerCropPlan.find({ farmerId }).sort({ createdAt: -1 }).lean();
    const cropIds = plans.map((p) => p.cropId);
    const crops = await FarmerCrop.find({
      farmerId,
      $or: [{ id: { $in: cropIds } }, { cropId: { $in: cropIds } }],
    }).lean();
    const cropMap = new Map();
    crops.forEach((c) => {
      cropMap.set(c.id, c);
      if (c.cropId) cropMap.set(c.cropId, c);
    });
    res.json(plans.map((p) => publicPlan(p, cropMap.get(p.cropId))));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crop plans" });
  }
}

export async function getFarmerCropPlan(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const planId = req.params.planId;
    const plan = await FarmerCropPlan.findOne({ farmerId, $or: [{ id: planId }, { planId }, { cropId: planId }] });
    if (!plan) return res.status(404).json({ message: "Crop plan not found" });
    const crop = await FarmerCrop.findOne({ farmerId, id: plan.cropId });
    res.json(publicPlan(plan, crop));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crop plan" });
  }
}

export async function createFarmerCropPlan(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const cropId = String(req.body?.cropId || "").trim();
    const crop = await FarmerCrop.findOne({ farmerId, $or: [{ id: cropId }, { cropId }] });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    const plan = await upsertCropPlan(farmerId, crop);
    if (req.body?.expectedDemand != null || req.body?.suggestedSaleQuantity != null) {
      await updatePlanFields(plan, req.body, crop, res);
      return;
    }
    res.status(201).json(publicPlan(plan, crop));
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "Failed to create crop plan" });
    }
  }
}

async function updatePlanFields(plan, payload, crop, res) {
  const estimatedProduction = Number(payload.estimatedProduction ?? plan.estimatedProduction);
  const expectedDemand = Number(payload.expectedDemand ?? plan.expectedDemand);
  const suggestedSaleQuantity = Number(payload.suggestedSaleQuantity ?? plan.suggestedSaleQuantity);
  if (!Number.isFinite(estimatedProduction) || estimatedProduction <= 0) {
    res.status(400).json({ message: "Estimated production must be greater than 0" });
    return;
  }
  if (!Number.isFinite(expectedDemand) || expectedDemand < 0) {
    res.status(400).json({ message: "Expected demand cannot be negative" });
    return;
  }
  if (!Number.isFinite(suggestedSaleQuantity) || suggestedSaleQuantity < 0) {
    res.status(400).json({ message: "Suggested sale quantity cannot be negative" });
    return;
  }
  if (suggestedSaleQuantity > estimatedProduction) {
    res.status(400).json({ message: "Suggested sale quantity cannot be greater than estimated production" });
    return;
  }
  plan.estimatedProduction = estimatedProduction;
  plan.expectedDemand = expectedDemand;
  plan.suggestedSaleQuantity = suggestedSaleQuantity;
  if (payload.harvestDate) plan.harvestDate = String(payload.harvestDate);
  if (payload.unit && ["Kg", "Quintal", "Ton"].includes(payload.unit)) plan.unit = payload.unit;
  plan.status = "Updated";
  const saved = await plan.save();
  res.json(publicPlan(saved, crop));
}

export async function updateFarmerCropPlan(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const planId = req.params.planId;
    const plan = await FarmerCropPlan.findOne({ farmerId, $or: [{ id: planId }, { planId }, { cropId: planId }] });
    if (!plan) return res.status(404).json({ message: "Crop plan not found" });
    const crop = await FarmerCrop.findOne({ farmerId, id: plan.cropId });
    await updatePlanFields(plan, req.body || {}, crop, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "Failed to update crop plan" });
    }
  }
}

const PRODUCT_STATUS_ALIASES = {
  DRAFT: "Draft",
  Draft: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  "Pending Approval": "Pending Approval",
  Pending: "Pending Approval",
  ACTIVE: "Active",
  Active: "Active",
  Approved: "Active",
  REJECTED: "Rejected",
  Rejected: "Rejected",
  LOW_STOCK: "Low Stock",
  "Low Stock": "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  "Out of Stock": "Out of Stock",
  PAUSED: "Paused",
  Paused: "Paused",
  Inactive: "Paused",
};

const PRODUCT_UNITS_ALLOWED = ["Kg", "Quintal", "Ton"];
const LIFECYCLE_LOCKED = ["Draft", "Pending Approval", "Paused"];

function normalizeProductStatus(status) {
  return PRODUCT_STATUS_ALIASES[status] || status || "Draft";
}

function sanitizeProductImages(list, max = 4) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => typeof p === "string" && p.length > 20 && p.length < 2_500_000)
    .filter((p) => p.startsWith("data:image/") || p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/"))
    .slice(0, max);
}

function sanitizeProductVideos(list, max = 2) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => typeof p === "string" && p.length > 20 && p.length < 20_000_000)
    .filter((p) => p.startsWith("data:video/") || p.startsWith("http://") || p.startsWith("https://"))
    .slice(0, max);
}

function normalizeProductGrades(grades = []) {
  const source = Array.isArray(grades) && grades.length ? grades : [];
  return source.map((g, idx) => {
    const raw = String(g.grade || g.label || "").replace(/grade\s*/i, "").trim() || String.fromCharCode(65 + idx);
    const grade = raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || String.fromCharCode(65 + idx);
    return {
      id: g.id || `g-${grade.toLowerCase()}-${idx}`,
      grade,
      label: g.label || `Grade ${grade}`,
      quantity: Number(g.quantity) || 0,
      price: Number(g.price ?? g.pricePerKg ?? 0) || 0,
    };
  });
}

function totalGradeQty(grades) {
  return (grades || []).reduce((sum, g) => sum + Number(g.quantity || 0), 0);
}

function applyStockDrivenStatus(currentStatus, quantity, lowStockLimit) {
  const lifecycle = normalizeProductStatus(currentStatus);
  if (LIFECYCLE_LOCKED.includes(lifecycle)) return lifecycle;
  const qty = Number(quantity) || 0;
  const limit = Number(lowStockLimit) || 10;
  if (qty <= 0) return "Out of Stock";
  if (qty <= limit) return "Low Stock";
  return "Active";
}

function stockStatusOf(product) {
  const lifecycle = normalizeProductStatus(product.status);
  if (lifecycle === "Paused") return "Paused";
  const qty = Math.max(
    0,
    Number(product.availableQuantity ?? product.stock ?? 0) - Number(product.reservedQuantity || 0)
  );
  const limit = Number(product.lowStockLimit || 10);
  if (qty <= 0) return "Out of Stock";
  if (qty <= limit) return "Low Stock";
  return lifecycle === "Draft" || lifecycle === "Pending Approval" ? lifecycle : "Active";
}

function farmingTypeOf(product) {
  if (product.farmingType) return product.farmingType;
  if (product.produceType === "non-organic") return "Conventional";
  if (product.produceType === "organic") return "Organic";
  return "";
}

function publicMyProduct(product, farmer, crop) {
  const plain = toPlain(product);
  const grades = normalizeProductGrades(plain.grades);
  const quantity = grades.length ? totalGradeQty(grades) : Number(plain.availableQuantity ?? plain.stock ?? 0);
  const status = normalizeProductStatus(plain.status);
  const media = plain.media || {};
  const mainPhoto = media.mainPhoto || plain.image || plain.images?.[0] || "";
  return {
    ...plain,
    productId: plain.productId || plain.id,
    productName: plain.productName || plain.name,
    cropName: plain.cropName || crop?.cropName || "",
    categoryCode: categoryFromName(plain.cropName || crop?.cropName || ""),
    variety: plain.variety || crop?.variety || "",
    availableQuantity: quantity,
    stock: quantity,
    reservedQuantity: Number(plain.reservedQuantity || 0),
    sellableQuantity: Math.max(0, quantity - Number(plain.reservedQuantity || 0)),
    pricePerKg: Number(plain.pricePerKg || plain.sellingPrice || 0),
    sellingPrice: Number(plain.pricePerKg || plain.sellingPrice || 0),
    minimumOrderQuantity: Number(plain.minimumOrderQuantity || 1),
    farmingType: farmingTypeOf(plain),
    grades,
    media: {
      mainPhoto,
      farmPhotos: media.farmPhotos || [],
      cropPhotos: media.cropPhotos || [],
      harvestPhotos: media.harvestPhotos || [],
      videos: media.videos || [],
    },
    image: mainPhoto,
    images: [mainPhoto, ...(plain.images || [])].filter(Boolean),
    status,
    stockStatus: stockStatusOf({ ...plain, status, availableQuantity: quantity }),
    farmId: plain.farmId || farmer?.farm?.farmId || "",
    farmName: farmer?.farm?.farmName || farmer?.farmName || "",
    farmLocation: plain.farmLocation || farmer?.farmLocation || farmer?.farmGeo?.farmAddress || "",
    crop: crop
      ? {
          cropId: crop.cropId || crop.id,
          cropName: crop.cropName,
          variety: crop.variety,
          expectedHarvestDate: crop.expectedHarvestDate,
          estimatedQuantity: crop.estimatedQuantity,
          unit: crop.unit,
          farmingType: crop.farmingType,
          photos: crop.photos || [],
        }
      : null,
  };
}

async function loadOwnProduct(req, res) {
  const farmerId = authFarmerId(req);
  const productId = req.params.productId;
    const product = await FarmerProduct.findOne({
    farmerId,
    $or: [{ id: productId }, { productId }, { previousProductId: productId }],
  });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return null;
  }
  return product;
}

function parseProductMedia(payload, existing = {}) {
  const media = payload.media || {};
  const mainPhoto = sanitizeProductImages(
    [media.mainPhoto || payload.image || payload.imageUrl || existing.mainPhoto || ""].filter(Boolean),
    1
  )[0] || "";
  return {
    mainPhoto,
    farmPhotos: sanitizeProductImages(media.farmPhotos ?? existing.farmPhotos, 4),
    cropPhotos: sanitizeProductImages(media.cropPhotos ?? existing.cropPhotos, 4),
    harvestPhotos: sanitizeProductImages(media.harvestPhotos ?? existing.harvestPhotos, 4),
    videos: sanitizeProductVideos(media.videos ?? existing.videos, 2),
  };
}

function validateMyProductPayload(payload, { publish } = {}) {
  const productName = String(payload.productName || payload.name || "").trim();
  const cropId = String(payload.cropId || "").trim();
  const cropName = String(payload.cropName || payload.crop || "").trim();
  const variety = String(payload.variety || "").trim();
  const unit = PRODUCT_UNITS_ALLOWED.includes(payload.unit) ? payload.unit : "";
  const grades = normalizeProductGrades(payload.grades);
  const availableQuantity = grades.length ? totalGradeQty(grades) : Number(payload.availableQuantity);
  const gradePrice = Number(grades.find((g) => Number(g.price) > 0)?.price);
  const pricePerKg = Number(payload.pricePerKg ?? payload.sellingPrice) || (Number.isFinite(gradePrice) ? gradePrice : 0);
  const minimumOrderQuantity = Number(payload.minimumOrderQuantity);
  const harvestDate = String(payload.harvestDate || "").trim();
  const farmingType = String(payload.farmingType || "").trim();
  const availableFrom = String(payload.availableFrom || "").trim();
  const availableUntil = String(payload.availableUntil || "").trim();
  const media = parseProductMedia(payload);

  if (!productName) return { error: "Product name is required" };
  if (!cropId && !cropName) return { error: "Crop is required" };

  if (publish) {
    if (!variety) return { error: "Variety is required" };
    if (!Number.isFinite(availableQuantity) || availableQuantity <= 0) return { error: "Quantity must be greater than 0" };
    if (!unit) return { error: "Unit is required" };
    if (!harvestDate) return { error: "Harvest date is required" };
    if (!grades.length) return { error: "Add at least one grade" };
    if (!farmingType) return { error: "Farming type is required" };
    if (!availableFrom) return { error: "Available from date is required" };
    if (!availableUntil) return { error: "Available until date is required" };
    if (availableUntil && availableFrom && availableUntil < availableFrom) {
      return { error: "Available until cannot be before available from" };
    }
    if (!media.mainPhoto) return { error: "Main product photo is required" };
  }

  return {
    productName,
    cropId,
    cropName,
    variety,
    unit: unit || "Kg",
    grades,
    availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 0,
    pricePerKg: Number.isFinite(pricePerKg) ? pricePerKg : 0,
    minimumOrderQuantity: Number.isFinite(minimumOrderQuantity) && minimumOrderQuantity > 0 ? minimumOrderQuantity : 1,
    harvestDate,
    farmingType,
    availableFrom,
    availableUntil,
    media,
    lowStockLimit: Number(payload.lowStockLimit) > 0 ? Number(payload.lowStockLimit) : 10,
  };
}

function applyProductFields(product, parsed, farmer, crop) {
  product.productName = parsed.productName;
  product.name = parsed.productName;
  product.cropId = crop?.cropId || parsed.cropId || crop?.id || product.cropId || "";
  product.cropName = parsed.cropName || crop?.cropName || product.cropName || "";
  product.variety = parsed.variety || crop?.variety || product.variety || "";
  product.unit = parsed.unit;
  product.grades = parsed.grades;
  product.availableQuantity = parsed.availableQuantity;
  product.stock = parsed.availableQuantity;
  product.gradeAQty = Number(parsed.grades[0]?.quantity) || 0;
  product.gradeBQty = Number(parsed.grades[1]?.quantity) || 0;
  product.pricePerKg = parsed.pricePerKg;
  product.sellingPrice = parsed.pricePerKg;
  product.minimumOrderQuantity = parsed.minimumOrderQuantity;
  product.harvestDate = parsed.harvestDate;
  product.farmingType = parsed.farmingType;
  product.produceType = parsed.farmingType === "Conventional" ? "non-organic" : "organic";
  product.availableFrom = parsed.availableFrom;
  product.availableUntil = parsed.availableUntil;
  product.media = parsed.media;
  product.image = parsed.media.mainPhoto || "";
  product.images = [parsed.media.mainPhoto, ...(parsed.media.cropPhotos || [])].filter(Boolean);
  product.lowStockLimit = parsed.lowStockLimit;
  product.farmId = product.farmId || farmer?.farm?.farmId || `farm-${farmer?.id || ""}`;
  product.farmLocation = product.farmLocation || farmer?.farmLocation || farmer?.farmGeo?.farmAddress || "";
  product.markModified("grades");
  product.markModified("media");
}

export async function listMyProducts(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    const products = await FarmerProduct.find({ farmerId }).sort({ createdAt: -1 });
    const upgraded = [];
    for (const product of products) {
      upgraded.push(await upgradeFarmerProductId(product));
    }
    const cropIds = [...new Set(products.map((p) => p.cropId).filter(Boolean))];
    const crops = cropIds.length
      ? await FarmerCrop.find({ farmerId, $or: [{ id: { $in: cropIds } }, { cropId: { $in: cropIds } }] }).lean()
      : [];
    const cropMap = new Map(crops.map((c) => [c.id, c]));
    crops.forEach((c) => cropMap.set(c.cropId, c));
    res.json(upgraded.map((p) => publicMyProduct(p, farmer, cropMap.get(p.cropId))));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load products" });
  }
}

export async function getMyProduct(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const upgraded = await upgradeFarmerProductId(product);
    const farmer = await Farmer.findOne({ id: upgraded.farmerId });
    const crop = upgraded.cropId
      ? await FarmerCrop.findOne({ farmerId: upgraded.farmerId, $or: [{ id: upgraded.cropId }, { cropId: upgraded.cropId }] })
      : null;
    res.json(publicMyProduct(upgraded, farmer, crop));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load product" });
  }
}

export async function createMyProduct(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const publish = Boolean(req.body?.publish);
    const parsed = validateMyProductPayload(req.body || {}, { publish });
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    let crop = null;
    if (parsed.cropId) {
      crop = await FarmerCrop.findOne({ farmerId, $or: [{ id: parsed.cropId }, { cropId: parsed.cropId }] });
      if (!crop) return res.status(400).json({ message: "Selected crop was not found on your farm" });
      parsed.cropName = parsed.cropName || crop.cropName;
      parsed.variety = parsed.variety || crop.variety;
    }

    const { id, productId, cropBusinessId } = await resolveProductIdsFromCrop(
      farmer,
      crop,
      parsed.cropName,
      parsed.variety
    );
    if (cropBusinessId) parsed.cropId = cropBusinessId;
    else if (crop) parsed.cropId = crop.cropId || crop.id;

    const status = publish ? "Pending Approval" : "Draft";
    const product = new FarmerProduct({
      id,
      productId,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId,
      farmerId,
      sku: `FRM-${farmerId.slice(-4)}-${Date.now().toString().slice(-4)}`,
      status,
    });
    applyProductFields(product, parsed, farmer, crop);
    if (!publish) {
      product.status = "Draft";
    }
    await product.save();
    await upgradeFarmerProductId(product);
    await syncFarmerProductToErp(product, farmer, crop);
    res.status(201).json(publicMyProduct(product, farmer, crop));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
}

export async function createManagedFarmerProduct(req, res) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findOne(accessibleFarmerQuery(req, farmerId));
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const publish = Boolean(req.body?.publish);
    const parsed = validateMyProductPayload(req.body || {}, { publish });
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    let crop = null;
    if (parsed.cropId) {
      crop = await FarmerCrop.findOne({
        farmerId: farmer.id,
        $or: [{ id: parsed.cropId }, { cropId: parsed.cropId }],
      });
      if (!crop) return res.status(400).json({ message: "Selected crop was not found on this farm" });
      parsed.cropName = parsed.cropName || crop.cropName;
      parsed.variety = parsed.variety || crop.variety;
    }

    const { id, productId, cropBusinessId } = await resolveProductIdsFromCrop(
      farmer,
      crop,
      parsed.cropName,
      parsed.variety
    );
    if (cropBusinessId) parsed.cropId = cropBusinessId;
    else if (crop) parsed.cropId = crop.cropId || crop.id;

    const product = new FarmerProduct({
      id,
      productId,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId,
      farmerId: farmer.id,
      sku: `FRM-${String(farmer.id).slice(-4)}-${Date.now().toString().slice(-4)}`,
      status: "Draft",
    });
    applyProductFields(product, parsed, farmer, crop);
    if (publish) {
      product.status = applyStockDrivenStatus("Active", parsed.availableQuantity, parsed.lowStockLimit);
      product.reviewedBy = req.user?.name || req.user?.role || "";
      product.reviewedAt = new Date();
    } else {
      product.status = "Draft";
    }
    await product.save();
    await upgradeFarmerProductId(product);
    await syncFarmerProductToErp(product, farmer, crop);
    res.status(201).json(publicMyProduct(product, farmer, crop));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
}

export async function updateMyProduct(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const current = normalizeProductStatus(product.status);
    if (current === "Pending Approval") {
      return res.status(400).json({ message: "Product is pending approval and cannot be edited" });
    }

    const publish = Boolean(req.body?.publish);
    const parsed = validateMyProductPayload({ ...toPlain(product), ...(req.body || {}), media: req.body?.media || product.media }, { publish });
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const farmer = await Farmer.findOne({ id: product.farmerId });
    let crop = null;
    if (parsed.cropId) {
      crop = await FarmerCrop.findOne({ farmerId: product.farmerId, $or: [{ id: parsed.cropId }, { cropId: parsed.cropId }] });
      if (!crop) return res.status(400).json({ message: "Selected crop was not found on your farm" });
      crop = await ensureSharedCropBusinessId(crop);
      parsed.cropId = crop.cropId || crop.id;
    }

    applyProductFields(product, parsed, farmer, crop);
    if (publish) {
      product.status = "Pending Approval";
      product.rejectionReason = "";
    } else if (req.body?.status) {
      const next = normalizeProductStatus(req.body.status);
      if (next === "Pending Approval") {
        const published = validateMyProductPayload({ ...toPlain(product), ...parsed, media: parsed.media }, { publish: true });
        if (published.error) return res.status(400).json({ message: published.error });
        product.status = "Pending Approval";
      }
    } else if (!LIFECYCLE_LOCKED.includes(current)) {
      product.status = applyStockDrivenStatus(current, parsed.availableQuantity, parsed.lowStockLimit);
    }
    await product.save();
    res.json(publicMyProduct(product, farmer, crop));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
}

export async function deleteMyProduct(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const status = normalizeProductStatus(product.status);
    if (status !== "Draft" && status !== "Rejected") {
      return res.status(400).json({ message: "Only draft or rejected products can be deleted" });
    }
    await FarmerProduct.deleteOne({ id: product.id, farmerId: product.farmerId });
    await FarmerStockHistory.deleteMany({ productId: product.id, farmerId: product.farmerId });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete product" });
  }
}

export async function patchMyProductPrice(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const status = normalizeProductStatus(product.status);
    if (status === "Pending Approval") {
      return res.status(400).json({ message: "Price cannot be updated while pending approval" });
    }
    const pricePerKg = Number(req.body?.pricePerKg ?? req.body?.sellingPrice);
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      return res.status(400).json({ message: "Selling price must be greater than 0" });
    }
    const nextGrades = req.body?.grades
      ? normalizeProductGrades(req.body.grades).map((g, idx) => ({
          ...(product.grades[idx] ? toPlain(product.grades[idx]) : {}),
          ...g,
          quantity: Number(product.grades[idx]?.quantity ?? g.quantity) || 0,
        }))
      : normalizeProductGrades(product.grades).map((g) => ({
          ...g,
          price: Number(req.body?.grades?.find?.((x) => x.grade === g.grade)?.price ?? g.price) || 0,
        }));

    product.priceHistory = [
      ...(product.priceHistory || []),
      { pricePerKg: product.pricePerKg || product.sellingPrice || 0, grades: normalizeProductGrades(product.grades), at: new Date() },
    ].slice(-20);
    product.pricePerKg = pricePerKg;
    product.sellingPrice = pricePerKg;
    if (req.body?.grades) {
      product.grades = normalizeProductGrades(req.body.grades).map((g, idx) => ({
        ...g,
        quantity: Number(product.grades[idx]?.quantity ?? g.quantity) || 0,
      }));
      product.markModified("grades");
    } else if (product.grades?.length) {
      product.grades = product.grades.map((g) => {
        const row = toPlain(g);
        return { ...row, price: row.price || pricePerKg };
      });
      product.markModified("grades");
    }
    product.markModified("priceHistory");
    await product.save();
    const farmer = await Farmer.findOne({ id: product.farmerId });
    res.json(publicMyProduct(product, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update price" });
  }
}

export async function patchMyProductStock(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const status = normalizeProductStatus(product.status);
    if (status === "Pending Approval") {
      return res.status(400).json({ message: "Stock cannot be updated while pending approval" });
    }

    let grades = normalizeProductGrades(product.grades);
    if (Array.isArray(req.body?.grades) && req.body.grades.length) {
      grades = normalizeProductGrades(req.body.grades);
    } else if (req.body?.availableQuantity != null) {
      const qty = Number(req.body.availableQuantity);
      if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ message: "Available quantity cannot be negative" });
      if (grades.length) {
        grades[0].quantity = qty;
        grades = grades.map((g, idx) => (idx === 0 ? g : { ...g, quantity: 0 }));
      } else {
        grades = [{ id: "g-a", grade: "A", label: "Grade A", quantity: qty, price: product.pricePerKg || 0 }];
      }
    }
    if (grades.some((g) => g.quantity < 0)) {
      return res.status(400).json({ message: "Grade quantity cannot be negative" });
    }

    const previous = Number(product.availableQuantity || product.stock || 0);
    const nextQty = totalGradeQty(grades);
    product.grades = grades;
    product.availableQuantity = nextQty;
    product.stock = nextQty;
    product.gradeAQty = Number(grades[0]?.quantity) || 0;
    product.gradeBQty = Number(grades[1]?.quantity) || 0;
    if (req.body?.lowStockLimit != null) {
      const limit = Number(req.body.lowStockLimit);
      if (!Number.isFinite(limit) || limit < 0) return res.status(400).json({ message: "Low stock threshold cannot be negative" });
      product.lowStockLimit = limit;
    }
    if (req.body?.availableFrom) product.availableFrom = String(req.body.availableFrom);
    if (req.body?.availableUntil) product.availableUntil = String(req.body.availableUntil);
    if (req.body?.minimumOrderQuantity != null) {
      const moq = Number(req.body.minimumOrderQuantity);
      if (!Number.isFinite(moq) || moq <= 0) return res.status(400).json({ message: "Minimum order quantity must be greater than 0" });
      product.minimumOrderQuantity = moq;
    }
    product.status = applyStockDrivenStatus(status, nextQty, product.lowStockLimit);
    product.markModified("grades");
    await product.save();

    if (previous !== nextQty) {
      await FarmerStockHistory.create({
        id: `sh-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
        vendorId: product.vendorId,
        managerId: product.managerId,
        farmerId: product.farmerId,
        productId: product.id,
        productName: product.name,
        grade: "All Grades",
        action: nextQty > previous ? "Stock Added" : "Stock Reduced",
        previousStock: previous,
        changedQuantity: nextQty - previous,
        newStock: nextQty,
        reason: "Manual Update",
        updatedBy: "Farmer",
        reference: "STOCK",
      });
    }

    const farmer = await Farmer.findOne({ id: product.farmerId });
    res.json(publicMyProduct(product, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update stock" });
  }
}

export async function patchMyProductStatus(req, res) {
  try {
    const product = await loadOwnProduct(req, res);
    if (!product) return;
    const current = normalizeProductStatus(product.status);
    const next = normalizeProductStatus(req.body?.status);
    const allowed = {
      Draft: ["Draft", "Pending Approval"],
      Rejected: ["Rejected", "Draft", "Pending Approval"],
      "Pending Approval": ["Pending Approval"],
      Active: ["Active", "Paused"],
      "Low Stock": ["Low Stock", "Paused", "Active"],
      "Out of Stock": ["Out of Stock", "Paused"],
      Paused: ["Paused", "Active"],
    };
    if (!(allowed[current] || []).includes(next)) {
      return res.status(400).json({ message: `Cannot change status from ${current} to ${next}` });
    }
    if (next === "Pending Approval") {
      const parsed = validateMyProductPayload({ ...toPlain(product), media: product.media }, { publish: true });
      if (parsed.error) return res.status(400).json({ message: parsed.error });
      product.rejectionReason = "";
    }
    if (next === "Active") {
      product.status = applyStockDrivenStatus("Active", product.availableQuantity, product.lowStockLimit);
    } else {
      product.status = next;
    }
    await product.save();
    const farmer = await Farmer.findOne({ id: product.farmerId });
    res.json(publicMyProduct(product, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update status" });
  }
}

async function resolveFarmerIdentity(farmerId) {
  const farmer = await Farmer.findOne({
    $or: [{ id: farmerId }, { farmerId }],
  }).lean();
  const ids = [...new Set([farmerId, farmer?.id, farmer?.farmerId].filter(Boolean))];
  return { farmer, ids };
}

function productSellable(product) {
  const physical = Number(product?.availableQuantity ?? product?.stock ?? 0);
  const reserved = Number(product?.reservedQuantity || 0);
  return Math.max(0, physical - reserved);
}

function flattenOrderFields(order) {
  const plain = toPlain(order);
  const first = plain.products?.[0] || {};
  const orderedQuantity = Number(plain.orderedQuantity || plain.totalQuantity || first.quantity || 0);
  const price = Number(plain.price || first.price || 0);
  const orderValue = Number(plain.orderValue || first.total || plain.totalAmount || plain.amount || orderedQuantity * price);
  return {
    productId: plain.productId || first.id || first.productId || "",
    productName: plain.productName || first.name || "",
    variety: plain.variety || "",
    grade: plain.grade || first.grade || "",
    orderedQuantity,
    unit: plain.unit || first.unit || "Kg",
    price,
    orderValue,
  };
}

function publicMyOrder(order, extra = {}) {
  const plain = toPlain(order);
  const flat = flattenOrderFields(plain);
  const status = normalizeOrderStatus(plain.status);
  return {
    ...plain,
    ...flat,
    orderId: plain.orderId || plain.id,
    status,
    customerName: plain.customer?.name || "Customer",
    customerDeliveryArea: plain.customerDeliveryArea || plain.customer?.address || "",
    requiredDate: plain.requiredDate || plain.harvestDate || "",
    pickupDate: plain.pickupDate || "",
    collectionCentre: plain.collectionCentre || "",
    reservedQuantity: Number(plain.reservedQuantity || 0),
    packedQuantity: Number(plain.packedQuantity || 0),
    preparationStatus: plain.preparationStatus || (status === "NEW" ? "NOT_STARTED" : status === "READY_FOR_PICKUP" ? "READY_FOR_PICKUP" : status === "PACKING" ? "PACKING" : status === "PREPARING" || status === "ACCEPTED" ? "PREPARING" : "NOT_STARTED"),
    packingDetails: plain.packingDetails || {},
    qrPayload: extra.qrPayload || extra.pickup?.qrPayload || "",
    ...extra,
  };
}

async function loadOwnOrder(req, res) {
  const farmerId = authFarmerId(req);
  const orderId = req.params.orderId;
  const { ids } = await resolveFarmerIdentity(farmerId);
  const order = await FarmerOrder.findOne({
    farmerId: { $in: ids },
    $or: [{ id: orderId }, { orderId }],
  });
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return null;
  }
  return order;
}

function pushOrderTimeline(order, status, note) {
  order.timeline = [...(order.timeline || []), { status, at: new Date(), note }];
}

async function syncLinkedHarvestOrder(order, patch) {
  const ids = [...new Set([order.id, order.orderId].filter(Boolean))];
  if (!ids.length) return;
  await FarmerHarvestOrder.updateMany({ id: { $in: ids } }, { $set: patch });
}

async function emitOrderStatusUpdate(order, extra = {}) {
  try {
    const io = getIO();
    const plain = toPlain(order) || order;
    const farmer = await Farmer.findOne({
      $or: [{ id: plain.farmerId }, { farmerId: plain.farmerId }],
    })
      .select("id farmerId managerId vendorId")
      .lean();
    const payload = {
      orderId: plain.id || plain.orderId,
      farmerId: plain.farmerId,
      vendorId: plain.vendorId || farmer?.vendorId || "",
      managerId: farmer?.managerId || "",
      status: normalizeOrderStatus(plain.status),
      rejectionReason: plain.rejectionReason || "",
      rejectionNote: plain.rejectionNote || "",
      rejectedBy: plain.rejectedBy || "",
      ...extra,
    };
    const rooms = new Set();
    [plain.farmerId, farmer?.id, farmer?.farmerId]
      .filter(Boolean)
      .forEach((id) => rooms.add(`farmer_${id}`));
    if (payload.managerId) rooms.add(`manager_${payload.managerId}`);
    if (payload.vendorId) rooms.add(`vendor_${payload.vendorId}`);
    rooms.forEach((room) => io.to(room).emit("order_updated", payload));
  } catch {
    // Socket is optional; panels poll as fallback.
  }
}

async function persistOrderStatusSideEffects(order, extra = {}) {
  await syncLinkedHarvestOrder(order, {
    status: normalizeOrderStatus(order.status),
    rejectionReason: order.rejectionReason || "",
  });
  await emitOrderStatusUpdate(order, extra);
}

async function loadOrderProduct(order) {
  const flat = flattenOrderFields(order);
  if (!flat.productId) return null;
  return FarmerProduct.findOne({
    farmerId: order.farmerId,
    $or: [{ id: flat.productId }, { productId: flat.productId }],
  });
}

async function enrichOwnOrder(order, farmer) {
  const product = await loadOrderProduct(order);
  const sellable = productSellable(product);
  const pickup = await Pickup.findOne({
    $or: [{ orderId: order.id }, { orderId: order.orderId }],
  }).lean();
  return publicMyOrder(order, {
    farmerName: farmer?.name || "",
    harvestDate: order.harvestDate || product?.harvestDate || "",
    availableStock: sellable,
    productStock: product
      ? {
          productId: product.id,
          productName: product.productName || product.name,
          availableQuantity: Number(product.availableQuantity ?? product.stock ?? 0),
          reservedQuantity: Number(product.reservedQuantity || 0),
          sellableQuantity: sellable,
          unit: product.unit || "Kg",
        }
      : null,
    pickup: pickup
      ? {
          pickupId: pickup.pickupId || pickup.id,
          status: pickup.status,
          driverStatus: pickup.driverStatus || pickup.status || "",
          liveStatus:
            {
              DRIVER_ASSIGNED: "Assigned — waiting to leave",
              PICKUP_SCHEDULED: "Assigned — waiting to leave",
              DISPATCHED: "On the way to farm",
              DRIVER_ARRIVED: "Reached the farm",
              ORDER_VERIFIED: "Checking the order",
              QR_VERIFIED: "QR verified — confirm pickup",
              PICKED_UP: "Pickup confirmed",
              IN_TRANSIT: "On the way to collection centre",
              COLLECTION_CENTRE_RECEIVED: "Delivered at collection centre",
              RECEIVED_AT_COLLECTION_CENTRE: "Delivered at collection centre",
            }[pickup.status] || String(pickup.status || "").replace(/_/g, " "),
          driverId: pickup.driverId || "",
          driverName: pickup.driverName || "",
          driverMobile: pickup.driverMobile || "",
          vehicleNumber: pickup.vehicleNumber || "",
          pickupDate: pickup.pickupDate || pickup.scheduledDate || "",
          pickupTime: pickup.pickupTime || pickup.scheduledTime || "",
          pickupLocation: pickup.pickupLocation || "",
          packageCount: pickup.packageCount || 0,
          packedQuantity: pickup.packedQuantity || 0,
          collectionCentreId: pickup.collectionCentreId || "",
          pickupConfirmed: Boolean(pickup.pickupConfirmed),
          assignedAt: pickup.assignedAt || null,
          dispatchStartedAt: pickup.dispatchStartedAt || pickup.startedAt || null,
          arrivedAt: pickup.arrivedAt || null,
          orderVerifiedAt: pickup.orderVerifiedAt || null,
          qrVerifiedAt: pickup.qrVerifiedAt || null,
          pickupConfirmedAt: pickup.pickupConfirmedAt || null,
          pickupInstructions: pickup.pickupInstructions || "",
          qrPayload: pickup.qrPayload || "",
          timeline: pickup.timeline || [],
          confirmationPhotos: pickup.confirmationPhotos || [],
        }
      : null,
    qrPayload: pickup?.qrPayload || "",
  });
}

export async function listMyOrders(req, res) {
  try {
    const farmerId = authFarmerId(req);
    const filter = String(req.query.filter || "").toLowerCase();
    const q = String(req.query.q || "").trim().toLowerCase();
    const { farmer, ids } = await resolveFarmerIdentity(farmerId);
    const orders = await FarmerOrder.find({ farmerId: { $in: ids } }).sort({ createdAt: -1, orderDate: -1 });
    let rows = [];
    for (const order of orders) {
      const status = normalizeOrderStatus(order.status);
      if (filter && ORDER_FILTERS[filter] && !ORDER_FILTERS[filter].includes(status)) continue;
      const row = await enrichOwnOrder(order, farmer);
      if (q) {
        const hay = `${row.orderId} ${row.productName} ${row.customerName} ${row.variety}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push(row);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load orders" });
  }
}

export async function getMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const farmer = await Farmer.findOne({ id: order.farmerId });
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load order" });
  }
}

export async function acceptMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const current = normalizeOrderStatus(order.status);
    if (current !== "NEW") {
      return res.status(400).json({ message: "Only new orders can be accepted" });
    }

    const flat = flattenOrderFields(order);
    const qty = Number(flat.orderedQuantity || 0);
    if (!(qty > 0)) return res.status(400).json({ message: "Ordered quantity is invalid" });

    const product = await loadOrderProduct(order);
    if (!product) {
      return res.status(400).json({ message: "Ordered product was not found on your farm" });
    }

    const gradeTotal = (product.grades || []).reduce((sum, g) => sum + Number(g.quantity || 0), 0);
    const physical = Math.max(Number(product.availableQuantity || 0), Number(product.stock || 0), gradeTotal);
    if (physical !== Number(product.availableQuantity || 0)) {
      product.availableQuantity = physical;
      product.stock = physical;
      await product.save();
    }

    const updated = await FarmerProduct.findOneAndUpdate(
      {
        _id: product._id,
        farmerId: order.farmerId,
        $expr: {
          $gte: [
            { $subtract: [{ $ifNull: ["$availableQuantity", 0] }, { $ifNull: ["$reservedQuantity", 0] }] },
            qty,
          ],
        },
      },
      { $inc: { reservedQuantity: qty } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ message: "Insufficient available stock for this order." });
    }

    try {
      order.status = "PREPARING";
      order.reservedQuantity = qty;
      order.productId = flat.productId || product.id;
      order.productName = flat.productName || product.productName || product.name;
      order.variety = order.variety || product.variety || "";
      order.grade = flat.grade;
      order.orderedQuantity = qty;
      order.price = flat.price;
      order.orderValue = flat.orderValue;
      order.unit = flat.unit;
      order.acceptedAt = new Date();
      order.preparationStatus = "PREPARING";
      order.preparedAt = new Date();
      if (!order.qrToken) order.qrToken = crypto.randomBytes(12).toString("hex");
      pushOrderTimeline(order, "ACCEPTED", "Order accepted. Stock reserved.");
      pushOrderTimeline(order, "PREPARING", "Preparation started.");
      await order.save();
    } catch (saveErr) {
      await FarmerProduct.updateOne({ _id: product._id }, { $inc: { reservedQuantity: -qty } });
      throw saveErr;
    }

    await persistOrderStatusSideEffects(order, { event: "ACCEPTED" });
    const farmer = await Farmer.findOne({ id: order.farmerId });
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to accept order" });
  }
}

export async function rejectMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const current = normalizeOrderStatus(order.status);
    if (current !== "NEW") {
      return res.status(400).json({ message: "Only new orders can be rejected" });
    }
    const reason = String(req.body?.rejectionReason || "").trim();
    const note = String(req.body?.rejectionNote || "").trim();
    if (!REJECTION_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Select a valid rejection reason" });
    }
    if (reason === "Other" && !note) {
      return res.status(400).json({ message: "Enter the other rejection reason" });
    }

    order.status = "REJECTED";
    order.rejectionReason = reason;
    order.rejectionNote = note;
    order.rejectedBy = "FARMER";
    order.rejectedAt = new Date();
    order.deliveryStatus = "Cancelled";
    pushOrderTimeline(order, "REJECTED", `${reason}${note ? ` — ${note}` : ""}`);
    await order.save();

    await persistOrderStatusSideEffects(order, { event: "REJECTED" });
    const farmer = await Farmer.findOne({ id: order.farmerId });
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to reject order" });
  }
}

export async function prepareMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const current = normalizeOrderStatus(order.status);
    if (!["ACCEPTED", "PREPARING", "PACKING"].includes(current)) {
      return res.status(400).json({ message: "Order must be accepted before preparation" });
    }
    order.status = "PREPARING";
    order.preparationStatus = "PREPARING";
    order.preparedAt = order.preparedAt || new Date();
    if (req.body?.packedQuantity != null) {
      const packed = Number(req.body.packedQuantity);
      const cap = Number(order.reservedQuantity || flattenOrderFields(order).orderedQuantity || 0);
      if (!Number.isFinite(packed) || packed < 0) {
        return res.status(400).json({ message: "Packed quantity cannot be negative" });
      }
      if (packed > cap) {
        return res.status(400).json({ message: "Packed quantity cannot exceed the reserved quantity" });
      }
      order.packedQuantity = packed;
    }
    pushOrderTimeline(order, "PREPARING", req.body?.note || "Preparation updated.");
    await order.save();
    const farmer = await Farmer.findOne({ id: order.farmerId });
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update preparation" });
  }
}

export async function packMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const current = normalizeOrderStatus(order.status);
    if (!["ACCEPTED", "PREPARING", "PACKING"].includes(current)) {
      return res.status(400).json({ message: "Packing can be added after the order is accepted" });
    }
    const packedQuantity = Number(req.body?.packedQuantity ?? order.packedQuantity ?? 0);
    const cap = Number(order.reservedQuantity || flattenOrderFields(order).orderedQuantity || 0);
    if (!Number.isFinite(packedQuantity) || packedQuantity < 0) {
      return res.status(400).json({ message: "Packed quantity cannot be negative" });
    }
    if (packedQuantity > cap) {
      return res.status(400).json({ message: "Packed quantity cannot exceed the reserved quantity" });
    }
    const details = req.body?.packingDetails || req.body || {};
    order.packedQuantity = packedQuantity;
    order.packingDetails = {
      packageCount: Number(details.packageCount || 0),
      packageType: String(details.packageType || "").trim(),
      packageWeight: Number(details.packageWeight || 0),
      packingDate: String(details.packingDate || "").trim(),
      notes: String(details.notes || details.packingNotes || "").trim(),
    };
    order.status = "PACKING";
    order.preparationStatus = "PACKING";
    order.markModified("packingDetails");
    pushOrderTimeline(order, "PACKING", "Packing details saved.");
    await order.save();
    const farmer = await Farmer.findOne({ id: order.farmerId });
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save packing details" });
  }
}

export async function readyMyOrder(req, res) {
  try {
    const order = await loadOwnOrder(req, res);
    if (!order) return;
    const current = normalizeOrderStatus(order.status);
    if (!["PREPARING", "PACKING", "ACCEPTED"].includes(current)) {
      return res.status(400).json({ message: "Order must be in preparation before marking ready for pickup" });
    }
    const packed = Number(order.packedQuantity || req.body?.packedQuantity || 0);
    const cap = Number(order.reservedQuantity || flattenOrderFields(order).orderedQuantity || 0);
    if (!(packed > 0)) {
      return res.status(400).json({ message: "Add packing details and packed quantity before marking ready" });
    }
    if (packed > cap) {
      return res.status(400).json({ message: "Packed quantity cannot exceed the reserved quantity" });
    }
    order.status = "READY_FOR_PICKUP";
    order.preparationStatus = "READY_FOR_PICKUP";
    order.readyForPickupAt = new Date();
    pushOrderTimeline(order, "READY_FOR_PICKUP", "Order marked ready for pickup.");
    await order.save();
    const farmer = await Farmer.findOne({ id: order.farmerId });
    await ensurePickupForOrder(order, farmer);
    res.json(await enrichOwnOrder(order, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark order ready for pickup" });
  }
}

export async function updateFarmerPassword(req, res) {
  try {
    const { farmerId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
    }
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    farmer.password = await bcrypt.hash(newPassword, 10);
    await farmer.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update password" });
  }
}

export async function updateFarmerLoginStatus(req, res) {
  try {
    const { farmerId } = req.params;
    const { loginEnabled } = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    farmer.loginEnabled = Boolean(loginEnabled);
    await farmer.save();

    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update login status" });
  }
}

export async function getFarmerDashboard(req, res) {
  try {
    const { farmerId } = req.params;
    const [productAgg, orderAgg, earningAgg, recentOrders, lowStockProducts, recentEarnings] = await Promise.all([
      FarmerProduct.aggregate([
        { $match: { farmerId } },
        { $group: { _id: null, totalProducts: { $sum: 1 }, availableStock: { $sum: { $ifNull: ["$stock", 0] } } } },
      ]),
      FarmerOrder.aggregate([
        { $match: { farmerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "NEW", "Confirmed", "Approved", "Processing"]] }, 1, 0] } },
            completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          },
        },
      ]),
      FarmerEarning.aggregate([
        { $match: { farmerId } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $ifNull: ["$netEarnings", 0] } },
            pendingEarnings: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, { $ifNull: ["$netEarnings", 0] }, 0] } },
          },
        },
      ]),
      FarmerOrder.find({ farmerId }).sort({ orderDate: -1 }).limit(5).lean(),
      FarmerProduct.find({ farmerId })
        .select("id name stock lowStockLimit grades unit")
        .lean()
        .then((rows) => rows.filter((p) => Number(p.stock || 0) <= Number(p.lowStockLimit || 10))),
      FarmerEarning.find({ farmerId }).sort({ date: -1 }).limit(5).lean(),
    ]);

    const p = productAgg[0] || { totalProducts: 0, availableStock: 0 };
    const o = orderAgg[0] || { totalOrders: 0, pendingOrders: 0, completedOrders: 0 };
    const e = earningAgg[0] || { totalEarnings: 0, pendingEarnings: 0 };

    res.json({
      totalProducts: p.totalProducts,
      availableStock: p.availableStock,
      totalInventory: p.availableStock,
      totalOrders: o.totalOrders,
      pendingOrders: o.pendingOrders,
      completedOrders: o.completedOrders,
      totalEarnings: e.totalEarnings,
      pendingEarnings: e.pendingEarnings,
      recentOrders,
      lowStockProducts,
      recentEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch dashboard" });
  }
}

// ----------------------------------------------------
// PRODUCT CONTROLLERS
// ----------------------------------------------------
export async function getFarmerProducts(req, res) {
  try {
    const { farmerId } = req.params;
    const products = await FarmerProduct.find({ farmerId }).select("-images").sort({ createdAt: -1 });
    const upgraded = [];
    for (const product of products) {
      upgraded.push(await upgradeFarmerProductId(product));
    }
    res.json(upgraded.map((p) => enrichProductRow(toPlain(p))));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
}

export async function getFarmerProductById(req, res) {
  try {
    const { farmerId, productId } = req.params;
    const product = await FarmerProduct.findOne({
      farmerId,
      $or: [{ id: productId }, { productId }, { previousProductId: productId }],
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(await upgradeFarmerProductId(product));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch product" });
  }
}

async function loadAccessibleFarmerProduct(req, res) {
  const { farmerId, productId } = req.params;
  const farmer = await Farmer.findOne(accessibleFarmerQuery(req, farmerId));
  if (!farmer) {
    res.status(404).json({ message: "Farmer not found" });
    return null;
  }
  const product = await FarmerProduct.findOne({
    farmerId,
    $or: [{ id: productId }, { productId }, { previousProductId: productId }],
  });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return null;
  }
  return { farmer, product };
}

export async function reviewFarmerProduct(req, res) {
  try {
    const loaded = await loadAccessibleFarmerProduct(req, res);
    if (!loaded) return;
    const { farmer, product } = loaded;
    const current = normalizeProductStatus(product.status);
    if (current !== "Pending Approval") {
      return res.status(400).json({ message: "Only pending products can be reviewed" });
    }

    const decision = String(req.body?.decision || req.body?.status || "").trim().toLowerCase();
    const reviewer = req.user?.name || req.user?.role || "";
    if (["approved", "approve", "active"].includes(decision)) {
      const qty = Number(product.availableQuantity ?? product.stock ?? 0);
      product.status = applyStockDrivenStatus("Active", qty, product.lowStockLimit);
      product.rejectionReason = "";
      product.reviewedBy = reviewer;
      product.reviewedAt = new Date();
    } else if (["rejected", "reject"].includes(decision)) {
      product.status = "Rejected";
      product.rejectionReason = String(req.body?.reason || req.body?.rejectionReason || "").trim();
      product.reviewedBy = reviewer;
      product.reviewedAt = new Date();
    } else {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }

    await product.save();
    res.json(publicMyProduct(product, farmer));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to review product" });
  }
}

export async function createFarmerProduct(req, res) {
  try {
    const { farmerId } = req.params;
    const payload = req.body;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const grades = (payload.grades || []).map((g, idx) => ({
      id: g.id || `g-${String.fromCharCode(97 + idx)}`,
      label: g.label || `Grade ${String.fromCharCode(65 + idx)}`,
      quantity: Number(g.quantity) || 0,
    }));

    if (!grades.length) {
      grades.push(
        { id: "g-a", label: "Grade A", quantity: Number(payload.gradeAQty) || 0 },
        { id: "g-b", label: "Grade B", quantity: Number(payload.gradeBQty) || 0 }
      );
    }

    const totalStock = grades.reduce((s, g) => s + Number(g.quantity || 0), 0);
    const cropName = payload.cropName || payload.name || "";
    const id = await generateId({
      module: "ART",
      category: categoryFromName(cropName),
      crop: cropCodeFromName(cropName),
      variety: varietyCodeFromName(payload.variety),
    });

    const product = new FarmerProduct({
      id,
      productId: id,
      vendorId: farmer.vendorId,
      managerId: farmer.managerId,
      farmerId,
      sku: payload.sku || `FRM-${farmerId.slice(-4)}-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      category: payload.category || "Vegetables",
      subCategory: payload.subCategory || "Fresh Produce",
      description: payload.description || "",
      image: payload.image || payload.imageUrl || "",
      images: payload.images?.length ? payload.images : [payload.image || payload.imageUrl || ""],
      unit: payload.unit || "Kg",
      harvestDate: payload.harvestDate || new Date().toISOString().split("T")[0],
      produceType: payload.produceType || "organic",
      farmLocation: payload.farmLocation || farmer.farmLocation || "",
      cropId: payload.cropId || "",
      cropName,
      variety: payload.variety || "",
      status: payload.status || "Approved",
      sellingPrice: Number(payload.sellingPrice) || 0,
      mrp: Number(payload.mrp) || 0,
      lowStockLimit: Number(payload.lowStockLimit) || 10,
      stock: totalStock,
      availableQuantity: totalStock,
      gradeAQty: Number(grades[0]?.quantity) || 0,
      gradeBQty: Number(grades[1]?.quantity) || 0,
      grades,
    });

    await product.save();
    await syncFarmerProductToErp(product, farmer, null);

    // Log stock history for created product
    for (const g of grades) {
      if (g.quantity > 0) {
        await FarmerStockHistory.create({
          id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          vendorId: farmer.vendorId,
          managerId: farmer.managerId,
          farmerId,
          productId: product.id,
          productName: product.name,
          grade: g.label,
          action: "Stock Added",
          previousStock: 0,
          changedQuantity: g.quantity,
          newStock: g.quantity,
          reason: "Initial Harvest",
          updatedBy: "Farmer",
          reference: "HARV-NEW",
        });
      }
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
}

export async function updateFarmerProduct(req, res) {
  try {
    const { farmerId, productId } = req.params;
    const payload = req.body;

    const product = await FarmerProduct.findOne({
      farmerId,
      $or: [{ id: productId }, { productId }, { previousProductId: productId }],
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (payload.name) product.name = payload.name;
    if (payload.category) product.category = payload.category;
    if (payload.subCategory) product.subCategory = payload.subCategory;
    if (payload.description !== undefined) product.description = payload.description;
    if (payload.image !== undefined) product.image = payload.image;
    if (payload.images) product.images = payload.images;
    if (payload.unit) product.unit = payload.unit;
    if (payload.sellingPrice !== undefined) product.sellingPrice = Number(payload.sellingPrice);
    if (payload.mrp !== undefined) product.mrp = Number(payload.mrp);
    if (payload.lowStockLimit !== undefined) product.lowStockLimit = Number(payload.lowStockLimit);
    if (payload.status) product.status = payload.status;

    if (payload.grades) {
      const prevGrades = product.grades || [];
      const nextGrades = payload.grades.map((g, idx) => ({
        id: g.id || prevGrades[idx]?.id || `g-${String.fromCharCode(97 + idx)}`,
        label: g.label || prevGrades[idx]?.label || `Grade ${String.fromCharCode(65 + idx)}`,
        quantity: Number(g.quantity) || 0,
      }));

      // Check differences for history
      for (let i = 0; i < nextGrades.length; i++) {
        const prevQty = Number(prevGrades[i]?.quantity) || 0;
        const nextQty = Number(nextGrades[i]?.quantity) || 0;
        if (prevQty !== nextQty) {
          const diff = nextQty - prevQty;
          await FarmerStockHistory.create({
            id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            vendorId: product.vendorId,
            managerId: product.managerId,
            farmerId,
            productId: product.id,
            productName: product.name,
            grade: nextGrades[i].label,
            action: diff > 0 ? "Stock Added" : "Stock Reduced",
            previousStock: prevQty,
            changedQuantity: diff,
            newStock: nextQty,
            reason: "Manual Update",
            updatedBy: "Farmer",
            reference: "EDIT",
          });
        }
      }

      product.grades = nextGrades;
      const totalStock = nextGrades.reduce((s, g) => s + Number(g.quantity || 0), 0);
      product.stock = totalStock;
      product.availableQuantity = totalStock;
      product.gradeAQty = Number(nextGrades[0]?.quantity) || 0;
      product.gradeBQty = Number(nextGrades[1]?.quantity) || 0;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
}

export async function deleteFarmerProduct(req, res) {
  try {
    const { farmerId, productId } = req.params;
    await FarmerProduct.deleteOne({ id: productId, farmerId });
    await FarmerStockHistory.deleteMany({ productId });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete product" });
  }
}

// ----------------------------------------------------
// INVENTORY & STOCK CONTROLLERS
// ----------------------------------------------------
export async function getFarmerInventory(req, res) {
  try {
    const { farmerId } = req.params;
    const products = await FarmerProduct.find({ farmerId }).select("-images -description").lean();
    const inventoryList = [];

    products.forEach((p) => {
      const grades = p.grades && p.grades.length ? p.grades : [{ id: "g-a", label: "Grade A", quantity: p.stock || 0 }];
      grades.forEach((g) => {
        const qty = Number(g.quantity || 0);
        const reserved = Math.round(qty * 0.1);
        const sold = Math.round(qty * 0.3);
        inventoryList.push({
          id: `inv-${p.id}-${g.id}`,
          vendorId: p.vendorId,
          managerId: p.managerId,
          farmerId: p.farmerId,
          productId: p.id,
          productName: p.name,
          gradeId: g.id,
          grade: g.label,
          unit: p.unit || "Kg",
          currentStock: qty,
          reservedStock: reserved,
          soldStock: sold,
          totalStock: qty + reserved + sold,
          status: qty <= 0 ? "Out of Stock" : qty < (p.lowStockLimit || 20) ? "Low Stock" : "In Stock",
          lastUpdated: p.updatedAt,
        });
      });
    });

    res.json(inventoryList);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch inventory" });
  }
}

export async function adjustFarmerStock(req, res) {
  try {
    const { farmerId } = req.params;
    const { productId, gradeId, change, grade, updatedBy = "Vendor", reason = "Manual Update", reference = "—" } = req.body;

    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const delta = Number(change) || 0;
    if (!delta) return res.status(400).json({ message: "Enter a valid non-zero quantity to adjust" });

    let grades = product.grades && product.grades.length ? [...product.grades] : [
      { id: "g-a", label: "Grade A", quantity: product.gradeAQty || 0 },
      { id: "g-b", label: "Grade B", quantity: product.gradeBQty || 0 },
    ];

    let gIdx = grades.findIndex((g) => g.id === gradeId || g.label === gradeId || g.label === grade);
    if (gIdx < 0) {
      const targetLabel = grade || "Grade A";
      grades.push({ id: `g-${Date.now()}`, label: targetLabel, quantity: 0 });
      gIdx = grades.length - 1;
    }

    const prevStock = Number(grades[gIdx].quantity) || 0;
    const nextStock = Math.max(0, prevStock + delta);
    const appliedChange = nextStock - prevStock;

    if (appliedChange === 0 && delta < 0) {
      return res.status(400).json({ message: "Not enough available stock to remove" });
    }

    grades[gIdx].quantity = nextStock;
    product.grades = grades;

    const totalStock = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
    product.stock = totalStock;
    product.availableQuantity = totalStock;
    product.gradeAQty = Number(grades[0]?.quantity) || 0;
    product.gradeBQty = Number(grades[1]?.quantity) || 0;
    if (totalStock <= 0) product.status = "Out of Stock";

    await product.save();

    const historyEntry = new FarmerStockHistory({
      id: `sh-${Date.now()}`,
      vendorId: product.vendorId,
      managerId: product.managerId,
      farmerId,
      productId,
      productName: product.name,
      grade: grades[gIdx].label,
      action: appliedChange >= 0 ? "Stock Added" : "Stock Reduced",
      previousStock: prevStock,
      changedQuantity: appliedChange,
      newStock: nextStock,
      reason,
      updatedBy,
      reference,
      at: new Date(),
    });

    await historyEntry.save();

    res.json({ product, history: historyEntry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to adjust stock" });
  }
}

export async function getStockHistory(req, res) {
  try {
    const { farmerId } = req.params;
    const { productId } = req.query;

    const query = { farmerId };
    if (productId) query.productId = productId;

    const history = await FarmerStockHistory.find(query).sort({ at: -1 }).lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch stock history" });
  }
}

export async function updateFarmerInventoryItem(req, res) {
  try {
    const { farmerId, inventoryId } = req.params;
    const { currentStock, reservedStock, soldStock, gradeId, productId } = req.body;

    if (productId) {
      const product = await FarmerProduct.findOne({ id: productId, farmerId });
      if (product && currentStock !== undefined) {
        const gIdx = product.grades.findIndex((g) => g.id === gradeId);
        if (gIdx >= 0) {
          product.grades[gIdx].quantity = Number(currentStock);
          const total = product.grades.reduce((s, g) => s + Number(g.quantity || 0), 0);
          product.stock = total;
          product.availableQuantity = total;
          await product.save();
        }
      }
    }

    res.json({ success: true, id: inventoryId, currentStock, reservedStock, soldStock });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update inventory item" });
  }
}

// ----------------------------------------------------
// ORDER CONTROLLERS
// ----------------------------------------------------
export async function getFarmerOrders(req, res) {
  try {
    const { farmerId } = req.params;
    const { status, q } = req.query;
    const { ids } = await resolveFarmerIdentity(farmerId);
    const query = { farmerId: { $in: ids.length ? ids : [farmerId] } };
    if (status) {
      const wanted = normalizeOrderStatus(status);
      query.status = { $in: [...new Set([status, wanted])] };
    }

    let orders = await FarmerOrder.find(query).sort({ orderDate: -1 }).lean();
    if (q) {
      const needle = q.toLowerCase();
      orders = orders.filter(
        (o) =>
          String(o.id || "").toLowerCase().includes(needle) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(needle))
      );
    }
    res.json(orders.map(withCanonicalOrderStatus));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch orders" });
  }
}

export async function getFarmerOrderById(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const farmer = await Farmer.findOne({ $or: [{ id: farmerId }, { farmerId }] })
      .select("name farmerId id vendorId state district taluka village farmAddress farmLocation")
      .lean();
    const farmerName = farmer?.name || "";

    const attachCentreVendor = async (plain) => {
      const vendorId = plain.vendorId || farmer?.vendorId || "";
      let collectionCentreId = plain.collectionCentreId || "";
      let collectionCentre = plain.collectionCentre || "";

      const pickup = await Pickup.findOne({
        $or: [{ orderId: plain.id }, { orderId: plain.orderId }, { id: plain.pickupId }],
      })
        .select("collectionCentreId vendorId")
        .lean()
        .catch(() => null);

      if (pickup?.collectionCentreId) collectionCentreId = collectionCentreId || pickup.collectionCentreId;

      let centre = null;
      if (collectionCentreId) {
        centre = await CollectionCentre.findOne({ id: collectionCentreId }).catch(() => null);
      }
      if (!centre && (vendorId || pickup?.vendorId)) {
        centre = await ensureDefaultCentre(vendorId || pickup.vendorId, {
          farmer,
          city: farmer?.farmAddress?.district || farmer?.district || "",
        });
      } else if (centre) {
        centre = await ensureCentreBusinessId(centre, {
          city: centre.city || farmer?.farmAddress?.district || "",
          farmer: farmer || null,
        });
      }

      return {
        ...plain,
        farmerName: plain.farmerName || farmerName,
        vendorId: vendorId || centre?.vendorId || pickup?.vendorId || "",
        collectionCentreId: centre?.id || collectionCentreId || "",
        collectionCentre: centre?.name || collectionCentre || (vendorId ? "Main Collection Centre" : ""),
      };
    };

    const order = await FarmerOrder.findOne({
      farmerId,
      $or: [{ id: orderId }, { orderId }],
    });
    if (order) {
      const plain = order.toObject ? order.toObject() : order;
      return res.json(await attachCentreVendor(plain));
    }

    const harvest = await FarmerHarvestOrder.findOne({ farmerId, id: orderId }).lean();
    if (!harvest) return res.status(404).json({ message: "Order not found" });

    return res.json(
      await attachCentreVendor({
        ...harvest,
        orderId: harvest.id,
        orderDate: harvest.date || harvest.orderDate || "",
        orderedQuantity: harvest.totalQuantity || 0,
        orderValue: harvest.totalAmount || 0,
        grades: (harvest.grades || []).map((g) => ({
          ...g,
          label: g.label || g.name || "Grade A",
          price: g.price ?? g.rate ?? 0,
          rate: g.rate ?? g.price ?? 0,
        })),
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch order" });
  }
}

export async function updateFarmerOrderStatus(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const { status, note } = req.body;

    const order = await FarmerOrder.findOne({ id: orderId, farmerId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.timeline.push({
      status,
      at: new Date(),
      note: note || `Status updated to ${status}`,
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update order status" });
  }
}

export async function updateFarmerOrder(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const {
      products,
      harvestDate,
      day,
      unit,
      rejectionQty,
      status,
      grades,
    } = req.body;

    const query = {
      farmerId,
      $or: [{ id: orderId }, { orderId: orderId }],
    };
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query.$or.push({ _id: orderId });
    }

    let order = await FarmerOrder.findOne(query);
    if (!order) {
      const harvestOrder = await FarmerHarvestOrder.findOne(query);
      if (harvestOrder) {
        if (harvestDate !== undefined) harvestOrder.harvestDate = harvestDate;
        if (unit !== undefined) harvestOrder.unit = unit;
        if (rejectionQty !== undefined) harvestOrder.rejectionQty = Number(rejectionQty || 0);
        if (status !== undefined) harvestOrder.status = status;
        if (grades !== undefined) harvestOrder.grades = grades;
        await harvestOrder.save();
        return res.json(harvestOrder);
      }
      return res.status(404).json({ message: "Harvest order not found" });
    }

    if (harvestDate !== undefined) order.harvestDate = harvestDate;
    if (day !== undefined) order.day = day;
    if (unit !== undefined) order.unit = unit;
    if (rejectionQty !== undefined) order.rejectionQty = Number(rejectionQty || 0);
    if (status !== undefined) order.status = status;
    if (grades !== undefined) order.grades = grades;

    if (Array.isArray(products) && products.length > 0) {
      order.products = products.map((p) => ({
        id: p.id || p.productId || "",
        name: p.name || "",
        grade: p.grade || "Grade A",
        quantity: Number(p.quantity || 0),
        unit: p.unit || order.unit || "Kg",
        price: Number(p.price || 0),
        total: Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
        grades: p.grades || [],
      }));
      order.totalQuantity = order.products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    }

    order.markModified("products");
    order.markModified("grades");
    await order.save();
    if (status !== undefined) {
      await persistOrderStatusSideEffects(order, { event: "MANAGER_UPDATE" });
    }
    return res.json(withCanonicalOrderStatus(toPlain(order)));
  } catch (err) {
    console.error("Error updating harvest order:", err);
    return res.status(500).json({ message: err.message || "Failed to update harvest order" });
  }
}

export async function createFarmerOrder(req, res) {
  try {
    const { farmerId } = req.params;
    const {
      customer,
      products,
      harvestDate = "",
      harvestTime = "",
      day = "",
      unit = "Kg",
      rejectionQty = 0,
      rejectionReason = "",
      status = "NEW",
      paymentStatus = "Pending",
      deliveryStatus = "Pending",
      orderDate: orderDateRaw = "",
      pickupDate = "",
      requiredDate = "",
      pickupTime = "",
    } = req.body;

    const farmer = await Farmer.findOne({ $or: [{ id: farmerId }, { farmerId }] });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const lineItems = products || [];
    const totalQuantity = lineItems.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalAmount = lineItems.reduce(
      (sum, p) => sum + Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      0
    );
    const first = lineItems[0] || {};
    const productId = String(req.body.productId || first.productId || first.id || "").trim();
    const productName = String(req.body.productName || first.name || "Produce").trim();
    const grades = Array.isArray(req.body.grades) && req.body.grades.length
      ? req.body.grades
      : lineItems.map((p) => ({
          name: p.grade || p.name || "Grade A",
          label: p.grade || p.name || "Grade A",
          quantity: Number(p.quantity || 0),
          rate: Number(p.price || 0),
        }));

    const today = new Date();
    const localOrderDate =
      String(orderDateRaw || "").slice(0, 10) ||
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const id = await generateId({
      module: "ORD",
      date: localOrderDate.replace(/-/g, ""),
    });
    const pickupOrRequired = String(pickupDate || requiredDate || "").slice(0, 10);
    const requiredOrPickup = String(requiredDate || pickupDate || "").slice(0, 10);
    const pickupAt = String(pickupTime || harvestTime || "").trim();
    const gradeLabel =
      grades
        .filter((g) => Number(g.quantity || 0) > 0)
        .map((g) => g.label || g.name)
        .filter(Boolean)
        .join(", ") || first.grade || "Grade A";

    let variety = String(req.body.variety || "").trim();
    if (!variety && productId) {
      const linkedProduct = await FarmerProduct.findOne({
        farmerId,
        $or: [{ id: productId }, { productId }],
      })
        .select("variety")
        .lean();
      variety = linkedProduct?.variety || "";
    }

    const orderStatus = String(status || "NEW").trim() || "NEW";

    const order = new FarmerOrder({
      id,
      orderId: id,
      vendorId: farmer.vendorId || req.user?.vendorId || DEFAULT_VENDOR_ID,
      farmerId: farmer.id,
      productId,
      productName,
      variety,
      grade: gradeLabel,
      orderedQuantity: totalQuantity,
      grades,
      customer: {
        name: customer?.name || "Daily Harvest / Store Order",
        phone: customer?.phone || farmer.mobile || "",
        address: customer?.address || farmer.farmLocation || "",
      },
      products: lineItems.map((p) => ({
        id: p.id || p.productId || productId || "",
        productId: p.productId || p.id || productId || "",
        name: p.name || productName,
        grade: p.grade || "Grade A",
        quantity: Number(p.quantity || 1),
        unit: p.unit || unit || "Kg",
        price: Number(p.price || 0),
        total: Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      })),
      orderDate: localOrderDate,
      harvestDate: localOrderDate,
      harvestTime: pickupAt,
      pickupDate: pickupOrRequired,
      requiredDate: requiredOrPickup,
      pickupTime: pickupAt,
      day: day || "Today",
      unit: unit || "Kg",
      rejectionQty: Number(rejectionQty || 0),
      rejectionReason: String(rejectionReason || ""),
      totalQuantity,
      totalAmount,
      amount: totalAmount,
      orderValue: totalAmount,
      status: orderStatus,
      deliveryStatus,
      paymentStatus,
      preparationStatus: ["NEW", "New"].includes(orderStatus) ? "NOT_STARTED" : "PREPARING",
      timeline: [
        {
          status: orderStatus,
          at: new Date(),
          note: `Order created by ${req.user?.role === "FARMER_MANAGER" ? "Manager" : "Vendor"}`,
        },
      ],
    });

    await order.save();

    const createdAsNew = ["NEW", "New"].includes(String(orderStatus));
    if (!createdAsNew) {
    // Deduct stock from FarmerProduct grades if available
    for (const item of lineItems) {
      const prodId = item.productId || item.id || productId;
      if (prodId) {
        const prod = await FarmerProduct.findOne({
          farmerId,
          $or: [{ id: prodId }, { productId: prodId }],
        });
        if (prod) {
          const gradeItem = prod.grades?.find((g) => g.label === item.grade);
          if (gradeItem) {
            gradeItem.quantity = Math.max(0, Number(gradeItem.quantity || 0) - Number(item.quantity || 0));
          }
          prod.stock = Math.max(0, Number(prod.stock || 0) - Number(item.quantity || 0));
          await prod.save();

          // Log stock history
          await FarmerStockHistory.create({
            id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            vendorId: farmer.vendorId || DEFAULT_VENDOR_ID,
            managerId: farmer.managerId || "",
            farmerId,
            productId: prod.id,
            productName: prod.name,
            grade: item.grade || "All Grades",
            action: "Order Deduction",
            previousStock: Number(prod.stock || 0) + Number(item.quantity || 0),
            changedQuantity: -Number(item.quantity || 0),
            newStock: prod.stock,
            reason: `Order #${id}`,
            updatedBy: req.user?.role === "FARMER_MANAGER" ? "Manager" : "Vendor",
            reference: id,
            at: new Date(),
          }).catch(() => {});
        }
      }
    }

    // Create Farmer Earning entry
    await FarmerEarning.create({
      id: `earn-${Date.now()}`,
      vendorId: farmer.vendorId || DEFAULT_VENDOR_ID,
      farmerId,
      orderId: id,
      date: new Date().toISOString().split("T")[0],
      cropName: products?.[0]?.name || productName || "Produce",
      quantity: totalQuantity,
      ratePerKg: totalQuantity > 0 ? Math.round(totalAmount / totalQuantity) : 0,
      grossEarnings: totalAmount,
      deductions: 0,
      netEarnings: totalAmount,
      status: paymentStatus === "Paid" ? "Paid" : "Pending",
    }).catch(() => {});
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create order" });
  }
}

export async function deleteFarmerOrder(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const query = {
      farmerId,
      $or: [{ id: orderId }, { orderId: orderId }],
    };
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query.$or.push({ _id: orderId });
    }

    await FarmerOrder.deleteMany(query);
    await FarmerHarvestOrder.deleteMany(query).catch(() => {});
    await FarmerEarning.deleteMany({ orderId }).catch(() => {});
    return res.json({ success: true, message: "Harvest order deleted successfully" });
  } catch (err) {
    console.error("Error deleting harvest order:", err);
    return res.status(500).json({ message: err.message || "Failed to delete harvest order" });
  }
}

// ----------------------------------------------------
// EARNINGS CONTROLLERS
// ----------------------------------------------------
export async function getFarmerEarnings(req, res) {
  try {
    const { farmerId } = req.params;
    const earningsList = await FarmerEarning.find({ farmerId }).sort({ date: -1 }).lean();

    const totalEarnings = earningsList.reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const paidEarnings = earningsList
      .filter((r) => r.status === "Paid")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const pendingEarnings = earningsList
      .filter((r) => r.status === "Pending")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const availableEarnings = earningsList
      .filter((r) => r.status === "Available")
      .reduce((s, r) => s + Number(r.netEarnings || 0), 0);

    res.json({
      summary: { totalEarnings, paidEarnings, pendingEarnings, availableEarnings },
      transactions: earningsList,
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      availableEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch earnings" });
  }
}

// ----------------------------------------------------
// DOCUMENT CONTROLLERS
// ----------------------------------------------------
export async function getFarmerDocuments(req, res) {
  try {
    const { farmerId } = req.params;
    const docs = await FarmerDocument.find({ farmerId }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch documents" });
  }
}

export async function uploadFarmerDocument(req, res) {
  try {
    const { farmerId } = req.params;
    const { type, fileName, fileUrl } = req.body;
    if (!type) return res.status(400).json({ message: "Document type is required" });
    if (!fileName && !fileUrl) return res.status(400).json({ message: "Choose a file to upload" });

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    if (req.user?.role === "FARMER_MANAGER") {
      const managerId = req.user.managerId || req.user.id;
      const assigned = await Farmer.findOne({
        id: farmerId,
        managerId,
        vendorId: req.user.vendorId,
      }).select("id").lean();
      if (!assigned) {
        return res.status(403).json({ message: "This farmer is not assigned to you" });
      }
    }

    const allowed = ["aadhaar", "pan", "bank", "address", "other"];
    const docType = allowed.includes(String(type)) ? String(type) : "other";
    const names = {
      aadhaar: "Aadhaar / ID Proof",
      pan: "PAN Card",
      bank: "Bank Details",
      address: "Address Proof",
      other: "Other Documents",
    };

    let doc = await FarmerDocument.findOne({ farmerId, type: docType });
    if (!doc) {
      doc = new FarmerDocument({
        id: `doc-${farmerId}-${docType}`,
        vendorId: farmer.vendorId,
        managerId: farmer.managerId,
        farmerId,
        name: names[docType] || docType.toUpperCase(),
        type: docType,
      });
    }

    doc.fileName = fileName || doc.fileName;
    doc.fileUrl = fileUrl || doc.fileUrl || "";
    doc.uploadedAt = new Date();
    doc.status = "Pending";
    doc.rejectionReason = "";
    doc.uploadedBy = req.user?.role || "FARMER";

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to upload document" });
  }
}

export async function submitFarmerKyc(req, res) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    const docs = await FarmerDocument.find({ farmerId }).lean();
    const required = ["aadhaar", "pan", "address", "bank"];
    const missing = required.filter((type) => {
      const doc = docs.find((d) => d.type === type);
      return !doc || doc.status === "Not Uploaded" || !doc.fileName;
    });

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Upload all required KYC documents before submitting",
        missing,
      });
    }

    farmer.kycStatus = "SUBMITTED";
    farmer.verificationStatus = "Pending";
    await farmer.save();

    const { password: _pw, ...farmerData } = farmer.toObject();
    res.json({
      success: true,
      message: "KYC submitted for verification",
      kycStatus: farmer.kycStatus,
      farmer: { ...farmerData, farmerId: farmer.id, role: farmer.role || "FARMER" },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to submit KYC" });
  }
}

export async function updateFarmerDocumentStatus(req, res) {
  try {
    const { farmerId, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    const doc = await FarmerDocument.findOne({ id: documentId, farmerId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.status = status;
    if (rejectionReason !== undefined) doc.rejectionReason = rejectionReason;
    await doc.save();

    // Check farmer verification status
    const farmerDocs = await FarmerDocument.find({ farmerId });
    const reqTypes = ["aadhaar", "pan", "address", "bank"];
    const reqDocs = farmerDocs.filter((d) => reqTypes.includes(d.type));

    const farmer = await Farmer.findOne({ id: farmerId });
    if (farmer) {
      if (reqDocs.every((d) => d.status === "Approved")) {
        farmer.verificationStatus = "Approved";
        farmer.status = "Active";
      } else if (reqDocs.some((d) => d.status === "Rejected")) {
        farmer.verificationStatus = "Rejected";
      }
      await farmer.save();
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update document status" });
  }
}

export async function deleteFarmerDocument(req, res) {
  try {
    const { farmerId, documentId } = req.params;
    const doc = await FarmerDocument.findOne({ id: documentId, farmerId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.status === "Approved") {
      return res.status(400).json({ message: "Approved documents cannot be deleted" });
    }

    doc.fileName = "";
    doc.fileUrl = "";
    doc.uploadedAt = null;
    doc.status = "Not Uploaded";
    doc.rejectionReason = "";
    await doc.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete document" });
  }
}

// ----------------------------------------------------
// MANAGER CONTROLLERS
// ----------------------------------------------------
async function enrichManagerDoc(mgrDoc) {
  const m = toPlain(mgrDoc);
  const farmers = await Farmer.find({ managerId: m.id, vendorId: m.vendorId }).select("id status").lean();
  const farmerIds = farmers.map((f) => f.id);
  const stats = await aggFarmerStats(farmerIds);

  let totalProducts = 0;
  let inventoryQty = 0;
  let totalOrders = 0;
  let totalEarnings = 0;
  farmerIds.forEach((fid) => {
    const p = stats.productStats.get(fid) || { count: 0, stock: 0 };
    totalProducts += p.count;
    inventoryQty += p.stock;
    totalOrders += stats.orderStats.get(fid) || 0;
    totalEarnings += stats.earningStats.get(fid) || 0;
  });

  delete m.password;

  return {
    ...m,
    initials: initials(m.name),
    totalFarmers: farmers.length,
    activeFarmers: farmers.filter((f) => f.status === "Active").length,
    totalProducts,
    totalInventory: inventoryQty,
    totalOrders,
    totalEarnings,
  };
}

async function enrichManagerDocsBatch(mgrDocs) {
  if (!mgrDocs || !mgrDocs.length) return [];

  const rawManagers = mgrDocs.map(toPlain);
  const managerIds = rawManagers.map((m) => m.id).filter(Boolean);

  const farmers = await Farmer.find({ managerId: { $in: managerIds } }).select("id managerId status").lean();
  const farmerIds = farmers.map((f) => f.id);
  const stats = await aggFarmerStats(farmerIds);

  const farmerToManager = new Map();
  const managerFarmersMap = new Map();
  farmers.forEach((f) => {
    farmerToManager.set(f.id, f.managerId);
    const list = managerFarmersMap.get(f.managerId) || [];
    list.push(f);
    managerFarmersMap.set(f.managerId, list);
  });

  const managerProductStats = new Map();
  const managerOrderCount = new Map();
  const managerEarnings = new Map();

  farmerIds.forEach((fid) => {
    const mgrId = farmerToManager.get(fid);
    if (!mgrId) return;
    const p = stats.productStats.get(fid) || { count: 0, stock: 0 };
    const cur = managerProductStats.get(mgrId) || { count: 0, stock: 0 };
    cur.count += p.count;
    cur.stock += p.stock;
    managerProductStats.set(mgrId, cur);
    managerOrderCount.set(mgrId, (managerOrderCount.get(mgrId) || 0) + (stats.orderStats.get(fid) || 0));
    managerEarnings.set(mgrId, (managerEarnings.get(mgrId) || 0) + (stats.earningStats.get(fid) || 0));
  });

  return rawManagers.map((m) => {
    delete m.password;
    const fList = managerFarmersMap.get(m.id) || [];
    const pStat = managerProductStats.get(m.id) || { count: 0, stock: 0 };
    return {
      ...m,
      initials: initials(m.name),
      totalFarmers: fList.length,
      activeFarmers: fList.filter((f) => f.status === "Active").length,
      totalProducts: pStat.count,
      totalInventory: pStat.stock,
      totalOrders: managerOrderCount.get(m.id) || 0,
      totalEarnings: managerEarnings.get(m.id) || 0,
    };
  });
}

export async function getManagers(req, res) {
  try {
    const { q = "", status = "", vendorId = DEFAULT_VENDOR_ID } = req.query;
    const query = { vendorId };
    if (status) query.status = status;

    const mgrDocs = await FarmerManager.find(query).select("-password").sort({ createdAt: -1 }).lean();
    let enriched = await enrichManagerDocsBatch(mgrDocs);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.mobile.includes(needle) ||
          m.email.toLowerCase().includes(needle) ||
          (m.location && m.location.toLowerCase().includes(needle))
      );
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch managers" });
  }
}

export async function getManagerById(req, res) {
  try {
    const { managerId } = req.params;
    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch manager" });
  }
}

export async function createManager(req, res) {
  try {
    const payload = req.body;
    const vendorId = req.user?.vendorId || payload.vendorId || DEFAULT_VENDOR_ID;
    const id = `mgr-${Date.now()}`;
    const location = [payload.city, payload.state].filter(Boolean).join(", ") || payload.location || "";

    if (!payload.name || !payload.mobile) {
      return res.status(400).json({ message: "Manager name and mobile are required" });
    }

    const existing = await FarmerManager.findOne({ mobile: String(payload.mobile).trim(), vendorId });
    if (existing) {
      return res.status(409).json({ message: "A manager with this mobile number already exists" });
    }

    const rawPassword = payload.password || "manager123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const manager = new FarmerManager({
      id,
      vendorId,
      name: payload.name,
      profileImage: payload.profileImage || "",
      mobile: String(payload.mobile).trim(),
      email: payload.email || "",
      address: payload.address || "",
      city: payload.city || "",
      state: payload.state || "",
      pincode: payload.pincode || "",
      location,
      joiningDate: payload.joiningDate || new Date().toISOString().split("T")[0],
      status: payload.status || "Active",
      authType: payload.authType || "password",
      password: hashedPassword,
      role: "FARMER_MANAGER",
    });

    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create manager" });
  }
}

export async function updateManager(req, res) {
  try {
    const { managerId } = req.params;
    const payload = req.body;

    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    if (payload.name) manager.name = payload.name;
    if (payload.mobile) manager.mobile = payload.mobile;
    if (payload.email !== undefined) manager.email = payload.email;
    if (payload.address !== undefined) manager.address = payload.address;
    if (payload.city !== undefined) manager.city = payload.city;
    if (payload.state !== undefined) manager.state = payload.state;
    if (payload.pincode !== undefined) manager.pincode = payload.pincode;
    if (payload.status) manager.status = payload.status;

    manager.location = [manager.city, manager.state].filter(Boolean).join(", ") || payload.location || manager.location;

    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update manager" });
  }
}

export async function setManagerStatus(req, res) {
  try {
    const { managerId } = req.params;
    const { status } = req.body;
    const manager = await FarmerManager.findOne({ id: managerId });
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    manager.status = status;
    await manager.save();
    const enriched = await enrichManagerDoc(manager);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update manager status" });
  }
}

export async function deleteManager(req, res) {
  try {
    const { managerId } = req.params;
    const linkedFarmers = await Farmer.countDocuments({ managerId });
    if (linkedFarmers > 0) {
      return res.status(400).json({ message: "Remove or reassign farmers before deleting this manager" });
    }
    await FarmerManager.deleteOne({ id: managerId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete manager" });
  }
}

// ----------------------------------------------------
// VENDOR AUTH CONTROLLERS
// ----------------------------------------------------
export async function vendorLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }
    const vendor = await Vendor.findOne({ mobile: String(mobile).trim() });
    if (!vendor) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    if (vendor.status !== "Active") {
      return res.status(403).json({ message: `Vendor account is ${vendor.status.toLowerCase()}` });
    }
    let isMatch = false;
    if (vendor.password && (vendor.password.startsWith("$2a$") || vendor.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, vendor.password);
    } else {
      isMatch = vendor.password === password;
      if (isMatch) {
        vendor.password = await bcrypt.hash(password, 10);
        await vendor.save();
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    const token = signToken({
      id: vendor.id,
      vendorId: vendor.id,
      role: "VENDOR",
      name: vendor.ownerName,
      vendorName: vendor.vendorName,
    });
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.json({ success: true, token, vendor: vendorData });
  } catch (err) {
    res.status(500).json({ message: err.message || "Vendor login failed" });
  }
}

export async function getVendorMe(req, res) {
  try {
    const vendor = await Vendor.findOne({ id: req.user.vendorId }).lean();
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    const { password: _pw, ...vendorData } = vendor;
    res.json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function getVendors(req, res) {
  try {
    const vendors = await Vendor.find().lean();
    res.json(vendors.map(({ password: _pw, ...v }) => v));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function createVendor(req, res) {
  try {
    const payload = req.body;
    const id = `vendor-${Date.now()}`;
    const rawPassword = payload.password || "vendor123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const vendor = new Vendor({
      id,
      vendorCode: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      password: hashedPassword,
      role: "VENDOR",
    });
    await vendor.save();
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.status(201).json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create vendor" });
  }
}

export async function updateVendor(req, res) {
  try {
    const { vendorId } = req.params;
    const payload = req.body;
    const vendor = await Vendor.findOne({ id: vendorId });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    Object.assign(vendor, payload);
    if (payload.password) vendor.password = await bcrypt.hash(payload.password, 10);
    await vendor.save();
    const { password: _pw, ...vendorData } = vendor.toObject();
    res.json(vendorData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update vendor" });
  }
}

export async function getVendorDashboard(req, res) {
  try {
    const vendorId = req.user.vendorId;
    const [farmers, managers, productAgg, orderAgg, earningAgg, recentOrders] = await Promise.all([
      Farmer.find({ vendorId }).select("id name status").lean(),
      FarmerManager.find({ vendorId }).select("id status").lean(),
      FarmerProduct.aggregate([
        { $match: { vendorId } },
        { $group: { _id: null, totalProducts: { $sum: 1 }, totalInventory: { $sum: { $ifNull: ["$stock", 0] } } } },
      ]),
      FarmerOrder.aggregate([
        { $match: { vendorId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "NEW", "Confirmed", "Approved", "Processing"]] }, 1, 0] } },
          },
        },
      ]),
      FarmerEarning.aggregate([
        { $match: { vendorId } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $ifNull: ["$netEarnings", 0] } },
            pendingEarnings: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, { $ifNull: ["$netEarnings", 0] }, 0] } },
          },
        },
      ]),
      FarmerOrder.find({ vendorId }).sort({ orderDate: -1 }).limit(10).select("id farmerId products totalQuantity totalAmount status orderDate").lean(),
    ]);

    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const p = productAgg[0] || { totalProducts: 0, totalInventory: 0 };
    const o = orderAgg[0] || { totalOrders: 0, pendingOrders: 0 };
    const e = earningAgg[0] || { totalEarnings: 0, pendingEarnings: 0 };

    res.json({
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter((f) => f.status === "Active").length,
      totalManagers: managers.length,
      activeManagers: managers.filter((m) => m.status === "Active").length,
      totalProducts: p.totalProducts,
      totalInventory: p.totalInventory,
      totalOrders: o.totalOrders,
      pendingOrders: o.pendingOrders,
      totalEarnings: e.totalEarnings,
      pendingEarnings: e.pendingEarnings,
      pendingProductApprovals: await FarmerProduct.countDocuments({
        vendorId,
        status: { $in: ["Pending Approval", "Pending", "PENDING_APPROVAL"] },
      }),
      recentOrders: recentOrders.map((ord) => ({ ...ord, farmerName: farmerNameMap.get(ord.farmerId) || "—" })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

export async function getVendorAllProducts(req, res) {
  try {
    const vendorId = req.user.vendorId;
    const farmers = await Farmer.find({ vendorId }).select("id name mobile farmName").sort({ createdAt: -1 }).lean();
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const products = await FarmerProduct.find({ vendorId }).select("-images").sort({ createdAt: -1 }).lean();
    res.json({
      farmers,
      products: products.map((p) => enrichProductRow(p, farmerNameMap.get(p.farmerId) || "—")),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
}

// ----------------------------------------------------
// MANAGER AUTH CONTROLLERS
// ----------------------------------------------------
export async function managerLogin(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }
    const manager = await FarmerManager.findOne({ mobile: String(mobile).trim() });
    if (!manager) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    if (manager.status !== "Active") {
      return res.status(403).json({ message: `Manager account is ${manager.status.toLowerCase()}` });
    }
    let isMatch = false;
    if (manager.password && (manager.password.startsWith("$2a$") || manager.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, manager.password);
    } else {
      isMatch = manager.password === password;
      if (isMatch) {
        manager.password = await bcrypt.hash(password, 10);
        await manager.save();
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }
    const token = signToken({
      id: manager.id,
      managerId: manager.id,
      vendorId: manager.vendorId,
      role: "FARMER_MANAGER",
      name: manager.name,
    });
    const { password: _pw, ...managerData } = manager.toObject();
    res.json({
      success: true,
      token,
      // Return in same shape as farmer login so the farmer app can handle it
      farmer: {
        ...managerData,
        id: manager.id,
        role: "FARMER_MANAGER",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Manager login failed" });
  }
}

export async function getManagerMe(req, res) {
  try {
    const manager = await FarmerManager.findOne({ id: req.user.managerId }).lean();
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    const { password: _pw, ...managerData } = manager;
    res.json(managerData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

// ----------------------------------------------------
// MANAGER-SCOPED CONTROLLERS
// ----------------------------------------------------
export async function getManagerFarmers(req, res) {
  try {
    const { q = "", status = "", lite = "" } = req.query;
    const query = assignedFarmerQuery(req);
    if (status) query.status = status;
    const farmerDocs = await Farmer.find(query).select("-password").sort({ createdAt: -1 }).lean();
    const isLite = lite === "1" || lite === "true";
    let enriched = isLite
      ? farmerDocs.map((f) => ({
          ...f,
          loginEnabled: f.loginEnabled !== false,
          initials: initials(f.name),
        }))
      : await enrichFarmerDocsBatch(farmerDocs);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      enriched = enriched.filter(
        (f) => f.name.toLowerCase().includes(needle) || f.mobile.includes(needle)
      );
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch farmers" });
  }
}

export async function getManagerDashboard(req, res) {
  try {
    const farmers = await Farmer.find(assignedFarmerQuery(req)).select("id farmerId name status").lean();
    const { ids: farmerIds } = indexFarmersByIdentity(farmers);
    const farmerNameMap = new Map();
    farmers.forEach((f) => {
      farmerNameMap.set(f.id, f.name);
      if (f.farmerId) farmerNameMap.set(f.farmerId, f.name);
    });

    if (!farmerIds.length) {
      return res.json({
        totalFarmers: 0,
        activeFarmers: 0,
        totalProducts: 0,
        totalInventory: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        recentOrders: [],
        lowStock: [],
        pendingProductApprovals: 0,
      });
    }

    const [productAgg, orderAgg, earningAgg, recentOrders, lowStockProducts, pendingProductApprovals] = await Promise.all([
      FarmerProduct.aggregate([
        { $match: { farmerId: { $in: farmerIds } } },
        { $group: { _id: null, totalProducts: { $sum: 1 }, totalInventory: { $sum: { $ifNull: ["$stock", 0] } } } },
      ]),
      FarmerOrder.aggregate([
        { $match: { farmerId: { $in: farmerIds } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "NEW", "Confirmed", "Approved", "Processing"]] }, 1, 0] } },
          },
        },
      ]),
      FarmerEarning.aggregate([
        { $match: { farmerId: { $in: farmerIds } } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $ifNull: ["$netEarnings", 0] } },
            pendingEarnings: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, { $ifNull: ["$netEarnings", 0] }, 0] } },
          },
        },
      ]),
      FarmerOrder.find({ farmerId: { $in: farmerIds } })
        .sort({ orderDate: -1 })
        .limit(10)
        .select("id farmerId products totalQuantity totalAmount status orderDate rejectionReason rejectionNote")
        .lean(),
      FarmerProduct.find({ farmerId: { $in: farmerIds } })
        .select("farmerId name grades stock lowStockLimit")
        .lean()
        .then((rows) => rows.filter((p) => Number(p.stock || 0) <= Number(p.lowStockLimit || 10)).slice(0, 20)),
      FarmerProduct.countDocuments({
        farmerId: { $in: farmerIds },
        status: { $in: ["Pending Approval", "Pending", "PENDING_APPROVAL"] },
      }),
    ]);

    const p = productAgg[0] || { totalProducts: 0, totalInventory: 0 };
    const o = orderAgg[0] || { totalOrders: 0, pendingOrders: 0 };
    const e = earningAgg[0] || { totalEarnings: 0, pendingEarnings: 0 };

    res.json({
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter((f) => f.status === "Active").length,
      totalProducts: p.totalProducts,
      totalInventory: p.totalInventory,
      totalOrders: o.totalOrders,
      pendingOrders: o.pendingOrders,
      totalEarnings: e.totalEarnings,
      pendingEarnings: e.pendingEarnings,
      pendingProductApprovals,
      recentOrders: recentOrders.map((ord) => ({
        ...ord,
        status: normalizeOrderStatus(ord.status),
        farmerName: farmerNameMap.get(ord.farmerId) || "—",
      })),
      lowStock: lowStockProducts.map((prod) => ({
        farmerId: prod.farmerId,
        farmerName: farmerNameMap.get(prod.farmerId) || "—",
        productName: prod.name,
        grades: prod.grades,
        currentStock: prod.stock || 0,
        status: "Low Stock",
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
  }
}

function attachFarmerMeta(farmers) {
  return farmers.map((f) => ({
    ...f,
    loginEnabled: f.loginEnabled !== false,
    initials: initials(f.name),
  }));
}

export async function getManagerAllProducts(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, products: [] });
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const products = await FarmerProduct.find({ farmerId: { $in: farmerIds } })
      .select("-images")
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      farmers,
      products: products.map((p) => enrichProductRow(p, farmerNameMap.get(p.farmerId) || "—")),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
}

export async function getManagerAllOrders(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, orders: [] });
    const farmerMap = new Map(farmers.map((f) => [f.id, f]));
    const orders = await FarmerOrder.find({ farmerId: { $in: farmerIds } }).sort({ orderDate: -1 }).lean();
    res.json({
      farmers,
      orders: orders.map((o) => {
        const f = farmerMap.get(o.farmerId);
        return {
          ...o,
          farmerName: f?.name || "—",
          farmerMobile: f?.mobile || "",
          farmerLocation: f?.farmLocation || "",
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch orders" });
  }
}

export async function getManagerAllInventory(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, inventory: [] });
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const products = await FarmerProduct.find({ farmerId: { $in: farmerIds } })
      .select("-images -description")
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      farmers,
      inventory: products.map((p) => enrichProductRow(p, farmerNameMap.get(p.farmerId) || "—")),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch inventory" });
  }
}

export async function getManagerAllDocuments(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, documents: [] });
    const documents = await FarmerDocument.find({ farmerId: { $in: farmerIds } }).lean();
    res.json({ farmers, documents });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch documents" });
  }
}

export async function getManagerAllStockHistory(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    const { farmerId } = req.query;
    const ids = farmerId && farmerIds.includes(farmerId) ? [farmerId] : farmerIds;
    if (!ids.length) return res.json({ farmers, history: [] });
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const history = await FarmerStockHistory.find({ farmerId: { $in: ids } })
      .sort({ at: -1 })
      .limit(500)
      .lean();
    res.json({
      farmers,
      history: history.map((h) => ({ ...h, farmerName: farmerNameMap.get(h.farmerId) || h.farmerId })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch stock history" });
  }
}

export async function getManagerAllHarvestOrders(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const { ids: farmerIds, farmerMap } = indexFarmersByIdentity(farmers);
    if (!farmerIds.length) return res.json({ farmers, orders: [] });
    const [harvestOrders, farmerOrders] = await Promise.all([
      FarmerHarvestOrder.find({ farmerId: { $in: farmerIds } }).sort({ createdAt: -1 }).lean(),
      FarmerOrder.find({ farmerId: { $in: farmerIds } }).sort({ orderDate: -1 }).lean(),
    ]);
    const mapped = mapFarmerOrdersToHarvest(farmerOrders).map((o) => {
      const f = farmerMap.get(o.farmerId);
      return {
        ...o,
        farmerName: o.farmerName || f?.name || "—",
        farmerMobile: f?.mobile || "",
      };
    });
    const harvestWithNames = harvestOrders.map((o) => {
      const f = farmerMap.get(o.farmerId);
      return {
        ...o,
        status: normalizeOrderStatus(o.status),
        farmerName: o.farmerName || f?.name || "—",
        farmerMobile: f?.mobile || "",
      };
    });
    res.json({ farmers, orders: mergeHarvestLists(harvestWithNames, mapped) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch harvest orders" });
  }
}

export async function getManagerAllEarnings(req, res) {
  try {
    const farmers = attachFarmerMeta(await getAssignedFarmers(req));
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, earnings: [], transactions: [] });
    const earnings = await FarmerEarning.find({ farmerId: { $in: farmerIds } }).sort({ date: -1 }).lean();
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));
    const transactions = earnings.map((e) => ({ ...e, farmerName: farmerNameMap.get(e.farmerId) || "—" }));
    const totalEarnings = transactions.reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const paidEarnings = transactions.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    const pendingEarnings = transactions.filter((r) => r.status === "Pending").reduce((s, r) => s + Number(r.netEarnings || 0), 0);
    res.json({
      farmers,
      transactions,
      earnings: transactions,
      summary: { totalEarnings, paidEarnings, pendingEarnings },
      totalEarnings,
      paidEarnings,
      pendingEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch earnings" });
  }
}

export async function assignFarmerManager(req, res) {
  try {
    const { farmerId } = req.params;
    const { managerId } = req.body;
    const vendorId = req.user?.vendorId || DEFAULT_VENDOR_ID;
    const farmer = await Farmer.findOne({ id: farmerId, vendorId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    if (managerId) {
      const manager = await FarmerManager.findOne({ id: managerId, vendorId });
      if (!manager) return res.status(404).json({ message: "Manager not found" });
    }
    farmer.managerId = managerId || "";
    await farmer.save();
    await FarmerProduct.updateMany({ farmerId }, { managerId: managerId || "" });
    await FarmerDocument.updateMany({ farmerId }, { managerId: managerId || "" });
    const enriched = await enrichFarmerDoc(farmer);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to assign manager" });
  }
}

// ----------------------------------------------------
// HARVEST ORDERS CONTROLLERS
// ----------------------------------------------------
export async function getHarvestOrders(req, res) {
  try {
    const farmerId = req.params.farmerId || req.query.farmerId || req.user?.farmerId || req.user?.id;
    const filter = {};
    if (farmerId && farmerId !== "all" && farmerId !== "ALL") {
      const { ids } = await resolveFarmerIdentity(farmerId);
      filter.farmerId = { $in: ids.length ? ids : [farmerId] };
    }

    const [harvestOrders, farmerOrders] = await Promise.all([
      FarmerHarvestOrder.find(filter).sort({ createdAt: -1 }).lean(),
      FarmerOrder.find(filter).sort({ orderDate: -1, createdAt: -1 }).lean(),
    ]);

    const combined = mergeHarvestLists(harvestOrders, mapFarmerOrdersToHarvest(farmerOrders));
    res.json(combined);
  } catch (err) {
    console.error("Error in getHarvestOrders:", err);
    res.status(500).json({ message: err.message || "Failed to fetch harvest orders" });
  }
}

export async function createHarvestOrder(req, res) {
  try {
    const payload = req.body;
    const id = `ho-${Date.now()}`;
    const order = new FarmerHarvestOrder({
      id,
      vendorId: payload.vendorId || DEFAULT_VENDOR_ID,
      farmerId: payload.farmerId,
      productId: payload.productId,
      productName: payload.productName,
      category: payload.category || "Vegetables",
      date: payload.date || new Date().toISOString().split("T")[0],
      day: payload.day || "",
      unit: payload.unit || "Kg",
      grades: payload.grades || [],
      rejectionQty: Number(payload.rejectionQty) || 0,
      totalQuantity: Number(payload.totalQuantity) || 0,
      totalAmount: Number(payload.totalAmount) || 0,
      status: payload.status || "Approved",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create harvest order" });
  }
}

export async function updateHarvestOrder(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const order = await FarmerHarvestOrder.findOne({ id });
    if (!order) return res.status(404).json({ message: "Harvest order not found" });

    if (payload.productId) order.productId = payload.productId;
    if (payload.productName) order.productName = payload.productName;
    if (payload.category) order.category = payload.category;
    if (payload.date) order.date = payload.date;
    if (payload.day !== undefined) order.day = payload.day;
    if (payload.unit) order.unit = payload.unit;
    if (payload.grades) order.grades = payload.grades;
    if (payload.rejectionQty !== undefined) order.rejectionQty = Number(payload.rejectionQty);
    if (payload.totalQuantity !== undefined) order.totalQuantity = Number(payload.totalQuantity);
    if (payload.totalAmount !== undefined) order.totalAmount = Number(payload.totalAmount);
    if (payload.status) order.status = payload.status;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update harvest order" });
  }
}

export async function deleteHarvestOrder(req, res) {
  try {
    const { id } = req.params;
    await FarmerHarvestOrder.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete harvest order" });
  }
}
