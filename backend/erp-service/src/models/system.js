import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";
import { AUDIT_ACTIONS } from "../config/idRegistry.js";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  withErpBase({
    auditId: { type: String, required: true },
    module: { type: String, required: true, index: true },
    recordId: { type: String, required: true, index: true },
    action: { type: String, enum: AUDIT_ACTIONS, default: "UPDATE" },
    changedBy: { type: String, default: "" },
    userId: { type: String, default: "", index: true },
    role: { type: String, default: "" },
    dateTime: { type: Date, default: Date.now, index: true },
    fieldChanged: { type: String, default: "" },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    approvalStatus: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    deviceInfo: { type: String, default: "" },
  }),
  { timestamps: true, collection: "audit_logs" }
);
uniqueIndex(auditLogSchema, "auditId");
auditLogSchema.index({ module: 1, recordId: 1, createdAt: -1 });

const apiRegistrySchema = new Schema(
  withErpBase({
    apiId: { type: String, required: true },
    apiName: { type: String, required: true },
    vendor: { type: String, default: "" },
    system: { type: String, default: "ERP" },
    version: { type: String, default: "V1" },
    endpoint: { type: String, default: "" },
    requestCount: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    lastSync: { type: Date, default: null },
  }),
  { timestamps: true, collection: "api_registry" }
);
uniqueIndex(apiRegistrySchema, "apiId");

const erpTransactionSchema = new Schema(
  withErpBase({
    erpTransactionId: { type: String, required: true },
    module: { type: String, required: true, index: true },
    transactionType: { type: String, default: "" },
    recordId: { type: String, default: "", index: true },
    userId: { type: String, default: "" },
    dateTime: { type: Date, default: Date.now },
    linkedDocuments: [{ type: String }],
    approval: { type: String, default: "" },
    auditTrail: [{ type: String }],
  }),
  { timestamps: true, collection: "erp_transactions" }
);
uniqueIndex(erpTransactionSchema, "erpTransactionId");

const analyticsSchema = new Schema(
  withErpBase({
    analyticsId: { type: String, required: true },
    report: { type: String, required: true, index: true },
    reportDate: { type: String, default: "" },
    payload: { type: Schema.Types.Mixed, default: {} },
  }),
  { timestamps: true, collection: "analytics_reports" }
);
uniqueIndex(analyticsSchema, "analyticsId");

export const AuditLog = mongoose.models.ErpAuditLog || mongoose.model("ErpAuditLog", auditLogSchema);
export const ApiRegistry = mongoose.models.ErpApiRegistry || mongoose.model("ErpApiRegistry", apiRegistrySchema);
export const ErpTransaction = mongoose.models.ErpTransaction || mongoose.model("ErpTransaction", erpTransactionSchema);
export const AnalyticsReport = mongoose.models.ErpAnalyticsReport || mongoose.model("ErpAnalyticsReport", analyticsSchema);
