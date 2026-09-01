import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";

const { Schema } = mongoose;

const collectionCentreSchema = new Schema(
  withErpBase({
    collectionCentreId: { type: String, required: true },
    name: { type: String, required: true },
    districtId: { type: String, default: "", index: true },
    talukaId: { type: String, default: "" },
    address: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    contactNumber: { type: String, default: "" },
    managerId: { type: String, default: "" },
    farmerCount: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    gradeAQuantity: { type: Number, default: 0 },
    gradeBQuantity: { type: Number, default: 0 },
    gradeCQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    packingStatus: { type: String, default: "PENDING" },
    dispatchStatus: { type: String, default: "PENDING" },
    sourceCentreId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "collection_centres" }
);
uniqueIndex(collectionCentreSchema, "collectionCentreId");

const warehouseSchema = new Schema(
  withErpBase({
    warehouseId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    availableCapacity: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    pendingDispatch: { type: Number, default: 0 },
    temperature: { type: Number, default: null },
    inwardStock: { type: Number, default: 0 },
    outwardStock: { type: Number, default: 0 },
  }),
  { timestamps: true, collection: "warehouses" }
);
uniqueIndex(warehouseSchema, "warehouseId");

const coldStorageSchema = new Schema(
  withErpBase({
    coldStorageId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
    capacity: { type: Number, default: 0 },
    occupiedCapacity: { type: Number, default: 0 },
    batchIds: [{ type: String }],
    alertStatus: { type: String, default: "NORMAL" },
  }),
  { timestamps: true, collection: "cold_storages" }
);
uniqueIndex(coldStorageSchema, "coldStorageId");

const darkStoreSchema = new Schema(
  withErpBase({
    darkStoreId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    deliveryArea: { type: String, default: "" },
    sourceStoreId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "dark_stores" }
);
uniqueIndex(darkStoreSchema, "darkStoreId");

const inventorySchema = new Schema(
  withErpBase({
    inventoryId: { type: String, required: true },
    articleId: { type: String, required: true, index: true },
    batchId: { type: String, default: "", index: true },
    locationType: {
      type: String,
      enum: ["WAREHOUSE", "COLLECTION_CENTRE", "COLD_STORAGE", "DARK_STORE", "FARM"],
      required: true,
      index: true,
    },
    locationId: { type: String, required: true, index: true },
    openingStock: { type: Number, default: 0 },
    inwardStock: { type: Number, default: 0 },
    outwardStock: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    expiredStock: { type: Number, default: 0 },
    closingStock: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    lowStockAlert: { type: Boolean, default: false },
    unit: { type: String, default: "Kg" },
  }),
  { timestamps: true, collection: "inventories" }
);
uniqueIndex(inventorySchema, "inventoryId");
inventorySchema.index({ locationType: 1, locationId: 1, articleId: 1, batchId: 1 });

export const CollectionCentreMaster =
  mongoose.models.ErpCollectionCentre || mongoose.model("ErpCollectionCentre", collectionCentreSchema);
export const Warehouse = mongoose.models.ErpWarehouse || mongoose.model("ErpWarehouse", warehouseSchema);
export const ColdStorage = mongoose.models.ErpColdStorage || mongoose.model("ErpColdStorage", coldStorageSchema);
export const DarkStoreMaster = mongoose.models.ErpDarkStore || mongoose.model("ErpDarkStore", darkStoreSchema);
export const Inventory = mongoose.models.ErpInventory || mongoose.model("ErpInventory", inventorySchema);
