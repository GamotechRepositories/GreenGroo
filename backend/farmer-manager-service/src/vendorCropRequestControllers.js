import crypto from "crypto";
import { Crop as ErpCrop } from "../../erp-service/src/models/produce.js";
import { Farmer, VendorCrop, VendorCropRequest } from "./models.js";

const ACTIVE_CROP_FILTER = { isDeleted: { $ne: true } };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || "";
}

export function catalogCropSummary(crop) {
  return {
    cropId: crop.cropId,
    cropName: crop.cropName || "",
    variety: crop.variety || "",
    category: crop.category || "",
    cropCode: crop.cropCode || "",
    season: crop.season || "",
  };
}

export function serializeVendorCropRequest(doc) {
  const { _id, __v, ...rest } = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return rest;
}

/** One row per crop name + variety from the admin crop master (ErpCrop holds a record per farmer). */
async function distinctCatalogCrops(match = {}) {
  const rows = await ErpCrop.aggregate([
    { $match: { ...ACTIVE_CROP_FILTER, ...match } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { name: { $toLower: { $trim: { input: "$cropName" } } }, variety: { $toLower: { $trim: { input: { $ifNull: ["$variety", ""] } } } } },
        cropId: { $first: "$cropId" },
        cropName: { $first: "$cropName" },
        variety: { $first: "$variety" },
        category: { $first: "$category" },
        cropCode: { $first: "$cropCode" },
        season: { $first: "$season" },
        farmerCount: { $addToSet: "$farmerId" },
      },
    },
    { $sort: { cropName: 1, variety: 1 } },
  ]);
  return rows.map((row) => ({ ...catalogCropSummary(row), farmerCount: row.farmerCount.filter(Boolean).length }));
}

/** VendorCrop rows merged with the live crop master; `catalogMissing` marks crops admin deleted. */
export async function vendorCropsWithCatalog(vendorId) {
  const rows = await VendorCrop.find({ vendorId }).sort({ createdAt: -1 }).lean();
  const ids = rows.map((r) => r.cropId);
  const crops = ids.length ? await ErpCrop.find({ cropId: { $in: ids }, ...ACTIVE_CROP_FILTER }).lean() : [];
  const byId = new Map(crops.map((c) => [c.cropId, catalogCropSummary(c)]));
  return rows.map(({ _id, __v, ...row }) => {
    const live = byId.get(row.cropId);
    return { ...row, ...(live || {}), catalogMissing: !live };
  });
}

/** Exactly the crops in the vendor's "My Crops" (admin-approved for this vendor). */
export async function vendorAvailableCrops(vendorId) {
  if (!vendorId) return [];
  const rows = await vendorCropsWithCatalog(vendorId);
  return rows
    .map((row) => ({
      cropId: row.cropId,
      cropName: String(row.cropName || "").trim(),
      variety: String(row.variety || "").trim(),
      category: row.category || "",
      cropCode: row.cropCode || "",
      season: row.season || "",
    }))
    .filter((row) => row.cropName);
}

/** Empty vendor variety means any variety of that crop is allowed. */
export function isCropAvailableForVendor(available, cropName, variety) {
  const name = String(cropName || "").trim().toLowerCase();
  const v = String(variety || "").trim().toLowerCase();
  return available.some(
    (c) => c.cropName.toLowerCase() === name && (!c.variety || c.variety.toLowerCase() === v)
  );
}

export async function listFarmerVendorCrops(req, res) {
  try {
    const farmer = await Farmer.findOne({ id: req.user?.farmerId || req.user?.id }).select("id vendorId").lean();
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    res.json({ vendorId: farmer.vendorId || "", crops: await vendorAvailableCrops(farmer.vendorId) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crops" });
  }
}

export async function listVendorCatalogCrops(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const match = {};
    if (req.query.category) match.category = String(req.query.category);
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      match.$or = [{ cropName: rx }, { variety: rx }, { cropId: rx }, { cropCode: rx }];
    }
    const [crops, categories, added, pending] = await Promise.all([
      distinctCatalogCrops(match),
      ErpCrop.distinct("category", ACTIVE_CROP_FILTER),
      VendorCrop.find({ vendorId }).select("cropId cropName variety").lean(),
      VendorCropRequest.find({ vendorId, status: "Pending" }).select("cropId cropName variety").lean(),
    ]);
    const keyOf = (c) => `${String(c.cropName || "").trim().toLowerCase()}:::${String(c.variety || "").trim().toLowerCase()}`;
    const addedKeys = new Set(added.map(keyOf));
    const pendingKeys = new Set(pending.map(keyOf));
    res.json({
      total: crops.length,
      categories: categories.filter(Boolean).sort(),
      crops: crops.map((c) => ({ ...c, added: addedKeys.has(keyOf(c)), requested: pendingKeys.has(keyOf(c)) })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crops" });
  }
}

export async function listVendorMyCrops(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const [crops, requests] = await Promise.all([
      vendorCropsWithCatalog(vendorId),
      VendorCropRequest.find({ vendorId }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ crops, requests: requests.map(serializeVendorCropRequest) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load crops" });
  }
}

export async function createVendorCropRequest(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const cropId = String(req.body?.cropId || "").trim();
    if (!cropId) return res.status(400).json({ message: "Select a crop from All Crops" });
    const crop = await ErpCrop.findOne({ cropId, ...ACTIVE_CROP_FILTER }).lean();
    if (!crop) return res.status(404).json({ message: "This crop is not available in the admin crop list" });

    const sameCrop = {
      vendorId,
      cropName: new RegExp(`^${escapeRegex(String(crop.cropName || "").trim())}$`, "i"),
      variety: new RegExp(`^${escapeRegex(String(crop.variety || "").trim())}$`, "i"),
    };
    const [alreadyAdded, pending] = await Promise.all([
      VendorCrop.exists(sameCrop),
      VendorCropRequest.exists({ ...sameCrop, status: "Pending" }),
    ]);
    if (alreadyAdded) return res.status(409).json({ message: "This crop is already in My Crops" });
    if (pending) return res.status(409).json({ message: "A request for this crop is already waiting for approval" });

    const request = await VendorCropRequest.create({
      id: `vcr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      vendorId,
      ...catalogCropSummary(crop),
      notes: String(req.body?.notes || "").trim().slice(0, 500),
      status: "Pending",
    });
    res.status(201).json(serializeVendorCropRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to send crop request" });
  }
}

export async function cancelVendorCropRequest(req, res) {
  try {
    const request = await VendorCropRequest.findOne({ id: req.params.requestId, vendorId: vendorIdOf(req) });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending") {
      return res.status(400).json({ message: `This request is already ${request.status.toLowerCase()}` });
    }
    request.status = "Cancelled";
    await request.save();
    res.json(serializeVendorCropRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to cancel request" });
  }
}
