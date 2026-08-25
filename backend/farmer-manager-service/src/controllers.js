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
} from "./models.js";

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

function mapFarmerOrdersToHarvest(farmerOrders) {
  return farmerOrders.flatMap((o) => {
    const prods =
      o.products && o.products.length > 0
        ? o.products
        : [{ name: o.productName || "Farm Fresh Produce", quantity: o.totalQuantity || 0, grade: o.grade || "Grade A", unit: o.unit || "Kg" }];

    return prods.map((p) => {
      const gradesList = p.grades?.length
        ? p.grades
        : o.grades?.length
        ? o.grades
        : [{ name: p.grade || "Grade A", label: p.grade || "Grade A", quantity: Number(p.quantity || 0) }];

      return {
        id: o.id || o.orderId || String(o._id),
        orderId: o.id || o.orderId,
        vendorId: o.vendorId,
        farmerId: o.farmerId,
        farmerName: o.farmerName || "",
        productId: p.id || p.productId || "",
        productName: p.name || o.productName || "Farm Fresh Produce",
        category: p.category || o.category || "Produce",
        date: o.harvestDate || (o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : ""),
        day: o.day || "",
        unit: p.unit || o.unit || "Kg",
        grades: gradesList,
        rejectionQty: Number(o.rejectionQty || 0),
        totalQuantity: Number(p.quantity || o.totalQuantity || 0),
        totalAmount: Number(p.total || o.totalAmount || o.amount || 0),
        status: o.status || "Approved",
        createdAt: o.createdAt,
        products: o.products,
        harvestDate: o.harvestDate,
        amount: o.amount,
        orderDate: o.orderDate,
      };
    });
  });
}

