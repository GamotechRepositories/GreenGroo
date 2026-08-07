import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "pcs" },
    price: { type: Number, default: 0 },
    customerInformed: { type: Boolean, default: false },
    customerInformedAt: { type: Date },
  },
  { _id: true }
);

const storeOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
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
    city: { type: String, trim: true, default: "" },
    cityId: { type: String, trim: true, default: "", index: true },
    area: { type: String, trim: true, default: "", index: true },
    customerName: { type: String, trim: true, default: "Customer" },
    customerPhone: { type: String, trim: true, default: "" },
    customerAddress: { type: String, required: true, trim: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, "Order must have at least one item"],
    },
    status: {
      type: String,
      enum: [
        "incoming",
        "stock_issue",
        "assigned",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "incoming",
      index: true,
    },
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    assignedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

storeOrderSchema.methods.toSafeJSON = function toSafeJSON(stockMap = null) {
  const items = this.items.map((item) => {
    const base = {
      id: item._id.toString(),
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      customerInformed: item.customerInformed,
      customerInformedAt: item.customerInformedAt,
    };
    if (stockMap) {
      const stock = stockMap.get(item.sku);
      const available = stock ? stock.stockCount : 0;
      base.availableStock = available;
      base.stockStatus =
        available >= item.quantity ? "available" : "out_of_stock";
    }
    return base;
  });

  return {
    id: this._id.toString(),
    orderNumber: this.orderNumber,
    managerId: this.managerId.toString(),
    city: this.city,
    cityId: this.cityId,
    area: this.area,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    customerAddress: this.customerAddress,
    items,
    status: this.status,
    assignedRiderId: this.assignedRiderId
      ? this.assignedRiderId.toString()
      : null,
    assignedAt: this.assignedAt,
    deliveredAt: this.deliveredAt,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.StoreOrder) {
  delete mongoose.models.StoreOrder;
}

const StoreOrder = mongoose.model("StoreOrder", storeOrderSchema);

export default StoreOrder;
