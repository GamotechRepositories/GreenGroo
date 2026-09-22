import mongoose from "mongoose";

const RETURN_STATUSES = [
  "awaiting_assignment",
  "assigned",
  "qr_scanned",
  "proof_pending",
  "picked_up",
  "returned_to_store",
  "successful",
  "cancelled",
];

const returnPickupSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminRefundClaim",
      required: true,
      index: true,
    },
    sourceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    sourceStoreOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreOrder",
      default: null,
    },
    orderNumber: { type: String, default: "", trim: true, index: true },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    darkStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryManager",
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: ["retail", "bulk"],
      default: "retail",
      index: true,
    },
    type: {
      type: String,
      enum: ["refund", "warranty"],
      default: "refund",
    },
    reason: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0, min: 0 },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    customerAddress: { type: String, default: "", trim: true },
    customerLat: { type: Number, default: null },
    customerLng: { type: Number, default: null },
    status: {
      type: String,
      enum: RETURN_STATUSES,
      default: "awaiting_assignment",
      index: true,
    },
    assignedRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },
    pickupQrUnlocked: { type: Boolean, default: true },
    pickupQrScanned: { type: Boolean, default: false },
    pickupQrScannedAt: { type: Date, default: null },
    pickupProofImageUrl: { type: String, default: "" },
    pickupProofStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    pickupProofSubmittedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    returnedToStoreAt: { type: Date, default: null },
    successfulAt: { type: Date, default: null },
    adminNote: { type: String, default: "", trim: true },
    managerNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

returnPickupSchema.index({ managerId: 1, status: 1, createdAt: -1 });
returnPickupSchema.index({ assignedRiderId: 1, status: 1 });

returnPickupSchema.methods.toSafeJSON = function toSafeJSON(extras = {}) {
  return {
    id: this._id.toString(),
    claimId: this.claimId ? this.claimId.toString() : null,
    sourceOrderId: this.sourceOrderId ? this.sourceOrderId.toString() : null,
    orderNumber: this.orderNumber || "",
    managerId: this.managerId ? this.managerId.toString() : "",
    darkStoreId: this.darkStoreId ? this.darkStoreId.toString() : "",
    accountType: this.accountType || "retail",
    type: this.type || "refund",
    reason: this.reason || "",
    amount: this.amount || 0,
    customerName: this.customerName || "",
    customerPhone: this.customerPhone || "",
    customerAddress: this.customerAddress || "",
    customerLat: this.customerLat,
    customerLng: this.customerLng,
    status: this.status,
    assignedRiderId: this.assignedRiderId ? this.assignedRiderId.toString() : null,
    assignedAt: this.assignedAt,
    pickupQrUnlocked: this.pickupQrUnlocked !== false,
    pickupQrScanned: Boolean(this.pickupQrScanned),
    pickupQrScannedAt: this.pickupQrScannedAt,
    pickupProofImageUrl: this.pickupProofImageUrl || "",
    pickupProofStatus: this.pickupProofStatus || "none",
    pickupProofSubmittedAt: this.pickupProofSubmittedAt,
    pickedUpAt: this.pickedUpAt,
    returnedToStoreAt: this.returnedToStoreAt,
    successfulAt: this.successfulAt,
    adminNote: this.adminNote || "",
    managerNote: this.managerNote || "",
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ...extras,
  };
};

const ReturnPickup =
  mongoose.models.ReturnPickup || mongoose.model("ReturnPickup", returnPickupSchema);

export default ReturnPickup;
export { RETURN_STATUSES };
