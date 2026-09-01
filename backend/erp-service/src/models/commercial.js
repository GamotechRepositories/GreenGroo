import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";

const { Schema } = mongoose;

const lineItem = {
  articleId: { type: String, default: "" },
  name: { type: String, default: "" },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  unit: { type: String, default: "Kg" },
  grade: { type: String, default: "" },
};

const procurementSchema = new Schema(
  withErpBase({
    procurementId: { type: String, required: true },
    farmerId: { type: String, default: "", index: true },
    articleId: { type: String, default: "", index: true },
    batchId: { type: String, default: "", index: true },
    collectionCentreId: { type: String, default: "", index: true },
    quantity: { type: Number, default: 0 },
    purchaseRate: { type: Number, default: 0 },
    purchaseAmount: { type: Number, default: 0 },
    approvalStatus: { type: String, default: "PENDING" },
    grnStatus: { type: String, default: "PENDING" },
    paymentStatus: { type: String, default: "PENDING" },
    procurementDate: { type: String, default: "" },
  }),
  { timestamps: true, collection: "procurements" }
);
uniqueIndex(procurementSchema, "procurementId");

const purchaseOrderSchema = new Schema(
  withErpBase({
    purchaseOrderId: { type: String, required: true },
    vendorId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    items: [lineItem],
    quantity: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    approvalStatus: { type: String, default: "PENDING" },
    grnStatus: { type: String, default: "PENDING" },
    paymentStatus: { type: String, default: "PENDING" },
  }),
  { timestamps: true, collection: "purchase_orders" }
);
uniqueIndex(purchaseOrderSchema, "purchaseOrderId");

const goodsReceiptSchema = new Schema(
  withErpBase({
    grnId: { type: String, required: true },
    purchaseOrderId: { type: String, default: "", index: true },
    vendorId: { type: String, default: "", index: true },
    farmerId: { type: String, default: "", index: true },
    receivedQuantity: { type: Number, default: 0 },
    acceptedQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    qualityStatus: { type: String, default: "PENDING" },
    stockUpdated: { type: Boolean, default: false },
    receivedAt: { type: Date, default: null },
    batchId: { type: String, default: "" },
    articleId: { type: String, default: "" },
    locationType: { type: String, default: "" },
    locationId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "goods_receipts" }
);
uniqueIndex(goodsReceiptSchema, "grnId");

const vendorMasterSchema = new Schema(
  withErpBase({
    vendorId: { type: String, required: true },
    category: { type: String, default: "GEN", index: true },
    vendorName: { type: String, required: true },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    bankDetails: {
      accountHolder: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumberMasked: { type: String, default: "" },
      ifsc: { type: String, default: "" },
    },
    purchaseHistory: { type: Number, default: 0 },
    outstanding: { type: Number, default: 0 },
    performanceRating: { type: Number, default: 0 },
    relationshipStatus: { type: String, default: "ACTIVE" },
    sourceVendorId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "vendors_master" }
);
uniqueIndex(vendorMasterSchema, "vendorId");

const financeSchema = new Schema(
  withErpBase({
    financeId: { type: String, required: true },
    accountType: { type: String, default: "GEN", index: true },
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    receivables: { type: Number, default: 0 },
    payables: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    cashFlow: { type: Number, default: 0 },
    paymentPending: { type: Number, default: 0 },
  }),
  { timestamps: true, collection: "finance_accounts" }
);
uniqueIndex(financeSchema, "financeId");

const paymentSchema = new Schema(
  withErpBase({
    paymentId: { type: String, required: true },
    transactionReference: { type: String, default: "" },
    payerType: { type: String, default: "", index: true },
    payerId: { type: String, default: "", index: true },
    receiverType: { type: String, default: "", index: true },
    receiverId: { type: String, default: "", index: true },
    orderId: { type: String, default: "", index: true },
    invoiceId: { type: String, default: "", index: true },
    amount: { type: Number, default: 0 },
    mode: { type: String, default: "" },
    batchId: { type: String, default: "" },
    reconciliationStatus: { type: String, default: "PENDING" },
    paymentStatus: { type: String, default: "PENDING" },
    paymentDate: { type: String, default: "" },
  }),
  { timestamps: true, collection: "erp_payments" }
);
uniqueIndex(paymentSchema, "paymentId");

const invoiceSchema = new Schema(
  withErpBase({
    invoiceId: { type: String, required: true },
    orderId: { type: String, default: "", index: true },
    customerId: { type: String, default: "", index: true },
    vendorId: { type: String, default: "", index: true },
    items: [lineItem],
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "PENDING" },
    outstandingAmount: { type: Number, default: 0 },
    dueDate: { type: String, default: "" },
    invoiceUrl: { type: String, default: "" },
  }),
  { timestamps: true, collection: "invoices" }
);
uniqueIndex(invoiceSchema, "invoiceId");

export const Procurement = mongoose.models.ErpProcurement || mongoose.model("ErpProcurement", procurementSchema);
export const PurchaseOrder = mongoose.models.ErpPurchaseOrder || mongoose.model("ErpPurchaseOrder", purchaseOrderSchema);
export const GoodsReceipt = mongoose.models.ErpGoodsReceipt || mongoose.model("ErpGoodsReceipt", goodsReceiptSchema);
export const VendorMaster = mongoose.models.ErpVendorMaster || mongoose.model("ErpVendorMaster", vendorMasterSchema);
export const FinanceAccount = mongoose.models.ErpFinanceAccount || mongoose.model("ErpFinanceAccount", financeSchema);
export const ErpPayment = mongoose.models.ErpPayment || mongoose.model("ErpPayment", paymentSchema);
export const Invoice = mongoose.models.ErpInvoice || mongoose.model("ErpInvoice", invoiceSchema);
