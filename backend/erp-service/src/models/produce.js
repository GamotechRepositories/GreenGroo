import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";

const { Schema } = mongoose;

const farmSchema = new Schema(
  withErpBase({
    farmId: { type: String, required: true },
    farmerId: { type: String, required: true, index: true },
    farmName: { type: String, default: "" },
    farmNumber: { type: String, default: "" },
    farmLocation: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: "" },
    area: { type: Number, default: 0 },
    areaUnit: { type: String, default: "Acre" },
    soilType: { type: String, default: "" },
    irrigationType: { type: String, default: "" },
    waterSource: { type: String, default: "" },
    cropCount: { type: Number, default: 0 },
    expectedHarvest: { type: String, default: "" },
    productionEstimate: { type: Number, default: 0 },
    photos: [{ type: String }],
    videos: [{ type: String }],
    labTests: [
      {
        type: { type: String, default: "" },
        reportUrl: { type: String, default: "" },
        result: { type: String, default: "" },
        testedAt: { type: Date, default: null },
      },
    ],
  }),
  { timestamps: true, collection: "farms" }
);
uniqueIndex(farmSchema, "farmId");
farmSchema.index({ farmerId: 1, createdAt: -1 });

const cropSchema = new Schema(
  withErpBase({
    cropId: { type: String, required: true },
    farmerId: { type: String, default: "", index: true },
    farmId: { type: String, default: "", index: true },
    category: { type: String, default: "VEG", index: true },
    cropName: { type: String, required: true },
    cropCode: { type: String, default: "", index: true },
    variety: { type: String, default: "" },
    season: { type: String, default: "" },
    sowingDate: { type: String, default: "" },
    expectedHarvestDate: { type: String, default: "" },
    actualHarvestDate: { type: String, default: "" },
    availableQuantity: { type: Number, default: 0 },
    expectedProduction: { type: Number, default: 0 },
    demand: { type: Number, default: 0 },
    procurementStatus: { type: String, default: "PENDING" },
    salesStatus: { type: String, default: "PENDING" },
    sourceCropId: { type: String, default: "" },
    irrigationType: { type: String, default: "" },
  }),
  { timestamps: true, collection: "crops" }
);
uniqueIndex(cropSchema, "cropId");
cropSchema.index({ farmerId: 1, farmId: 1 });
cropSchema.index({ cropCode: 1, category: 1 });

const articleSchema = new Schema(
  withErpBase({
    articleId: { type: String, required: true },
    cropId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    cropCode: { type: String, default: "", index: true },
    productName: { type: String, required: true },
    variety: { type: String, default: "" },
    grade: { type: String, enum: ["A", "B", "C"], default: "A", index: true },
    size: { type: String, default: "" },
    unit: { type: String, default: "Kg" },
    sellingPrice: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    margin: { type: Number, default: 0 },
    sourceProductId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "articles" }
);
uniqueIndex(articleSchema, "articleId");
articleSchema.index({ cropId: 1, grade: 1 });

const batchSchema = new Schema(
  withErpBase({
    batchId: { type: String, required: true },
    farmerId: { type: String, default: "", index: true },
    farmId: { type: String, default: "", index: true },
    cropId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    harvestDate: { type: String, default: "" },
    arrivalDate: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    unit: { type: String, default: "Kg" },
    grade: { type: String, enum: ["A", "B", "C", "REJECTED", ""], default: "" },
    currentLocationType: { type: String, default: "" },
    currentLocationId: { type: String, default: "", index: true },
    expiryDate: { type: String, default: "" },
    bestBeforeDate: { type: String, default: "" },
    collectionCentreId: { type: String, default: "", index: true },
    warehouseId: { type: String, default: "", index: true },
    qualityCheckId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "batches" }
);
uniqueIndex(batchSchema, "batchId");

const crateSchema = new Schema(
  withErpBase({
    crateId: { type: String, required: true },
    batchId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    weight: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    currentLocationType: { type: String, default: "" },
    currentLocationId: { type: String, default: "" },
    qrId: { type: String, default: "", index: true },
    damageStatus: { type: String, default: "NONE" },
    lastScannedAt: { type: Date, default: null },
  }),
  { timestamps: true, collection: "crates" }
);
uniqueIndex(crateSchema, "crateId");

const qrSchema = new Schema(
  withErpBase({
    qrId: { type: String, required: true },
    qrValue: { type: String, required: true },
    entityType: { type: String, default: "CRATE", index: true },
    entityId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    farmId: { type: String, default: "" },
    cropId: { type: String, default: "" },
    articleId: { type: String, default: "" },
    batchId: { type: String, default: "", index: true },
    crateId: { type: String, default: "", index: true },
    generatedAt: { type: Date, default: Date.now },
    lastScannedAt: { type: Date, default: null },
  }),
  { timestamps: true, collection: "qr_codes" }
);
uniqueIndex(qrSchema, "qrId");
qrSchema.index({ qrValue: 1 }, { unique: true });

export const Farm = mongoose.models.ErpFarm || mongoose.model("ErpFarm", farmSchema);
export const Crop = mongoose.models.ErpCrop || mongoose.model("ErpCrop", cropSchema);
export const Article = mongoose.models.ErpArticle || mongoose.model("ErpArticle", articleSchema);
export const Batch = mongoose.models.ErpBatch || mongoose.model("ErpBatch", batchSchema);
export const Crate = mongoose.models.ErpCrate || mongoose.model("ErpCrate", crateSchema);
export const QrCode = mongoose.models.ErpQrCode || mongoose.model("ErpQrCode", qrSchema);
