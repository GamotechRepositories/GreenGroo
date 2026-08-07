import mongoose from "mongoose";

/**
 * Per-store (per delivery manager) inventory.
 * Stock is reduced when an order is assigned / delivered from this store.
 */
const storeInventorySchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    stockCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

storeInventorySchema.index({ managerId: 1, sku: 1 }, { unique: true });

storeInventorySchema.virtual("inStock").get(function inStock() {
  return this.stockCount > 0;
});

storeInventorySchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    managerId: this.managerId.toString(),
    sku: this.sku,
    name: this.name,
    category: this.category,
    unit: this.unit,
    price: this.price,
    stockCount: this.stockCount,
    lowStockThreshold: this.lowStockThreshold,
    inStock: this.stockCount > 0,
    isLowStock: this.stockCount > 0 && this.stockCount <= this.lowStockThreshold,
    isActive: this.isActive,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.StoreInventory) {
  delete mongoose.models.StoreInventory;
}

const StoreInventory = mongoose.model("StoreInventory", storeInventorySchema);

export default StoreInventory;
