export const SOFT_DELETE_FIELDS = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: "" },
};

export const STATUS_HISTORY_FIELDS = {
  statusHistory: [
    {
      status: { type: String, default: "" },
      changedBy: { type: String, default: "" },
      changedAt: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    },
  ],
};

export function withErpBase(definition, extras = {}) {
  return {
    companyId: { type: String, default: "GGC", index: true },
    status: { type: String, default: "ACTIVE", index: true },
    ...SOFT_DELETE_FIELDS,
    ...STATUS_HISTORY_FIELDS,
    ...definition,
    ...extras,
  };
}

export function uniqueIndex(schema, field) {
  schema.index({ [field]: 1 }, { unique: true });
}

export function pushStatus(doc, status, changedBy = "", note = "") {
  if (!doc.statusHistory) doc.statusHistory = [];
  doc.statusHistory.push({ status, changedBy, changedAt: new Date(), note });
  doc.status = status;
}