function mergeHarvestLists(harvestOrders, mappedFarmerOrders) {
  const idMap = new Map();
  [...harvestOrders, ...mappedFarmerOrders].forEach((item) => {
    const key = item.id || item.orderId || String(item._id);
    if (key && !idMap.has(key)) idMap.set(key, item);
  });
  return Array.from(idMap.values()).sort(
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
    const id = `farmer-${Date.now()}`;
    const farmerCode = `FRM-${Math.floor(1000 + Math.random() * 9000)}`;

    const farmer = new Farmer({
      id,
      farmerCode,
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
    const farmerId = await generateUniqueFarmerId();
    const farmerCode = `FRM-${farmerId.slice(-6).toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const farmLocation = [village, district, state].filter(Boolean).join(", ");

    const farmer = new Farmer({
      id: farmerId,
      farmerCode,
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
        farmId: `farm-${farmerId}`,
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
    if (!soilType) return res.status(400).json({ message: "Soil type is required" });
    if (!irrigationType) return res.status(400).json({ message: "Irrigation type is required" });
    if (!waterSource) return res.status(400).json({ message: "Water source is required" });
    if (!farmingMethod) return res.status(400).json({ message: "Farming method is required" });
    if (!farmingType) return res.status(400).json({ message: "Farming type is required" });

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
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "Confirmed", "Processing"]] }, 1, 0] } },
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
    const products = await FarmerProduct.find({ farmerId }).select("-images").sort({ createdAt: -1 }).lean();
    const enriched = products.map((p) => enrichProductRow(p));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch products" });
  }
}

export async function getFarmerProductById(req, res) {
  try {
    const { farmerId, productId } = req.params;
    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch product" });
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

    const product = new FarmerProduct({
      id: `fp-${Date.now()}`,
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

    const product = await FarmerProduct.findOne({ id: productId, farmerId });
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
    const query = { farmerId };
    if (status) query.status = status;

    let orders = await FarmerOrder.find(query).sort({ orderDate: -1 }).lean();
    if (q) {
      const needle = q.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(needle) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(needle))
      );
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch orders" });
  }
}

export async function getFarmerOrderById(req, res) {
  try {
    const { farmerId, orderId } = req.params;
    const order = await FarmerOrder.findOne({ id: orderId, farmerId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
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
    return res.json(order);
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
      status = "Confirmed",
      paymentStatus = "Pending",
      deliveryStatus = "Pending",
    } = req.body;

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    const totalQuantity = (products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalAmount = (products || []).reduce(
      (sum, p) => sum + Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      0
    );

    const id = `fo-${Date.now()}`;
    const order = new FarmerOrder({
      id,
      orderId: id,
      vendorId: farmer.vendorId || req.user?.vendorId || DEFAULT_VENDOR_ID,
      farmerId,
      customer: {
        name: customer?.name || "Daily Harvest / Store Order",
        phone: customer?.phone || farmer.mobile || "",
        address: customer?.address || farmer.farmLocation || "",
      },
      products: (products || []).map((p) => ({
        id: p.id || p.productId || "",
        name: p.name || "",
        grade: p.grade || "Grade A",
        quantity: Number(p.quantity || 1),
        unit: p.unit || unit || "Kg",
        price: Number(p.price || 0),
        total: Number(p.total || (Number(p.price || 0) * Number(p.quantity || 1)) || 0),
      })),
      harvestDate: harvestDate || new Date().toISOString().split("T")[0],
      harvestTime: harvestTime || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      day: day || "Today",
      unit: unit || "Kg",
      rejectionQty: Number(rejectionQty || 0),
      totalQuantity,
      totalAmount,
      amount: totalAmount,
      status,
      deliveryStatus,
      paymentStatus,
      orderDate: new Date(),
      timeline: [
        {
          status,
          at: new Date(),
          note: `Order created by ${req.user?.role === "FARMER_MANAGER" ? "Manager" : "Vendor"}`,
        },
      ],
    });

    await order.save();

    // Deduct stock from FarmerProduct grades if available
    for (const item of products || []) {
      const prodId = item.id || item.productId;
      if (prodId) {
        const prod = await FarmerProduct.findOne({ id: prodId, farmerId });
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
      cropName: products?.[0]?.name || "Produce",
      quantity: totalQuantity,
      ratePerKg: totalQuantity > 0 ? Math.round(totalAmount / totalQuantity) : 0,
      grossEarnings: totalAmount,
      deductions: 0,
      netEarnings: totalAmount,
      status: paymentStatus === "Paid" ? "Paid" : "Pending",
    }).catch(() => {});

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

    const farmer = await Farmer.findOne({ id: farmerId });
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    let doc = await FarmerDocument.findOne({ farmerId, type });
    if (!doc) {
      doc = new FarmerDocument({
        id: `doc-${farmerId}-${type}`,
        vendorId: farmer.vendorId,
        managerId: farmer.managerId,
        farmerId,
        name: type === "aadhaar" ? "Aadhaar / ID Proof" : type === "pan" ? "PAN" : type.toUpperCase(),
        type,
      });
    }

    doc.fileName = fileName || doc.fileName;
    doc.fileUrl = fileUrl || doc.fileUrl || "";
    doc.uploadedAt = new Date();
    doc.status = "Pending";
    doc.rejectionReason = "";

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
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "Confirmed", "Processing"]] }, 1, 0] } },
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
      recentOrders: recentOrders.map((ord) => ({ ...ord, farmerName: farmerNameMap.get(ord.farmerId) || "—" })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed" });
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
    const farmers = await Farmer.find(assignedFarmerQuery(req)).select("id name status").lean();
    const farmerIds = farmers.map((f) => f.id);
    const farmerNameMap = new Map(farmers.map((f) => [f.id, f.name]));

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
      });
    }

    const [productAgg, orderAgg, earningAgg, recentOrders, lowStockProducts] = await Promise.all([
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
            pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["New", "Confirmed", "Processing"]] }, 1, 0] } },
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
        .select("id farmerId products totalQuantity totalAmount status orderDate")
        .lean(),
      FarmerProduct.find({ farmerId: { $in: farmerIds } })
        .select("farmerId name grades stock lowStockLimit")
        .lean()
        .then((rows) => rows.filter((p) => Number(p.stock || 0) <= Number(p.lowStockLimit || 10)).slice(0, 20)),
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
      recentOrders: recentOrders.map((ord) => ({
        ...ord,
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
    const farmerIds = farmers.map((f) => f.id);
    if (!farmerIds.length) return res.json({ farmers, orders: [] });
    const farmerMap = new Map(farmers.map((f) => [f.id, f]));
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
      return { ...o, farmerName: o.farmerName || f?.name || "—", farmerMobile: f?.mobile || "" };
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
      filter.farmerId = farmerId;
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
