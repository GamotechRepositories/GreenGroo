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
    /** Same as managerId — Dark Store ownership key */
    darkStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
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
        "order_received",
        "stock_issue",
        "packed",
        "offered",
        "assigned",
        "pickup_verified",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "order_received",
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: [
        "NONE",
        "SEARCHING_FOR_DRIVER",
        "WAITING_FOR_DRIVER",
        "OFFER_SENT",
        "DRIVER_ACCEPTED",
        "DRIVER_ASSIGNED",
        "DRIVER_AT_STORE",
        "PICKUP_PENDING",
        "PICKUP_VERIFIED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      default: "NONE",
      index: true,
    },
    currentOfferDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    offerStartedAt: { type: Date },
    excludedDriverIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryBoy",
      },
    ],
    pickupVerified: { type: Boolean, default: false },
    pickupVerifiedAt: { type: Date },
    pickupVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      default: null,
    },
    customerAddressUnlocked: { type: Boolean, default: false },
    offeredRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    offerExpiresAt: { type: Date },
    roundRobinRidersAttempted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryBoy",
      },
    ],
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    darkStoreQrCode: { type: String, default: "" },
    qrScannedAt: { type: Date },
    customerLat: { type: Number, default: null },
    customerLng: { type: Number, default: null },
    distanceKm: { type: Number, default: null },
    otpCode: { type: String, default: "4321" },
    packedAt: { type: Date },
    stockDeductedAt: { type: Date },
    assignedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String, default: "" },
    sourceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

storeOrderSchema.index({ managerId: 1, status: 1, createdAt: -1 });
storeOrderSchema.index({ sourceOrderId: 1 }, { unique: true, sparse: true });

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
    darkStoreId: (this.darkStoreId || this.managerId).toString(),
    city: this.city,
    cityId: this.cityId,
    area: this.area,
    customerName: this.customerName,
    customerPhone: this.customerPhone,
    customerAddress: this.customerAddress,
    customerLat: this.customerLat,
    customerLng: this.customerLng,
    distanceKm: this.distanceKm,
    items,
    status: this.status,
    assignmentStatus: this.assignmentStatus || "NONE",
    currentOfferDriverId: this.currentOfferDriverId
      ? this.currentOfferDriverId.toString()
      : null,
    offerStartedAt: this.offerStartedAt,
    excludedDriverIds: (this.excludedDriverIds || []).map((id) => id.toString()),
    pickupVerified: Boolean(this.pickupVerified),
    pickupVerifiedAt: this.pickupVerifiedAt,
    customerAddressUnlocked: Boolean(this.customerAddressUnlocked),
    offeredRiderId: this.offeredRiderId ? this.offeredRiderId.toString() : null,
    offerExpiresAt: this.offerExpiresAt,
    assignedRiderId: this.assignedRiderId
      ? this.assignedRiderId.toString()
      : null,
    darkStoreQrCode: this.darkStoreQrCode || `DARKSTORE_${this.managerId}`,
    qrScannedAt: this.qrScannedAt,
    otpCode: this.otpCode || "4321",
    packedAt: this.packedAt,
    stockDeductedAt: this.stockDeductedAt,
    assignedAt: this.assignedAt,
    deliveredAt: this.deliveredAt,
    notes: this.notes,
    sourceOrderId: this.sourceOrderId ? this.sourceOrderId.toString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.StoreOrder) {
  delete mongoose.models.StoreOrder;
}

const StoreOrder = mongoose.model("StoreOrder", storeOrderSchema);

export default StoreOrder;
