import mongoose from "mongoose";
import { ORDER_TYPES, deriveOrderType } from "../../../legacy/utils/departmentHelpers.js";

/** Last known rider position for live tracking (GeoJSON Point, [lng, lat]). */
const driverLocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryBoy", default: null },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "pcs" },
    price: { type: Number, default: 0 },
    customerInformed: { type: Boolean, default: false },
    customerInformedAt: { type: Date },
    /** preorder | ready2cook | instant */
    department: { type: String, trim: true, default: "" },
    /** Department-wise product id, e.g. "PR-28-R2C3" */
    departmentId: { type: String, trim: true, default: "" },
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
        /** Pre-order still with the Product Manager — not actionable by the Delivery Manager */
        "preorder_hold",
        "incoming",
        "order_received",
        "stock_issue",
        "packed",
        "offered",
        "assigned",
        "pickup_verified",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
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
        "FAILED",
        "BATCH_WAITING",
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
    /** Drivers who declined this order — never re-offer to them (not cleared on retry). */
    declinedDriverIds: [
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
    pickupQrScanned: { type: Boolean, default: false },
    pickupQrScannedAt: { type: Date },
    pickupProofImageUrl: { type: String, default: "" },
    pickupProofStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    pickupProofSubmittedAt: { type: Date },
    pickupProofApprovedAt: { type: Date },
    pickupProofApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      default: null,
    },
    customerLat: { type: Number, default: null },
    customerLng: { type: Number, default: null },
    distanceKm: { type: Number, default: null },
    otpCode: { type: String, default: "4321" },
    packedAt: { type: Date },
    stockDeductedAt: { type: Date },
    assignedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String, default: "" },
    /** Optional rider note on successful delivery */
    deliveryComment: { type: String, default: "", trim: true },
    /** Required when status is delivery_failed */
    failureReason: { type: String, default: "", trim: true },
    failedAt: { type: Date },
    failedByRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    /** Rider-reported delay; the manager decides when to forward it to the customer */
    deliveryDelay: {
      minutes: { type: Number, default: 0 },
      reason: { type: String, default: "", trim: true },
      reportedAt: { type: Date },
      expectedBy: { type: Date },
      customerNotifiedAt: { type: Date },
    },
    /** ETA promised when the rider left with the parcel; delay is measured against it */
    dispatchEta: {
      seconds: { type: Number, default: null },
      distanceMeters: { type: Number, default: null },
      expectedAt: { type: Date, default: null },
      computedAt: { type: Date, default: null },
      source: { type: String, default: "" },
    },

    // ── Same-route batching ─────────────────────────────────────────────────
    routeBatchWindowEndsAt: { type: Date },
    /** False until 5-min same-route wait ends OR a companion is batched */
    pickupQrUnlocked: { type: Boolean, default: false },
    batchId: { type: String, default: "", index: true },
    batchSequence: { type: Number, default: 0 },
    /** Linked primary order when this was attached as same-route companion */
    batchPrimaryOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreOrder",
      default: null,
      index: true,
    },
    routeCompatibility: {
      compatible: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      distanceBetweenKm: { type: Number, default: null },
      suggestedSequence: { type: [String], default: [] },
    },

    sourceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    /**
     * A mixed cart becomes two store orders for one customer order:
     * "now" (Ready2Cook / Instant, sent immediately) and "preorder" (held for the slot).
     * Empty for single-department orders.
     */
    sourcePart: { type: String, enum: ["", "now", "preorder"], default: "" },
    /** "delivery" = rider takes it home; "pickup" = customer collects at the dark store */
    fulfillmentType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
      index: true,
    },
    /** Departments in this order (preorder / ready2cook / instant) */
    departments: { type: [String], default: [], index: true },
    /** ready_to_cook | instant get live rider tracking; preorder gets status updates only */
    orderType: { type: String, enum: ORDER_TYPES, index: true },
    /** Throttled copy of the rider's live position while this order is on the way */
    driverLocation: { type: driverLocationSchema, default: undefined },
    /** How the dark store was chosen, e.g. within_3km / same_pincode */
    routingReason: { type: String, trim: true, default: "" },

    // ── Pre-order (next-day slot) workflow ──────────────────────────────────
    // Product Manager prepares (pending → preparing → ready) and forwards to the
    // Delivery Manager, who assigns a rider manually. Never auto-dispatched.
    isPreOrder: { type: Boolean, default: false, index: true },
    preOrderSlot: { type: String, default: "", trim: true },
    /** YYYY-MM-DD (IST) */
    preOrderDate: { type: String, default: "", trim: true, index: true },
    preOrderStage: {
      type: String,
      enum: ["", "pending", "preparing", "ready", "forwarded"],
      default: "",
      index: true,
    },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    forwardedAt: { type: Date },
    forwardedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    forwardedByName: { type: String, default: "", trim: true },
    /** Note from Product Manager to Delivery Manager (packing / handling info) */
    preOrderNote: { type: String, default: "", trim: true, maxlength: 500 },

    // ── Full-Time driver delivery (salary-based; never earns per-KM) ─────────
    fullTimeDelivery: { type: Boolean, default: false, index: true },
    fullTimeAssignedAt: { type: Date },
    fullTimeAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      default: null,
    },

    // ── Payment fields (extended for delivery workflow) ─────────────────────
    paymentMethod: {
      type: String,
      enum: ["COD", "online", "wallet", ""],
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "collected", "paid_online", "failed", ""],
      default: "pending",
    },
    amountToCollect: { type: Number, default: 0 },
    amountCollected: { type: Number, default: 0 },

    // ── Delivery proof / OTP (extended) ─────────────────────────────────────
    deliveryProofImageUrl: { type: String, default: "" },
    proofUploadedAt: { type: Date },
    /** customerOtpVerified flags OTP validated on backend */
    customerOtpVerified: { type: Boolean, default: false },
    customerOtpVerifiedAt: { type: Date },
    /** OTP attempt tracking to prevent brute-force */
    otpAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date },

    // ── Shift reference: set when rider accepts; used for earning slab lookup ─
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
      index: true,
    },

    // ── Distance & rider earning (calculated by backend on delivery) ─────────
    deliveryDistanceKm: { type: Number, default: 0 },
    riderDeliveryEarning: { type: Number, default: 0 },
    earningSlab: {
      minKm: { type: Number, default: 0 },
      maxKm: { type: Number, default: 0 },
      riderAmount: { type: Number, default: 0 },
    },
    earningCalculatedAt: { type: Date },
    /** Immutable snapshot when earning is finalized (protects history if manager changes rates). */
    earningSnapshot: {
      darkStoreId: { type: String, default: "" },
      sourceLat: { type: Number, default: null },
      sourceLng: { type: Number, default: null },
      sourceAddress: { type: String, default: "" },
      customerLat: { type: Number, default: null },
      customerLng: { type: Number, default: null },
      customerAddress: { type: String, default: "" },
      distanceKm: { type: Number, default: 0 },
      /** Manager slab amount applied (existing KM-slab config). */
      slabMinKm: { type: Number, default: 0 },
      slabMaxKm: { type: Number, default: 0 },
      slabRiderAmount: { type: Number, default: 0 },
      shiftId: { type: String, default: "" },
      riderEarning: { type: Number, default: 0 },
      calculatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

storeOrderSchema.index({ managerId: 1, status: 1, createdAt: -1 });
storeOrderSchema.index({ sourceOrderId: 1 });
storeOrderSchema.index({ isPreOrder: 1, preOrderDate: 1, preOrderStage: 1 });
storeOrderSchema.index({ driverLocation: "2dsphere" });

storeOrderSchema.pre("validate", function deriveStoreOrderType() {
  if (
    this.isNew ||
    this.isModified("isPreOrder") ||
    this.isModified("sourcePart") ||
    this.isModified("departments")
  ) {
    this.orderType = deriveOrderType(this);
  }
});

export function deliveryDelayJSON(delay) {
  if (!delay || !(delay.minutes > 0)) return null;
  return {
    minutes: delay.minutes,
    reason: delay.reason || "",
    reportedAt: delay.reportedAt || null,
    expectedBy: delay.expectedBy || null,
    customerNotifiedAt: delay.customerNotifiedAt || null,
  };
}

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
      department: item.department || "",
      departmentId: item.departmentId || "",
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

  const itemsTotal = Math.round(
    (this.items || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    )
  );
  const amountToCollect = Number(this.amountToCollect || 0);
  const deliveryFee = Math.max(0, Math.round(amountToCollect - itemsTotal));

  const startAt = this.assignedAt || this.packedAt || this.createdAt;
  const endAt = this.deliveredAt || null;
  let tripDurationMinutes = null;
  if (startAt && endAt) {
    tripDurationMinutes = Math.max(
      0,
      Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
    );
  }

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
    itemsTotal,
    deliveryFee,
    orderTotal: amountToCollect > 0 ? amountToCollect : itemsTotal + deliveryFee,
    status: this.status,
    assignmentStatus: this.assignmentStatus || "NONE",
    currentOfferDriverId: this.currentOfferDriverId
      ? this.currentOfferDriverId.toString()
      : null,
    offerStartedAt: this.offerStartedAt,
    excludedDriverIds: (this.excludedDriverIds || []).map((id) => id.toString()),
    declinedDriverIds: (this.declinedDriverIds || []).map((id) => id.toString()),
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
    pickupQrScanned: Boolean(this.pickupQrScanned || this.qrScannedAt),
    pickupQrScannedAt: this.pickupQrScannedAt || this.qrScannedAt,
    pickupProofImageUrl: this.pickupProofImageUrl || "",
    pickupProofStatus: this.pickupProofStatus || "none",
    pickupProofSubmittedAt: this.pickupProofSubmittedAt,
    pickupProofApprovedAt: this.pickupProofApprovedAt,
    otpCode: this.otpCode || "4321",
    packedAt: this.packedAt,
    stockDeductedAt: this.stockDeductedAt,
    assignedAt: this.assignedAt,
    deliveredAt: this.deliveredAt,
    tripDurationMinutes,
    notes: this.notes,
    deliveryComment: this.deliveryComment || "",
    failureReason: this.failureReason || "",
    failedAt: this.failedAt,
    failedByRiderId: this.failedByRiderId
      ? this.failedByRiderId.toString()
      : null,
    deliveryDelay: deliveryDelayJSON(this.deliveryDelay),
    dispatchEta: this.dispatchEta?.expectedAt
      ? {
          seconds: this.dispatchEta.seconds,
          distanceMeters: this.dispatchEta.distanceMeters,
          expectedAt: this.dispatchEta.expectedAt,
          source: this.dispatchEta.source || "",
        }
      : null,
    routeBatchWindowEndsAt: this.routeBatchWindowEndsAt,
    pickupQrUnlocked: Boolean(this.pickupQrUnlocked),
    batchId: this.batchId || "",
    batchSequence: this.batchSequence || 0,
    batchPrimaryOrderId: this.batchPrimaryOrderId
      ? this.batchPrimaryOrderId.toString()
      : null,
    routeCompatibility: this.routeCompatibility || null,
    sourceOrderId: this.sourceOrderId ? this.sourceOrderId.toString() : null,
    sourcePart: this.sourcePart || "",
    fulfillmentType: this.fulfillmentType || "delivery",
    departments: this.departments || [],
    orderType: this.orderType || deriveOrderType(this),
    routingReason: this.routingReason || "",
    // Pre-order
    isPreOrder: Boolean(this.isPreOrder),
    preOrderSlot: this.preOrderSlot || "",
    preOrderDate: this.preOrderDate || "",
    preOrderStage: this.preOrderStage || "",
    preparingAt: this.preparingAt,
    readyAt: this.readyAt,
    forwardedAt: this.forwardedAt,
    forwardedByName: this.forwardedByName || "",
    preOrderNote: this.preOrderNote || "",
    fullTimeDelivery: Boolean(this.fullTimeDelivery),
    fullTimeAssignedAt: this.fullTimeAssignedAt || null,
    // Payment
    paymentMethod: this.paymentMethod || "",
    paymentStatus: this.paymentStatus || "pending",
    amountToCollect: amountToCollect,
    amountCollected: this.amountCollected || 0,
    // Delivery proof / OTP
    deliveryProofImageUrl: this.deliveryProofImageUrl || "",
    proofUploadedAt: this.proofUploadedAt,
    customerOtpVerified: Boolean(this.customerOtpVerified),
    customerOtpVerifiedAt: this.customerOtpVerifiedAt,
    // Shift & earning
    shiftId: this.shiftId ? this.shiftId.toString() : null,
    deliveryDistanceKm: this.deliveryDistanceKm || 0,
    riderDeliveryEarning: this.riderDeliveryEarning || 0,
    earningSlab: this.earningSlab
      ? { minKm: this.earningSlab.minKm, maxKm: this.earningSlab.maxKm, riderAmount: this.earningSlab.riderAmount }
      : null,
    earningCalculatedAt: this.earningCalculatedAt,
    earningSnapshot: this.earningSnapshot
      ? {
          darkStoreId: this.earningSnapshot.darkStoreId || "",
          sourceLat: this.earningSnapshot.sourceLat,
          sourceLng: this.earningSnapshot.sourceLng,
          sourceAddress: this.earningSnapshot.sourceAddress || "",
          customerLat: this.earningSnapshot.customerLat,
          customerLng: this.earningSnapshot.customerLng,
          customerAddress: this.earningSnapshot.customerAddress || "",
          distanceKm: this.earningSnapshot.distanceKm || 0,
          slabMinKm: this.earningSnapshot.slabMinKm || 0,
          slabMaxKm: this.earningSnapshot.slabMaxKm || 0,
          slabRiderAmount: this.earningSnapshot.slabRiderAmount || 0,
          shiftId: this.earningSnapshot.shiftId || "",
          riderEarning: this.earningSnapshot.riderEarning || 0,
          calculatedAt: this.earningSnapshot.calculatedAt,
        }
      : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const RIDER_CLOSED_STATUSES = new Set(["delivered", "cancelled", "delivery_failed"]);

/**
 * What a rider may see: customer phone from assignment, address only after the
 * pickup is approved, and neither once the order is closed.
 */
storeOrderSchema.methods.toRiderJSON = function toRiderJSON() {
  const json = this.toSafeJSON();
  const closed = RIDER_CLOSED_STATUSES.has(this.status);
  if (closed) {
    json.customerName = "Customer";
    json.customerPhone = "";
  }
  if (closed || !this.customerAddressUnlocked) {
    json.customerAddress = "";
    json.customerLat = null;
    json.customerLng = null;
    if (json.earningSnapshot) {
      json.earningSnapshot.customerAddress = "";
      json.earningSnapshot.customerLat = null;
      json.earningSnapshot.customerLng = null;
    }
  }
  return json;
};

if (mongoose.models.StoreOrder) {
  delete mongoose.models.StoreOrder;
}

const StoreOrder = mongoose.model("StoreOrder", storeOrderSchema);

export default StoreOrder;
