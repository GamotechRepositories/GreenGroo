import mongoose from "mongoose";

const inventoryRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    storeName: { type: String, trim: true, default: "" },
    managerName: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    sku: { type: String, required: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "General" },
    unit: { type: String, trim: true, default: "pcs" },
    quantity: { type: Number, required: true, min: 1 },
    currentStock: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    reviewedByName: { type: String, trim: true, default: "" },
    reviewNote: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

inventoryRequestSchema.index({ managerId: 1, status: 1, createdAt: -1 });

inventoryRequestSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    requestNumber: this.requestNumber,
    managerId: this.managerId?.toString() || "",
    storeName: this.storeName,
    managerName: this.managerName,
    city: this.city,
    area: this.area,
    sku: this.sku,
    productName: this.productName,
    category: this.category,
    unit: this.unit,
    quantity: this.quantity,
    currentStock: this.currentStock,
    note: this.note,
    status: this.status,
    reviewedByName: this.reviewedByName,
    reviewNote: this.reviewNote,
    reviewedAt: this.reviewedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.InventoryRequest) {
  delete mongoose.models.InventoryRequest;
}

const InventoryRequest = mongoose.model(
  "InventoryRequest",
  inventoryRequestSchema
);

export default InventoryRequest;
