import {
  Farmer,
  FarmerManager,
  Vendor,
  FarmerCrop,
  FarmerCropPlan,
  FarmerProduct,
  FarmerStockHistory,
  FarmerOrder,
  FarmerEarning,
  FarmerDocument,
  FarmerHarvestOrder,
  Pickup,
  QualityInspection,
} from "../../../farmer-manager-service/src/models.js";
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function farmerKeys(farmer) {
  return [...new Set([farmer?.farmerId, farmer?.id, farmer?.farmerCode].filter(Boolean))];
}

function byFarmerKeys(farmer) {
  return { farmerId: { $in: farmerKeys(farmer) } };
}

function countByFarmer(rows, farmer) {
  const keys = new Set(farmerKeys(farmer));
  return rows.filter((row) => keys.has(row.farmerId)).length;
}

export async function listFarmers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const q = String(req.query.q || "").trim();
    const filter = { isDeleted: { $ne: true } };
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { farmerId: rx },
        { id: rx },
        { name: rx },
        { mobile: rx },
        { farmerCode: rx },
        { "address.village": rx },
        { "address.taluka": rx },
        { "address.district": rx },
        { farmName: rx },
      ];
    }
    const [items, total] = await Promise.all([
      Farmer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("-password").lean(),
      Farmer.countDocuments(filter),
    ]);
    const allKeys = [...new Set(items.flatMap(farmerKeys))];
    const managerIds = [...new Set(items.map((f) => f.managerId).filter(Boolean))];
    const vendorIds = [...new Set(items.map((f) => f.vendorId).filter(Boolean))];
    const [farms, erpCrops, farmerCrops, products, orders, managers, vendors] = await Promise.all([
      Farm.find({ farmerId: { $in: allKeys } }).lean(),
      Crop.find({ farmerId: { $in: allKeys } }).lean(),
      FarmerCrop.find({ farmerId: { $in: allKeys } }).lean(),
      FarmerProduct.find({ farmerId: { $in: allKeys } }).lean(),
      FarmerOrder.find({ farmerId: { $in: allKeys } }).lean(),
      managerIds.length
        ? FarmerManager.find({ id: { $in: managerIds } }).select("id name mobile").lean()
        : [],
      vendorIds.length
        ? Vendor.find({ id: { $in: vendorIds } }).select("id vendorName ownerName").lean()
        : [],
    ]);
    const managerById = Object.fromEntries(managers.map((m) => [m.id, m]));
    const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));
    res.json({
      success: true,
      page,
      limit,
      total,
      items: items.map((f) => {
        const cropCount = countByFarmer(farmerCrops, f) || countByFarmer(erpCrops, f);
        return {
          farmerId: f.farmerId || f.id,
          sourceId: f.id,
          farmerCode: f.farmerCode,
          fullName: f.name,
          mobile: f.mobile,
          email: f.email,
          village: f.address?.village || f.farmGeo?.village,
          taluka: f.address?.taluka || f.farmGeo?.taluka,
          district: f.address?.district || f.farmGeo?.district,
          state: f.address?.state || "",
          kycStatus: f.kycStatus,
          bankStatus: f.bankVerificationStatus,
          status: f.status,
          farmName: f.farmName || f.farm?.farmName,
          farmCount: countByFarmer(farms, f) || (f.farm?.farmId || f.farmName ? 1 : 0),
          cropCount,
          productCount: countByFarmer(products, f),
          orderCount: countByFarmer(orders, f),
          managerId: f.managerId,
          managerName: managerById[f.managerId]?.name || "",
          vendorId: f.vendorId,
          vendorName: vendorById[f.vendorId]?.vendorName || vendorById[f.vendorId]?.ownerName || "",
          profilePhoto: f.profileImage,
          createdAt: f.createdAt,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to list farmers" });
  }
}

export async function listFarmerManagers(req, res) {
  try {
    const managers = await FarmerManager.find({}).select("-password").sort({ createdAt: -1 }).lean();
    const ids = managers.map((m) => m.id);
    const farmers = ids.length
      ? await Farmer.find({ managerId: { $in: ids }, isDeleted: { $ne: true } })
          .select("managerId status")
          .lean()
      : [];
    const counts = {};
    const active = {};
    for (const f of farmers) {
      counts[f.managerId] = (counts[f.managerId] || 0) + 1;
      if (["Active", "ACTIVE"].includes(f.status)) {
        active[f.managerId] = (active[f.managerId] || 0) + 1;
      }
    }
    res.json({
      success: true,
      total: managers.length,
      items: managers.map((m) => ({
        id: m.id,
        name: m.name,
        mobile: m.mobile,
        email: m.email,
        city: m.city,
        state: m.state,
        location: m.location || [m.city, m.state].filter(Boolean).join(", "),
        status: m.status,
        vendorId: m.vendorId,
        joiningDate: m.joiningDate,
        farmerCount: counts[m.id] || 0,
        activeFarmers: active[m.id] || 0,
        profileImage: m.profileImage,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to list farmer managers" });
  }
}

export async function getFarmer360(req, res) {
  try {
    const id = decodeURIComponent(String(req.params.id || "")).trim();
    const farmer = await Farmer.findOne({
      isDeleted: { $ne: true },
      $or: [{ farmerId: id }, { id }, { farmerCode: id }],
    })
      .select("-password")
      .lean();
    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });
    const farmerId = farmer.farmerId || farmer.id;
    const related = byFarmerKeys(farmer);
    const [
      farms,
      erpCrops,
      farmerCrops,
      cropPlans,
      articles,
      batches,
      products,
      stockHistory,
      orders,
      earnings,
      documents,
      harvests,
      pickups,
      inspections,
      manager,
      vendor,
    ] = await Promise.all([
      Farm.find(related).lean(),
      Crop.find(related).lean(),
      FarmerCrop.find(related).sort({ createdAt: -1 }).lean(),
      FarmerCropPlan.find(related).sort({ createdAt: -1 }).lean(),
      Article.find(related).lean(),
      Batch.find(related).lean(),
      FarmerProduct.find(related).sort({ createdAt: -1 }).lean(),
      FarmerStockHistory.find(related).sort({ at: -1, createdAt: -1 }).limit(50).lean(),
      FarmerOrder.find(related).sort({ createdAt: -1 }).limit(50).lean(),
      FarmerEarning.find(related).sort({ date: -1, createdAt: -1 }).lean(),
      FarmerDocument.find(related).sort({ createdAt: -1 }).lean(),
      FarmerHarvestOrder.find(related).sort({ date: -1, createdAt: -1 }).lean(),
      Pickup.find(related).sort({ createdAt: -1 }).limit(50).lean(),
      QualityInspection.find(related).sort({ createdAt: -1 }).limit(50).lean(),
      farmer.managerId
        ? FarmerManager.findOne({ id: farmer.managerId }).select("-password").lean()
        : null,
      farmer.vendorId ? Vendor.findOne({ id: farmer.vendorId }).select("-password").lean() : null,
    ]);
    const crops = farmerCrops.length ? farmerCrops : erpCrops;
    const chain = await TraceabilityService.getByFarmerId(farmerId);
    const production =
      harvests.reduce((s, h) => s + (h.totalQuantity || 0), 0) ||
      batches.reduce((s, b) => s + (b.quantity || 0), 0);
    const payments = earnings.reduce((s, e) => s + (e.netEarnings || 0), 0);
    res.json({
      success: true,
      farmer: {
        ...farmer,
        farmerId,
        sourceId: farmer.id,
        fullName: farmer.name,
        village: farmer.address?.village || farmer.farmGeo?.village,
        taluka: farmer.address?.taluka || farmer.farmGeo?.taluka,
        district: farmer.address?.district || farmer.farmGeo?.district,
        state: farmer.address?.state,
        pincode: farmer.address?.pincode || farmer.farmGeo?.pincode,
        bankStatus: farmer.bankVerificationStatus,
        farmPhotos: farmer.farm?.farmPhotos || [],
        farmVideos: farmer.farm?.farmVideos || [],
        farmLocation: farmer.farmGeo || farmer.farmLocation,
        managerName: manager?.name || "",
        vendorName: vendor?.vendorName || vendor?.ownerName || "",
      },
      manager,
      vendor,
      farms: farms.length
        ? farms
        : farmer.farm?.farmId || farmer.farmName
          ? [
              {
                farmId: farmer.farm?.farmId || farmerId,
                farmName: farmer.farmName || farmer.farm?.farmName,
                area: farmer.farm?.totalFarmArea || farmer.farmArea,
                areaUnit: farmer.farm?.totalFarmAreaUnit || "Acre",
                soilType: farmer.farm?.soilType,
                irrigationType: farmer.farm?.irrigationType,
                waterSource: farmer.farm?.waterSource,
                farmLocation: farmer.farmLocation,
                address: farmer.farmAddress || farmer.farmGeo?.farmAddress,
              },
            ]
          : [],
      crops,
      cropPlans,
      erpCrops,
      articles: articles.length ? articles : products,
      products,
      stockHistory,
      batches,
      orders,
      earnings,
      documents,
      harvests,
      pickups,
      inspections,
      production,
      payments,
      chain,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load farmer" });
  }
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
