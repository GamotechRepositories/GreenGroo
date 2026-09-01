import mongoose from "mongoose";
import { Farmer } from "../../../farmer-manager-service/src/models.js";
import { detectEntity } from "../config/idRegistry.js";
import { RESOURCES, ENTITY_RESOURCE } from "../config/resources.js";
import {
  Farm,
  Crop,
  Article,
  Batch,
  Crate,
  QrCode,
  QualityCheck,
  CollectionCentreMaster,
  Warehouse,
  Packaging,
  Dispatch,
  Vehicle,
  DriverMaster,
  CustomerOrder,
  Customer,
  CrmActivity,
  Invoice,
  ErpPayment,
  Inventory,
  AuditLog,
  Procurement,
} from "../models/index.js";

function lean(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

async function findByBusinessId(resourceKey, id) {
  const spec = RESOURCES[resourceKey];
  if (!spec) return null;
  return spec.model.findOne({ [spec.idField]: id, isDeleted: { $ne: true } }).lean();
}

async function findFarmer(id) {
  return Farmer.findOne({
    $or: [{ farmerId: id }, { id }],
    isDeleted: { $ne: true },
  }).lean();
}

async function listBy(model, filter, limit = 50) {
  return model.find({ ...filter, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getByFarmerId(farmerId) {
  const farmer = await findFarmer(farmerId);
  if (!farmer) return null;
  const id = farmer.farmerId || farmer.id;
  const [farms, crops, articles, batches, crates, qrs, quality, procurements] = await Promise.all([
    listBy(Farm, { farmerId: id }),
    listBy(Crop, { farmerId: id }),
    listBy(Article, { farmerId: id }),
    listBy(Batch, { farmerId: id }),
    listBy(Crate, { farmerId: id }),
    listBy(QrCode, { farmerId: id }),
    listBy(QualityCheck, { farmerId: id }),
    listBy(Procurement, { farmerId: id }),
  ]);
  return { farmer, farms, crops, articles, batches, crates, qrs, quality, procurements };
}

export async function getByFarmId(farmId) {
  const farm = await findByBusinessId("farms", farmId);
  if (!farm) return null;
  const crops = await listBy(Crop, { farmId });
  const farmer = farm.farmerId ? await findFarmer(farm.farmerId) : null;
  const batches = await listBy(Batch, { farmId });
  return { farm, farmer, crops, batches };
}

export async function getByCropId(cropId) {
  const crop = await findByBusinessId("crops", cropId);
  if (!crop) return null;
  const [farm, farmer, articles, batches] = await Promise.all([
    crop.farmId ? findByBusinessId("farms", crop.farmId) : null,
    crop.farmerId ? findFarmer(crop.farmerId) : null,
    listBy(Article, { cropId }),
    listBy(Batch, { cropId }),
  ]);
  return { crop, farm, farmer, articles, batches };
}

export async function getByArticleId(articleId) {
  const article = await findByBusinessId("articles", articleId);
  if (!article) return null;
  const [crop, farmer, batches, inventory] = await Promise.all([
    article.cropId ? findByBusinessId("crops", article.cropId) : null,
    article.farmerId ? findFarmer(article.farmerId) : null,
    listBy(Batch, { articleId }),
    listBy(Inventory, { articleId }),
  ]);
  return { article, crop, farmer, batches, inventory };
}

export async function getByBatchId(batchId) {
  const batch = await findByBusinessId("batches", batchId);
  if (!batch) return null;
  const [
    farmer,
    farm,
    crop,
    article,
    crates,
    quality,
    cc,
    warehouse,
    packaging,
    dispatch,
    inventory,
  ] = await Promise.all([
    batch.farmerId ? findFarmer(batch.farmerId) : null,
    batch.farmId ? findByBusinessId("farms", batch.farmId) : null,
    batch.cropId ? findByBusinessId("crops", batch.cropId) : null,
    batch.articleId ? findByBusinessId("articles", batch.articleId) : null,
    listBy(Crate, { batchId }),
    listBy(QualityCheck, { batchId }),
    batch.collectionCentreId
      ? findByBusinessId("collection_centres", batch.collectionCentreId)
      : null,
    batch.warehouseId ? findByBusinessId("warehouses", batch.warehouseId) : null,
    listBy(Packaging, { batchId }),
    listBy(Dispatch, { batchId }),
    listBy(Inventory, { batchId }),
  ]);
  return {
    batch,
    farmer,
    farm,
    crop,
    article,
    crates,
    quality,
    collectionCentre: cc,
    warehouse,
    packaging,
    dispatch,
    inventory,
  };
}

export async function getByCrateId(crateId) {
  const crate = await findByBusinessId("crates", crateId);
  if (!crate) return null;
  const batchChain = crate.batchId ? await getByBatchId(crate.batchId) : {};
  const qr = crate.qrId ? await findByBusinessId("qr_codes", crate.qrId) : await QrCode.findOne({ crateId }).lean();
  return { crate, qr, ...batchChain };
}

export async function getByQrId(qrId) {
  const qr = await QrCode.findOne({ $or: [{ qrId }, { qrValue: qrId }], isDeleted: { $ne: true } }).lean();
  if (!qr) return null;
  if (qr.crateId) {
    const crateChain = await getByCrateId(qr.crateId);
    return { qr, ...crateChain };
  }
  if (qr.batchId) {
    const batchChain = await getByBatchId(qr.batchId);
    return { qr, ...batchChain };
  }
  return { qr };
}

export async function getByOrderId(orderId) {
  const order = await findByBusinessId("customer_orders", orderId);
  if (!order) return null;
  const [customer, deliveries, dispatches, invoices, payments] = await Promise.all([
    order.customerId ? findByBusinessId("customers", order.customerId) : null,
    listBy(Delivery, { orderId }),
    listBy(Dispatch, { orderId }),
    listBy(Invoice, { orderId }),
    listBy(ErpPayment, { orderId }),
  ]);
  const batchIds = (order.items || []).map((i) => i.batchId).filter(Boolean);
  const batches = batchIds.length ? await Batch.find({ batchId: { $in: batchIds } }).lean() : [];
  return { order, customer, deliveries, dispatches, invoices, payments, batches };
}

export async function getByCustomerId(customerId) {
  const customer = await findByBusinessId("customers", customerId);
  if (!customer) return null;
  const [orders, invoices, payments, crm] = await Promise.all([
    listBy(CustomerOrder, { customerId }),
    listBy(Invoice, { customerId }),
    listBy(ErpPayment, { $or: [{ payerId: customerId }, { receiverId: customerId }] }),
    listBy(CrmActivity, { customerId }),
  ]);
  return { customer, orders, invoices, payments, crm };
}

export async function getByInvoiceId(invoiceId) {
  const invoice = await findByBusinessId("invoices", invoiceId);
  if (!invoice) return null;
  const [order, customer, payments] = await Promise.all([
    invoice.orderId ? getByOrderId(invoice.orderId) : null,
    invoice.customerId ? findByBusinessId("customers", invoice.customerId) : null,
    listBy(ErpPayment, { invoiceId }),
  ]);
  return { invoice, customer, payments, ...(order || {}) };
}

export async function getByPaymentId(paymentId) {
  const payment = await findByBusinessId("payments", paymentId);
  if (!payment) return null;
  const invoice = payment.invoiceId ? await findByBusinessId("invoices", payment.invoiceId) : null;
  const order = payment.orderId ? await getByOrderId(payment.orderId) : null;
  return { payment, invoice, ...(order || {}) };
}

function timelineEvent(at, title, entity, data) {
  return {
    at: at || data?.createdAt || data?.updatedAt || null,
    title,
    entity,
    id: data?.[`${entity}Id`] || data?.id || data?._id || "",
    status: data?.status || data?.paymentStatus || data?.deliveryStatus || "",
    data,
  };
}

function buildTimeline(graph) {
  const events = [];
  if (graph.farmer) events.push(timelineEvent(graph.farmer.createdAt, "Farmer registered", "farmer", graph.farmer));
  (graph.farms || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Farm created", "farm", d)));
  if (graph.farm && !graph.farms) events.push(timelineEvent(graph.farm.createdAt, "Farm", "farm", graph.farm));
  (graph.crops || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Crop", "crop", d)));
  if (graph.crop && !graph.crops) events.push(timelineEvent(graph.crop.createdAt, "Crop", "crop", graph.crop));
  (graph.articles || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Article", "article", d)));
  if (graph.article && !graph.articles) events.push(timelineEvent(graph.article.createdAt, "Article", "article", graph.article));
  (graph.batches || []).forEach((d) => events.push(timelineEvent(d.harvestDate || d.createdAt, "Batch / harvest", "batch", d)));
  if (graph.batch && !graph.batches) events.push(timelineEvent(graph.batch.createdAt, "Batch", "batch", graph.batch));
  (graph.crates || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Crate", "crate", d)));
  if (graph.crate) events.push(timelineEvent(graph.crate.createdAt, "Crate", "crate", graph.crate));
  if (graph.qr) events.push(timelineEvent(graph.qr.generatedAt, "QR generated", "qr", graph.qr));
  (graph.quality || []).forEach((d) => events.push(timelineEvent(d.inspectionDate || d.createdAt, "Quality check", "qualityCheck", d)));
  if (graph.collectionCentre) events.push(timelineEvent(graph.collectionCentre.createdAt, "Collection centre", "collectionCentre", graph.collectionCentre));
  if (graph.warehouse) events.push(timelineEvent(graph.warehouse.createdAt, "Warehouse", "warehouse", graph.warehouse));
  (graph.inventory || []).forEach((d) => events.push(timelineEvent(d.updatedAt, "Inventory", "inventory", d)));
  (graph.packaging || []).forEach((d) => events.push(timelineEvent(d.packingDate || d.createdAt, "Packaging", "packaging", d)));
  (graph.dispatch || []).forEach((d) => events.push(timelineEvent(d.dispatchDate || d.createdAt, "Dispatch", "dispatch", d)));
  (graph.dispatches || []).forEach((d) => events.push(timelineEvent(d.dispatchDate || d.createdAt, "Dispatch", "dispatch", d)));
  if (graph.order) events.push(timelineEvent(graph.order.createdAt, "Customer order", "order", graph.order));
  (graph.deliveries || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Delivery", "delivery", d)));
  if (graph.customer) events.push(timelineEvent(graph.customer.createdAt, "Customer", "customer", graph.customer));
  (graph.invoices || []).forEach((d) => events.push(timelineEvent(d.createdAt, "Invoice", "invoice", d)));
  if (graph.invoice && !graph.invoices) events.push(timelineEvent(graph.invoice.createdAt, "Invoice", "invoice", graph.invoice));
  (graph.payments || []).forEach((d) => events.push(timelineEvent(d.paymentDate || d.createdAt, "Payment", "payment", d)));
  if (graph.payment && !graph.payments) events.push(timelineEvent(graph.payment.createdAt, "Payment", "payment", graph.payment));
  return events.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
}

const LOADERS = {
  farmer: getByFarmerId,
  farm: getByFarmId,
  crop: getByCropId,
  article: getByArticleId,
  batch: getByBatchId,
  crate: getByCrateId,
  qr: getByQrId,
  order: getByOrderId,
  customer: getByCustomerId,
  invoice: getByInvoiceId,
  payment: getByPaymentId,
};

export async function getCompleteTraceability(id) {
  const raw = String(id || "").trim();
  if (!raw) return { found: false, error: "ID is required" };

  const detected = detectEntity(raw);
  let entity = detected?.entity || null;
  let graph = null;

  if (entity && LOADERS[entity]) {
    graph = await LOADERS[entity](raw);
  }

  if (!graph) {
    for (const [key, loader] of Object.entries(LOADERS)) {
      graph = await loader(raw);
      if (graph) {
        entity = key;
        break;
      }
    }
  }

  if (!graph && detected?.entity) {
    const resourceKey = ENTITY_RESOURCE[detected.entity];
    const record = resourceKey ? await findByBusinessId(resourceKey, raw) : null;
    if (record) {
      graph = { [detected.entity]: record };
      entity = detected.entity;
    }
  }

  if (!graph) {
    return { found: false, id: raw, entity: entity || "unknown" };
  }

  const recordIds = collectRecordIds(graph);
  const audits = recordIds.length
    ? await AuditLog.find({ recordId: { $in: recordIds } }).sort({ dateTime: -1 }).limit(100).lean()
    : [];

  const current = summarizeCurrent(graph);

  return {
    found: true,
    id: raw,
    entity,
    module: detected?.module || null,
    current,
    graph,
    timeline: buildTimeline(graph),
    audits,
  };
}

function collectRecordIds(graph) {
  const ids = new Set();
  const walk = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") {
      for (const k of Object.keys(value)) {
        if (/Id$/.test(k) && value[k]) ids.add(String(value[k]));
        if (k === "id" && value[k]) ids.add(String(value[k]));
      }
    }
  };
  walk(graph);
  return [...ids];
}

function summarizeCurrent(graph) {
  const batch = graph.batch || graph.batches?.[0];
  const crate = graph.crate || graph.crates?.[0];
  const quality = graph.quality?.[0];
  const order = graph.order;
  const payment = graph.payment || graph.payments?.[0];
  return {
    status: batch?.status || order?.status || graph.farmer?.status || "",
    locationType: crate?.currentLocationType || batch?.currentLocationType || "",
    locationId: crate?.currentLocationId || batch?.currentLocationId || "",
    quantity: batch?.quantity || order?.quantity || 0,
    grade: quality?.grade || batch?.grade || graph.article?.grade || "",
    quality: quality?.status || quality?.grade || "",
    orderId: order?.orderId || "",
    customerId: graph.customer?.customerId || order?.customerId || "",
    paymentStatus: payment?.paymentStatus || order?.paymentStatus || "",
  };
}

export const TraceabilityService = {
  getByFarmerId,
  getByFarmId,
  getByCropId,
  getByArticleId,
  getByBatchId,
  getByCrateId,
  getByQrId,
  getByOrderId,
  getByCustomerId,
  getByInvoiceId,
  getByPaymentId,
  getCompleteTraceability,
};
