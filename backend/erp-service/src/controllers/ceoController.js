import { Farmer, FarmerCrop, FarmerProduct, FarmerOrder, FarmerEarning } from "../../../farmer-manager-service/src/models.js";
import { Farm, Crop, Article, Batch } from "../models/index.js";
import { getCeoDashboard } from "../services/ceoDashboardService.js";
import { TraceabilityService } from "../services/traceabilityService.js";
import { generateId } from "../services/idGenerator.js";
import { detectEntity, MODULES } from "../config/idRegistry.js";
import { receiveGoodsAtomic } from "../services/inventoryService.js";
import { auditFromReq } from "../services/auditService.js";
import { RESOURCES } from "../config/resources.js";

export async function ceoDashboard(_req, res) {
  try {
    const data = await getCeoDashboard();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Dashboard failed" });
  }
}

export async function globalSearch(req, res) {
  try {
    const q = String(req.query.q || req.params.id || "").trim();
    if (!q) return res.status(400).json({ success: false, message: "Search ID is required" });
    const result = await TraceabilityService.getCompleteTraceability(q);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Search failed" });
  }
}

export async function generateBusinessId(req, res) {
  try {
    const module = String(req.body.module || "").toUpperCase();
    if (!MODULES[module]) {
      return res.status(400).json({ success: false, message: `Unknown module ${module}` });
    }
    const id = await generateId({ ...req.body, module });
    res.json({ success: true, module, id, format: MODULES[module].formatHint, example: MODULES[module].example });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "ID generation failed" });
  }
}

export async function listFarmers(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const q = String(req.query.q || "").trim();
  const filter = {};
  if (q) {
    filter.$or = [
      { farmerId: new RegExp(q, "i") },
      { id: new RegExp(q, "i") },
      { name: new RegExp(q, "i") },
      { mobile: new RegExp(q, "i") },
      { farmerCode: new RegExp(q, "i") },
    ];
  }
  const [items, total] = await Promise.all([
    Farmer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("-password").lean(),
    Farmer.countDocuments(filter),
  ]);
  const ids = items.map((f) => f.farmerId || f.id);
  const [farms, crops] = await Promise.all([
    Farm.find({ farmerId: { $in: ids } }).lean(),
    Crop.find({ farmerId: { $in: ids } }).lean(),
  ]);
  const farmCount = Object.fromEntries(
    ids.map((id) => [id, farms.filter((f) => f.farmerId === id).length])
  );
  const cropCount = Object.fromEntries(
    ids.map((id) => [id, crops.filter((c) => c.farmerId === id).length])
  );
  res.json({
    success: true,
    page,
    limit,
    total,
    items: items.map((f) => ({
      farmerId: f.farmerId || f.id,
      farmerCode: f.farmerCode,
      fullName: f.name,
      mobile: f.mobile,
      village: f.address?.village || f.farmGeo?.village,
      taluka: f.address?.taluka || f.farmGeo?.taluka,
      district: f.address?.district || f.farmGeo?.district,
      kycStatus: f.kycStatus,
      bankStatus: f.bankVerificationStatus,
      status: f.status,
      farmCount: farmCount[f.farmerId || f.id] || 0,
      cropCount: cropCount[f.farmerId || f.id] || 0,
      profilePhoto: f.profileImage,
      createdAt: f.createdAt,
    })),
  });
}

export async function getFarmer360(req, res) {
  const id = req.params.id;
  const farmer = await Farmer.findOne({ $or: [{ farmerId: id }, { id }] }).select("-password").lean();
  if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });
  const farmerId = farmer.farmerId || farmer.id;
  const [farms, crops, articles, batches, products, orders, earnings] = await Promise.all([
    Farm.find({ farmerId }).lean(),
    Crop.find({ farmerId }).lean(),
    Article.find({ farmerId }).lean(),
    Batch.find({ farmerId }).lean(),
    FarmerProduct.find({ farmerId: farmer.id }).lean(),
    FarmerOrder.find({ farmerId: farmer.id }).sort({ createdAt: -1 }).limit(20).lean(),
    FarmerEarning.find({ farmerId: farmer.id }).lean(),
  ]);
  const chain = await TraceabilityService.getByFarmerId(farmerId);
  res.json({
    success: true,
    farmer: {
      ...farmer,
      farmerId,
      fullName: farmer.name,
      village: farmer.address?.village || farmer.farmGeo?.village,
      taluka: farmer.address?.taluka || farmer.farmGeo?.taluka,
      district: farmer.address?.district || farmer.farmGeo?.district,
      bankStatus: farmer.bankVerificationStatus,
      farmPhotos: farmer.farm?.farmPhotos || [],
      farmVideos: farmer.farm?.farmVideos || [],
      farmLocation: farmer.farmGeo || farmer.farmLocation,
    },
    farms,
    crops: crops.length ? crops : await FarmerCrop.find({ farmerId: farmer.id }).lean(),
    articles: articles.length ? articles : products,
    batches,
    orders,
    earnings,
    production: batches.reduce((s, b) => s + (b.quantity || 0), 0),
    payments: earnings.reduce((s, e) => s + (e.netEarnings || 0), 0),
    chain,
  });
}

export async function receiveGrn(req, res) {
  try {
    const result = await receiveGoodsAtomic({ ...req.body, actor: auditFromReq(req) });
    res.json({ success: true, item: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "GRN receive failed" });
  }
}

export async function detectId(req, res) {
  const id = String(req.query.q || req.params.id || "").trim();
  res.json({ success: true, id, detected: detectEntity(id) });
}

export async function report(req, res) {
  const resource = req.params.resource;
  const spec = RESOURCES[resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown report resource" });
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const filter = { isDeleted: { $ne: true }, createdAt: { $gte: from, $lte: to } };
  const items = await spec.model.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.json({
    success: true,
    resource,
    from,
    to,
    total: items.length,
    items,
  });
}
