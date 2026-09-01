import { generateId } from "./idGenerator.js";
import { resolveLocation } from "./locationResolver.js";
import { farmerSerialFromId, cropCodeFromName, categoryFromName } from "../config/idRegistry.js";
import { Farm, Crop, Article, QrCode } from "../models/index.js";
import { recordAudit } from "./auditService.js";

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
  const existing = await Crop.findOne({
    $or: [{ sourceCropId: farmerCrop.id }, { cropId: farmerCrop.cropId }],
  });
  if (existing) return existing;
  const cropId = String(farmerCrop.cropId || "").startsWith("GGC-CRP-")
    ? farmerCrop.cropId
    : await generateId({ module: "CRP", category });
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
    newValue: { cropId, cropCode },
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
