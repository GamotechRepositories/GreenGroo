import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "redeemed", "disabled", "expired"],
      default: "active",
      index: true,
    },
    expiresAt: { type: Date, default: null },
    issuedToName: { type: String, default: "", trim: true },
    issuedToPhone: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    redeemedAt: { type: Date, default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const dynamicPricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    minQuantity: { type: Number, required: true, min: 1, default: 10 },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 0, default: 5 },
    applyTo: { type: String, enum: ["all", "products", "categories"], default: "all" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "GreenGroccProduct" }],
    categoryNames: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const bulkSellingDealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "GreenGroccProduct", required: true },
    productName: { type: String, default: "", trim: true },
    sku: { type: String, default: "", trim: true },
    minQuantity: { type: Number, required: true, min: 1, default: 10 },
    maxQuantity: { type: Number, default: null },
    discountPercent: { type: Number, default: 5, min: 0, max: 100 },
    pricePerUnit: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

const refundClaimSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, default: "", trim: true },
    type: { type: String, enum: ["refund", "warranty"], default: "refund" },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: "pending",
      index: true,
    },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const financeLedgerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense", "payout", "settlement"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    storeName: { type: String, default: "", trim: true },
    vendorName: { type: String, default: "", trim: true },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const hrAttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeType: {
      type: String,
      enum: ["staff", "delivery_manager", "delivery_boy"],
      default: "staff",
    },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    date: { type: String, required: true, trim: true },
    clockIn: { type: Date, default: Date.now },
    clockOut: { type: Date, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const GiftCard = mongoose.models.AdminGiftCard || mongoose.model("AdminGiftCard", giftCardSchema);
export const DynamicPricingRule =
  mongoose.models.AdminDynamicPricingRule ||
  mongoose.model("AdminDynamicPricingRule", dynamicPricingRuleSchema);
export const BulkSellingDeal =
  mongoose.models.AdminBulkSellingDeal || mongoose.model("AdminBulkSellingDeal", bulkSellingDealSchema);
export const RefundClaim =
  mongoose.models.AdminRefundClaim || mongoose.model("AdminRefundClaim", refundClaimSchema);
export const FinanceLedger =
  mongoose.models.AdminFinanceLedger || mongoose.model("AdminFinanceLedger", financeLedgerSchema);
export const HrAttendance =
  mongoose.models.AdminHrAttendance || mongoose.model("AdminHrAttendance", hrAttendanceSchema);
