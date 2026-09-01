import { generateId } from "./idGenerator.js";
import { AuditLog, ErpTransaction } from "../models/index.js";

const SENSITIVE = /password|secret|token|privatekey|apikey|accountnumber|passwordhash/i;

function redact(value) {
  if (value && typeof value === "object") {
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE.test(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  return value;
}

export async function recordAudit(input = {}, session) {
  const erpModule = String(input.erpModule || input.module || "GEN").toUpperCase();
  const auditId = await generateId({ module: "AUD", auditModule: erpModule }, session);
  const payload = {
    auditId,
    module: erpModule,
    recordId: input.recordId || "",
    action: input.action || "UPDATE",
    changedBy: input.changedBy || input.userId || "",
    userId: input.userId || "",
    role: input.role || "",
    dateTime: new Date(),
    fieldChanged: input.fieldChanged || "",
    oldValue: redact(input.oldValue),
    newValue: redact(input.newValue),
    approvalStatus: input.approvalStatus || "",
    ipAddress: input.ipAddress || "",
    deviceInfo: input.deviceInfo || "",
    status: "ACTIVE",
  };
  if (session) {
    const created = await AuditLog.create([payload], { session });
    return created[0];
  }
  return AuditLog.create(payload);
}

export async function recordErpTransaction(input = {}, session) {
  const txnModule = String(input.module || "GEN").toUpperCase();
  const erpTransactionId = await generateId({ module: "ERP", txnModule }, session);
  const payload = {
    erpTransactionId,
    module: txnModule,
    transactionType: input.transactionType || input.action || "",
    recordId: input.recordId || "",
    userId: input.userId || "",
    dateTime: new Date(),
    status: input.status || "ACTIVE",
    linkedDocuments: input.linkedDocuments || [],
    approval: input.approval || "",
    auditTrail: input.auditTrail || [],
  };
  if (session) {
    const created = await ErpTransaction.create([payload], { session });
    return created[0];
  }
  return ErpTransaction.create(payload);
}

export function auditFromReq(req) {
  return {
    userId: req.user?.id || req.user?.userId || "",
    role: req.user?.role || "",
    changedBy: req.user?.name || req.user?.email || req.user?.id || "",
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
    deviceInfo: String(req.headers["user-agent"] || "").slice(0, 240),
  };
}
