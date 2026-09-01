import { generateId } from "./idGenerator.js";
import { todayYmd, cropCodeFromName } from "../config/idRegistry.js";
import { Batch, QualityCheck, Crate, Article } from "../models/index.js";
import { ensureEntityQr } from "./farmerSync.js";
import { applyStockMovement } from "./inventoryService.js";
import { recordAudit } from "./auditService.js";

function primaryGrade(inspection) {
  const a = Number(inspection.gradeAQuantity) || 0;
  const b = Number(inspection.gradeBQuantity) || 0;
  const c = Number(inspection.gradeCQuantity) || 0;
  if (a >= b && a >= c && a > 0) return "A";
  if (b >= c && b > 0) return "B";
  if (c > 0) return "C";
  return "REJECTED";
}

export async function syncQualityToErp({ inspection, pickup, order, farmer, centre }) {
  try {
    const farmerId = farmer?.farmerId || farmer?.id || inspection.farmerId;
    const cropCode = cropCodeFromName(order?.productName || order?.cropName || "VEG");
    const grade = primaryGrade(inspection);
    const qty =
      (Number(inspection.gradeAQuantity) || 0) +
      (Number(inspection.gradeBQuantity) || 0) +
      (Number(inspection.gradeCQuantity) || 0);

    let article = await Article.findOne({
      farmerId,
      cropCode,
      grade: grade === "REJECTED" ? "C" : grade,
      isDeleted: { $ne: true },
    });
    if (!article) {
      article = await Article.findOne({ farmerId, isDeleted: { $ne: true } });
    }

    const batchId = await generateId({ module: "BAT" });
    const batch = await Batch.create({
      batchId,
      farmerId,
      farmId: farmer?.farm?.farmId || "",
      cropId: order?.cropId || "",
      articleId: article?.articleId || "",
      harvestDate: order?.harvestDate || todayYmd(),
      arrivalDate: todayYmd(),
      quantity: qty,
      weight: pickup?.receiving?.acceptedWeight || qty,
      unit: pickup?.receiving?.weightUnit || order?.unit || "Kg",
      grade: grade === "REJECTED" ? "REJECTED" : grade,
      currentLocationType: "COLLECTION_CENTRE",
      currentLocationId: centre?.id || pickup?.collectionCentreId || "",
      collectionCentreId: centre?.id || pickup?.collectionCentreId || "",
      status: "RECEIVED",
    });

    const qualityCheckId = await generateId({ module: "QC" });
    await QualityCheck.create({
      qualityCheckId,
      orderId: order?.id || "",
      batchId,
      articleId: article?.articleId || "",
      farmerId,
      inspectorId: inspection.inspectorId || "",
      grade: grade === "REJECTED" ? "REJECTED" : grade,
      freshness: inspection.qualityParameters?.freshness || "",
      size: inspection.qualityParameters?.size || "",
      colour: inspection.qualityParameters?.colour || "",
      appearance: inspection.qualityParameters?.appearance || "",
      cleanliness: inspection.qualityParameters?.cleanliness || "",
      damage: inspection.qualityParameters?.damage || "",
      moisture: inspection.qualityParameters?.moisture || "",
      weight: inspection.qualityParameters?.weight || "",
      rejectedQuantity: Number(inspection.rejectedQuantity) || 0,
      remarks: inspection.qualityRemarks || "",
      photos: (inspection.qualityPhotos || []).map((p) => p.url || p),
      sourceInspectionId: inspection.inspectionId,
      status: "COMPLETED",
    });

    await Batch.updateOne({ batchId }, { $set: { qualityCheckId } });

    const crateId = await generateId({ module: "CRT" });
    const crate = await Crate.create({
      crateId,
      batchId,
      farmerId,
      articleId: article?.articleId || "",
      weight: batch.weight,
      currentLocationType: "COLLECTION_CENTRE",
      currentLocationId: batch.currentLocationId,
      status: "ACTIVE",
    });
    const qr = await ensureEntityQr({
      entityType: "CRATE",
      entityId: crateId,
      links: {
        farmerId,
        farmId: batch.farmId,
        cropId: batch.cropId,
        articleId: batch.articleId,
        batchId,
        crateId,
      },
    });
    crate.qrId = qr.qrId;
    await crate.save();

    if (article?.articleId && batch.currentLocationId) {
      await applyStockMovement({
        articleId: article.articleId,
        batchId,
        locationType: "COLLECTION_CENTRE",
        locationId: String(batch.currentLocationId),
        inward: qty,
        damaged: Number(inspection.rejectedQuantity) || 0,
        unitValue: article.purchasePrice || 0,
      });
    }

    await recordAudit({
      erpModule: "BAT",
      recordId: batchId,
      action: "CREATE",
      newValue: { batchId, qualityCheckId, crateId, qrId: qr.qrId },
    });
    return { batchId, qualityCheckId, crateId, qrId: qr.qrId };
  } catch (err) {
    console.warn("[ERP] quality sync failed:", err.message);
    return null;
  }
}
