import { generateId } from "../services/idGenerator.js";
import { recordAudit, recordErpTransaction, auditFromReq } from "../services/auditService.js";
import { RESOURCES } from "../config/resources.js";
import { assertRefs, stripImmutable, hideSensitive, validateField } from "../utils/validation.js";
import { pushStatus } from "../models/plugins.js";
import { MODULES } from "../config/idRegistry.js";

function parsePaging(req) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const q = String(req.query.q || "").trim();
  const status = String(req.query.status || "").trim();
  return { page, limit, skip: (page - 1) * limit, q, status };
}

function searchFilter(spec, q) {
  if (!q) return {};
  return {
    $or: [
      { [spec.idField]: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { name: new RegExp(q, "i") },
      { productName: new RegExp(q, "i") },
      { cropName: new RegExp(q, "i") },
      { vendorName: new RegExp(q, "i") },
      { employeeName: new RegExp(q, "i") },
      { fullName: new RegExp(q, "i") },
    ],
  };
}

export async function listResource(req, res) {
  const spec = RESOURCES[req.params.resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown ERP resource" });
  const { page, limit, skip, q, status } = parsePaging(req);
  const filter = { isDeleted: { $ne: true }, ...searchFilter(spec, q) };
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    spec.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    spec.model.countDocuments(filter),
  ]);
  res.json({
    success: true,
    resource: req.params.resource,
    page,
    limit,
    total,
    items: items.map(hideSensitive),
  });
}

export async function getResource(req, res) {
  const spec = RESOURCES[req.params.resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown ERP resource" });
  const id = req.params.id;
  const item = await spec.model.findOne({ [spec.idField]: id, isDeleted: { $ne: true } }).lean();
  if (!item) return res.status(404).json({ success: false, message: `${spec.label} not found` });
  res.json({ success: true, item: hideSensitive(item) });
}

export async function createResource(req, res) {
  const spec = RESOURCES[req.params.resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown ERP resource" });
  if (spec.readOnly) return res.status(403).json({ success: false, message: "This resource is append-only" });
  try {
    const body = { ...req.body };
    for (const [k, v] of Object.entries(body)) {
      const err = validateField(k, v);
      if (err) return res.status(400).json({ success: false, message: err });
    }
    await assertRefs(req.params.resource, body);
    if (!body[spec.idField]) {
      body[spec.idField] = await generateId({ ...body, module: spec.module });
    }
    if (body.status && spec.statusTracked) {
      body.statusHistory = [{ status: body.status, changedBy: req.user?.id || "", changedAt: new Date() }];
    }
    const created = await spec.model.create(body);
    const actor = auditFromReq(req);
    await recordAudit({
      erpModule: spec.module,
      recordId: created[spec.idField],
      action: "CREATE",
      ...actor,
      newValue: { [spec.idField]: created[spec.idField] },
    });
    await recordErpTransaction({
      module: spec.module,
      transactionType: "CREATE",
      recordId: created[spec.idField],
      userId: actor.userId,
    });
    res.status(201).json({ success: true, item: hideSensitive(created) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Create failed" });
  }
}

export async function updateResource(req, res) {
  const spec = RESOURCES[req.params.resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown ERP resource" });
  if (spec.readOnly) return res.status(403).json({ success: false, message: "This resource cannot be updated in place" });
  try {
    const item = await spec.model.findOne({ [spec.idField]: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: `${spec.label} not found` });
    const body = stripImmutable(req.body, spec.idField);
    await assertRefs(req.params.resource, { ...item.toObject(), ...body });
    const oldStatus = item.status;
    const changes = [];
    for (const [k, v] of Object.entries(body)) {
      const err = validateField(k, v);
      if (err) return res.status(400).json({ success: false, message: err });
      if (JSON.stringify(item[k]) !== JSON.stringify(v)) {
        changes.push({ fieldChanged: k, oldValue: item[k], newValue: v });
        item[k] = v;
      }
    }
    if (body.status && body.status !== oldStatus && spec.statusTracked) {
      pushStatus(item, body.status, req.user?.id || "");
    }
    await item.save();
    const actor = auditFromReq(req);
    for (const change of changes) {
      await recordAudit({
        erpModule: spec.module,
        recordId: item[spec.idField],
        action: change.fieldChanged === "status" ? "STATUS_CHANGE" : "UPDATE",
        ...actor,
        ...change,
      });
    }
    res.json({ success: true, item: hideSensitive(item) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
}

export async function softDeleteResource(req, res) {
  const spec = RESOURCES[req.params.resource];
  if (!spec) return res.status(404).json({ success: false, message: "Unknown ERP resource" });
  const item = await spec.model.findOne({ [spec.idField]: req.params.id, isDeleted: { $ne: true } });
  if (!item) return res.status(404).json({ success: false, message: `${spec.label} not found` });
  item.isDeleted = true;
  item.deletedAt = new Date();
  item.deletedBy = req.user?.id || "";
  item.status = "CLOSED";
  await item.save();
  await recordAudit({
    erpModule: spec.module,
    recordId: item[spec.idField],
    action: "DELETE",
    ...auditFromReq(req),
    newValue: { isDeleted: true },
  });
  res.json({ success: true, message: `${spec.label} closed. Historical ID retained.` });
}

export async function listModules(_req, res) {
  res.json({
    success: true,
    companyPrefix: "GGC",
    modules: Object.entries(MODULES).map(([code, spec]) => ({
      code,
      description: spec.description,
      format: spec.formatHint,
      example: spec.example || spec.formatHint,
      serialWidth: spec.serialWidth || null,
    })),
    resources: Object.entries(RESOURCES).map(([key, spec]) => ({
      key,
      label: spec.label,
      idField: spec.idField,
      module: spec.module,
    })),
  });
}
