import { generateId, ErpCounter } from "./idGenerator.js";
import { resolveLocation } from "./locationResolver.js";
import { farmerSerialFromId, cropCodeFromName, categoryFromName, varietyCodeFromName } from "../config/idRegistry.js";
import { Farm, Crop, Article, QrCode } from "../models/index.js";
import { FarmerCrop, FarmerCropPlan, FarmerProduct, FarmerStockHistory, FarmerOrder, FarmerHarvestOrder } from "../../../farmer-manager-service/src/models.js";
import { recordAudit } from "./auditService.js";

const LEGACY_CROP_ID = /^GGC-CRP-([A-Z0-9]+)-(\d+)$/i;

export function isLegacyCropId(id = "") {
  return LEGACY_CROP_ID.test(String(id));
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cropIdSerial(id = "") {
  const last = String(id).split("-").pop();
  return /^\d+$/.test(last) ? last.padStart(5, "0") : "00001";
}

/** True when ID already has variety segment: GGC-CRP-CAT-CROP-VAR-SERIAL */
export function cropIdHasVariety(id = "") {
  const parts = String(id).toUpperCase().split("-").filter(Boolean);
  return (
    parts[0] === "GGC" &&
    parts[1] === "CRP" &&
    parts.length >= 6 &&
    !/^\d+$/.test(parts[3]) &&
    !/^\d+$/.test(parts[4]) &&
    /^\d+$/.test(parts[parts.length - 1])
  );
}

export function buildCropBusinessId({ category, cropCode, varietyCode, serial }) {
  return `GGC-CRP-${String(category).toUpperCase()}-${String(cropCode).toUpperCase()}-${String(varietyCode).toUpperCase()}-${String(serial).padStart(5, "0")}`;
}

/**
 * Same cropName + variety → one shared Crop ID (with variety code) for every farmer.
 * Updates cropId only; keeps unique document id.
 */
export async function ensureSharedCropBusinessId(farmerCrop) {
  if (!farmerCrop) return farmerCrop;
  const cropName = String(farmerCrop.cropName || "").trim();
  const variety = String(farmerCrop.variety || "").trim();
  if (!cropName) return farmerCrop;

  const cropCode = cropCodeFromName(cropName);
  const category = categoryFromName(cropName);
  const varietyCode = varietyCodeFromName(variety);

  const siblings = await FarmerCrop.find({
    cropName: new RegExp(`^${escapeRegex(cropName)}$`, "i"),
    ...(variety
      ? { variety: new RegExp(`^${escapeRegex(variety)}$`, "i") }
      : {}),
  }).sort({ createdAt: 1 });

  if (!siblings.length) return farmerCrop;

  // Prefer earliest ID that already includes variety; else earliest serial
  const withVariety = siblings.find((c) => cropIdHasVariety(c.cropId || c.id));
  const anchor = withVariety || siblings[0];
  const serial = cropIdSerial(anchor.cropId || anchor.id);
  const targetId = buildCropBusinessId({ category, cropCode, varietyCode, serial });

  for (const sibling of siblings) {
    const oldCropId = String(sibling.cropId || sibling.id || "").trim();
    if (oldCropId === targetId) continue;

    sibling.previousCropId = oldCropId;
    sibling.cropId = targetId;
    await sibling.save();

    await Promise.all([
      FarmerCropPlan.updateMany(
        { farmerId: sibling.farmerId, $or: [{ cropId: oldCropId }, { cropId: sibling.id }] },
        { $set: { cropId: targetId } }
      ),
      FarmerProduct.updateMany(
        { farmerId: sibling.farmerId, cropId: oldCropId },
        { $set: { cropId: targetId } }
      ),
      Crop.updateMany(
        { $or: [{ cropId: oldCropId }, { sourceCropId: sibling.id }] },
        { $set: { cropId: targetId, cropCode, category } }
      ),
      Article.updateMany({ cropId: oldCropId }, { $set: { cropId: targetId } }),
      QrCode.updateMany(
        { $or: [{ cropId: oldCropId }, { entityId: oldCropId }] },
        { $set: { cropId: targetId, entityId: targetId } }
      ),
    ]);
  }

  const seq = Number(serial);
  if (Number.isFinite(seq)) {
    await ErpCounter.findOneAndUpdate(
      { key: `crop-${category}-${cropCode}-${varietyCode}` },
      { $max: { sequence: seq } },
      { upsert: true }
    );
  }

  // Reload current doc so caller sees updated cropId
  const fresh = await FarmerCrop.findById(farmerCrop._id);
  return fresh || farmerCrop;
}

export async function upgradeCropIdWithCropCode(farmerCrop) {
  // Delegate to shared+variety normalizer (keeps ID same across farmers)
  return ensureSharedCropBusinessId(farmerCrop);
}

export function isProperProductArtId(id = "") {
  const parts = String(id).toUpperCase().split("-").filter(Boolean);
  return (
    parts[0] === "GGC" &&
    parts[1] === "ART" &&
    parts.length >= 5 &&
    !["A", "B", "C"].includes(parts[3]) &&
    /^\d+$/.test(parts[parts.length - 1])
  );
}

export async function upgradeFarmerProductId(product) {
  if (!product) return product;
  const oldId = product.productId || product.id;
  if (isProperProductArtId(oldId)) return product;

  const cropCode = cropCodeFromName(product.cropName || product.productName || product.name);
  const category = categoryFromName(product.cropName || product.productName || product.name);
  const newId = await generateId({ module: "ART", category, crop: cropCode });
  if (newId === oldId) return product;

  const taken = await FarmerProduct.exists({
    _id: { $ne: product._id },
    $or: [{ id: newId }, { productId: newId }],
  });
  if (taken) return product;

  product.previousProductId = oldId;
  product.id = newId;
  product.productId = newId;
  await product.save();

  await Promise.all([
    FarmerStockHistory.updateMany({ productId: oldId }, { $set: { productId: newId } }),
    FarmerOrder.updateMany({ productId: oldId }, { $set: { productId: newId } }),
    FarmerHarvestOrder.updateMany({ productId: oldId }, { $set: { productId: newId } }),
    Article.updateMany({ sourceProductId: oldId }, { $set: { sourceProductId: newId } }),
    QrCode.updateMany(
      { $or: [{ entityId: oldId }, { articleId: oldId }] },
      { $set: { entityId: newId } }
    ),
  ]);
  return product;
}

export async function assignFarmerBusinessId(payload = {}) {
  const loc = await resolveLocation({
    state: payload.state || payload.address?.state || "Maharashtra",
    district: payload.district || payload.address?.district || "",
    taluka: payload.taluka || payload.address?.taluka || "",
    village: payload.village || payload.address?.village || "",
  });
  const farmerId = await generateId({
    module: "FR",
    state: loc.stateCode,
    district: loc.districtCode,
    taluka: loc.talukaCode,
  });
  return { farmerId, loc };
}

export async function ensureFarmForFarmer(farmer, _loc = {}, actor = {}) {
  const farmerId = farmer.farmerId || farmer.id;
  const existing = await Farm.findOne({ farmerId, isDeleted: { $ne: true } });
  if (existing) {
    if (!farmer.farm) farmer.farm = {};
    farmer.farm.farmId = existing.farmId;
    return existing;
  }
  const farmId = await generateId({
    module: "FM",
    farmerSerial: farmerSerialFromId(farmerId),
    farmerId,
  });
  const farm = await Farm.create({
    farmId,
    farmerId,
    farmName: farmer.farmName || farmer.farm?.farmName || "",
    farmNumber: "01",
    farmLocation: farmer.farmLocation || "",
    latitude: farmer.farmGeo?.latitude ?? null,
    longitude: farmer.farmGeo?.longitude ?? null,
    address: farmer.farmAddress || farmer.farmGeo?.farmAddress || "",
    area: Number(farmer.farm?.totalFarmArea || 0),
    areaUnit: farmer.farm?.totalFarmAreaUnit || "Acre",
    soilType: farmer.farm?.soilType || "",
    irrigationType: farmer.farm?.irrigationType || "",
    waterSource: farmer.farm?.waterSource || "",
    status: "ACTIVE",
  });
  if (!farmer.farm) farmer.farm = {};
  farmer.farm.farmId = farmId;
  await recordAudit({
    erpModule: "FM",
    recordId: farmId,
    action: "CREATE",
    ...actor,
    newValue: { farmId, farmerId },
  });
  return farm;
}

export async function syncFarmerCropToErp(farmerCrop, farmer, actor = {}) {
  const cropCode = cropCodeFromName(farmerCrop.cropName);
  const category = categoryFromName(farmerCrop.cropName);
  const varietyCode = varietyCodeFromName(farmerCrop.variety);
  const existing = await Crop.findOne({
    $or: [{ sourceCropId: farmerCrop.id }, { cropId: farmerCrop.cropId }],
  });
  if (existing) return existing;
  const cropId = String(farmerCrop.cropId || "").startsWith("GGC-CRP-")
    ? farmerCrop.cropId
    : await generateId({ module: "CRP", category, crop: cropCode, variety: varietyCode });
  const crop = await Crop.create({
    cropId,
    farmerId: farmer.farmerId || farmer.id,
    farmId: farmerCrop.farmId || farmer.farm?.farmId || "",
    category,
    cropName: farmerCrop.cropName,
    cropCode,
    variety: farmerCrop.variety || "",
    sowingDate: farmerCrop.sowingDate || "",
    expectedHarvestDate: farmerCrop.expectedHarvestDate || "",
    expectedProduction: farmerCrop.estimatedQuantity || 0,
    availableQuantity: farmerCrop.estimatedQuantity || 0,
    sourceCropId: farmerCrop.id,
    irrigationType: farmerCrop.irrigationType || farmer.farm?.irrigationType || "",
    status: farmerCrop.status || "ACTIVE",
  });
  if (crop.farmId) {
    await Farm.updateOne({ farmId: crop.farmId }, { $inc: { cropCount: 1 } });
  }
  await recordAudit({
    erpModule: "CRP",
    recordId: cropId,
    action: "CREATE",
    ...actor,
    newValue: { cropId, cropCode, variety: varietyCode },
  });
  return crop;
}

export async function syncFarmerProductToErp(product, farmer, crop, actor = {}) {
  const cropCode = crop?.cropCode || cropCodeFromName(product.cropName || product.name);
  const grades = product.grades?.length
    ? product.grades.map((g) => String(g.grade || g.label || "A").replace(/grade\s*/i, "").trim().toUpperCase()[0] || "A")
    : ["A"];
  const created = [];
  for (const grade of [...new Set(grades.filter((g) => ["A", "B", "C"].includes(g)))]) {
    const existing = await Article.findOne({ sourceProductId: product.id, grade });
    if (existing) {
      created.push(existing);
      continue;
    }
    const articleId = await generateId({ module: "ART", crop: cropCode, grade });
    const qty = product.grades?.find((g) => String(g.grade).toUpperCase().includes(grade))?.quantity || product.stock || 0;
    const price = product.grades?.find((g) => String(g.grade).toUpperCase().includes(grade))?.price || product.sellingPrice || product.pricePerKg || 0;
    const article = await Article.create({
      articleId,
      cropId: crop?.cropId || product.cropId || "",
      farmerId: farmer.farmerId || farmer.id,
      cropCode,
      productName: product.productName || product.name,
      variety: product.variety || "",
      grade,
      unit: product.unit || "Kg",
      sellingPrice: price,
      purchasePrice: 0,
      availableStock: qty,
      margin: 0,
      sourceProductId: product.id,
      status: product.status || "ACTIVE",
    });
    created.push(article);
    await recordAudit({
      erpModule: "ART",
      recordId: articleId,
      action: "CREATE",
      ...actor,
      newValue: { articleId, grade },
    });
  }
  return created;
}

export async function ensureEntityQr({ entityType, entityId, links = {}, actor = {} }) {
  const existing = await QrCode.findOne({ entityType, entityId, isDeleted: { $ne: true } });
  if (existing) return existing;
  const qrId = await generateId({ module: "QR" });
  const qr = await QrCode.create({
    qrId,
    qrValue: qrId,
    entityType,
    entityId,
    farmerId: links.farmerId || "",
    farmId: links.farmId || "",
    cropId: links.cropId || "",
    articleId: links.articleId || "",
    batchId: links.batchId || "",
    crateId: links.crateId || "",
    status: "ACTIVE",
    generatedAt: new Date(),
  });
  await recordAudit({
    erpModule: "QR",
    recordId: qrId,
    action: "CREATE",
    ...actor,
    newValue: { qrId, entityType, entityId },
  });
  return qr;
}
