import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";
import { DELIVERY_STATUSES } from "../config/idRegistry.js";

const { Schema } = mongoose;

const customerOrderSchema = new Schema(
  withErpBase({
    orderId: { type: String, required: true },
    customerId: { type: String, default: "", index: true },
    items: [
      {
        articleId: { type: String, default: "" },
        batchId: { type: String, default: "" },
        name: { type: String, default: "" },
        quantity: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    quantity: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "PENDING" },
    packingStatus: { type: String, default: "PENDING" },
    dispatchStatus: { type: String, default: "PENDING" },
    deliveryStatus: { type: String, default: "PENDING" },
    sourceOrderId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "customer_orders" }
);
uniqueIndex(customerOrderSchema, "orderId");

const deliverySchema = new Schema(
  withErpBase({
    deliveryId: { type: String, required: true },
    orderId: { type: String, default: "", index: true },
    customerId: { type: String, default: "", index: true },
    driverId: { type: String, default: "", index: true },
    vehicleId: { type: String, default: "", index: true },
    route: { type: String, default: "" },
    pickupTime: { type: Date, default: null },
    eta: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    pod: { type: String, default: "" },
    deliveryStatus: { type: String, enum: [...DELIVERY_STATUSES, "PENDING"], default: "PENDING" },
    failureReason: { type: String, default: "" },
  }),
  { timestamps: true, collection: "deliveries" }
);
uniqueIndex(deliverySchema, "deliveryId");

const vehicleSchema = new Schema(
  withErpBase({
    vehicleId: { type: String, required: true },
    vehicleType: { type: String, default: "VAN", index: true },
    registrationNumber: { type: String, default: "" },
    driverId: { type: String, default: "" },
    route: { type: String, default: "" },
    fuel: { type: Number, default: 0 },
    maintenance: { type: String, default: "" },
    deliveryCount: { type: Number, default: 0 },
    currentStatus: { type: String, default: "AVAILABLE" },
  }),
  { timestamps: true, collection: "vehicles" }
);
uniqueIndex(vehicleSchema, "vehicleId");

const driverSchema = new Schema(
  withErpBase({
    driverId: { type: String, required: true },
    name: { type: String, required: true },
    mobile: { type: String, default: "", index: true },
    city: { type: String, default: "", index: true },
    licenseNumber: { type: String, default: "" },
    vehicleId: { type: String, default: "" },
    attendance: { type: String, default: "" },
    todaysTrips: { type: Number, default: 0 },
    todaysDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    achievement: { type: String, default: "" },
    sourceDriverId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "drivers" }
);
uniqueIndex(driverSchema, "driverId");

const qualityCheckSchema = new Schema(
  withErpBase({
    qualityCheckId: { type: String, required: true },
    orderId: { type: String, default: "", index: true },
    batchId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    inspectorId: { type: String, default: "" },
    grade: { type: String, enum: ["A", "B", "C", "REJECTED", ""], default: "" },
    freshness: { type: String, default: "" },
    size: { type: String, default: "" },
    colour: { type: String, default: "" },
    appearance: { type: String, default: "" },
    cleanliness: { type: String, default: "" },
    damage: { type: String, default: "" },
    moisture: { type: String, default: "" },
    weight: { type: String, default: "" },
    rejectedQuantity: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    photos: [{ type: String }],
    inspectionDate: { type: Date, default: Date.now },
    sourceInspectionId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "quality_checks" }
);
uniqueIndex(qualityCheckSchema, "qualityCheckId");

const packagingSchema = new Schema(
  withErpBase({
    packagingId: { type: String, required: true },
    batchId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    crateId: { type: String, default: "", index: true },
    quantity: { type: Number, default: 0 },
    packageType: { type: String, default: "" },
    packageSize: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    packedBy: { type: String, default: "" },
    packingDate: { type: String, default: "" },
  }),
  { timestamps: true, collection: "packaging" }
);
uniqueIndex(packagingSchema, "packagingId");

const dispatchSchema = new Schema(
  withErpBase({
    dispatchId: { type: String, required: true },
    orderId: { type: String, default: "", index: true },
    batchId: { type: String, default: "", index: true },
    vehicleId: { type: String, default: "", index: true },
    driverId: { type: String, default: "", index: true },
    warehouseId: { type: String, default: "", index: true },
    sourceLocation: { type: String, default: "" },
    destinationLocation: { type: String, default: "" },
    dispatchDate: { type: String, default: "" },
    remarks: { type: String, default: "" },
  }),
  { timestamps: true, collection: "dispatches" }
);
uniqueIndex(dispatchSchema, "dispatchId");

const returnSchema = new Schema(
  withErpBase({
    returnId: { type: String, required: true },
    orderId: { type: String, default: "", index: true },
    customerId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    batchId: { type: String, default: "", index: true },
    quantity: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    condition: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
  }),
  { timestamps: true, collection: "returns" }
);
uniqueIndex(returnSchema, "returnId");

const damageSchema = new Schema(
  withErpBase({
    damageId: { type: String, required: true },
    damageType: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    batchId: { type: String, default: "", index: true },
    crateId: { type: String, default: "" },
    vehicleId: { type: String, default: "" },
    collectionCentreId: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    photos: [{ type: String }],
    reportedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
  }),
  { timestamps: true, collection: "damages" }
);
uniqueIndex(damageSchema, "damageId");

export const CustomerOrder = mongoose.models.ErpCustomerOrder || mongoose.model("ErpCustomerOrder", customerOrderSchema);
export const Delivery = mongoose.models.ErpDelivery || mongoose.model("ErpDelivery", deliverySchema);
export const Vehicle = mongoose.models.ErpVehicle || mongoose.model("ErpVehicle", vehicleSchema);
export const DriverMaster = mongoose.models.ErpDriver || mongoose.model("ErpDriver", driverSchema);
export const QualityCheck = mongoose.models.ErpQualityCheck || mongoose.model("ErpQualityCheck", qualityCheckSchema);
export const Packaging = mongoose.models.ErpPackaging || mongoose.model("ErpPackaging", packagingSchema);
export const Dispatch = mongoose.models.ErpDispatch || mongoose.model("ErpDispatch", dispatchSchema);
export const ReturnRecord = mongoose.models.ErpReturn || mongoose.model("ErpReturn", returnSchema);
export const Damage = mongoose.models.ErpDamage || mongoose.model("ErpDamage", damageSchema);
