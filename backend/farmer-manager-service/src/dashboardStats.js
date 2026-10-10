import {
  Farmer,
  FarmerManager,
  FarmerProduct,
  FarmerHarvestOrder,
  FarmerEarning,
  FarmerCrop,
  Pickup,
  PickupDriver,
  QualityInspection,
} from "./models.js";

// Aggregation expressions mirroring the JavaScript truthiness / Number() coercion of the original
// in-memory dashboard code, so a metric computed in MongoDB keeps the value it had in Node.
// (MongoDB treats "" as truthy; JavaScript does not.)
const truthy = (x) => ({ $and: [x, { $ne: [x, ""] }] });
const falsy = (x) => ({ $not: [truthy(x)] });
const firstTruthy = (exprs, fallback) => exprs.reduceRight((acc, x) => ({ $cond: [truthy(x), x, acc] }), fallback);
const toNumber = (x, fallback) => ({ $convert: { input: x, to: "double", onError: fallback, onNull: fallback } });
const countIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const sumIf = (cond, value) => ({ $sum: { $cond: [cond, value, 0] } });
const statusIn = (list) => ({ $in: ["$status", list] });
const containsText = (text, needle) => ({ $gte: [{ $indexOfCP: [text, needle] }, 0] });

// Number(p.stock || 0) <= Number(p.lowStockLimit || 10)
export const LOW_STOCK_EXPR = {
  $let: {
    vars: {
      s: { $cond: [truthy("$stock"), toNumber("$stock", null), 0] },
      l: { $cond: [truthy("$lowStockLimit"), toNumber("$lowStockLimit", null), 10] },
    },
    in: { $and: [{ $ne: ["$$s", null] }, { $ne: ["$$l", null] }, { $lte: ["$$s", "$$l"] }] },
  },
};

// Number(p.stock || 0) <= (Number(p.lowStockLimit) || 10)
const VENDOR_LOW_STOCK_EXPR = {
  $let: {
    vars: {
      s: { $cond: [truthy("$stock"), toNumber("$stock", null), 0] },
      l: toNumber("$lowStockLimit", 0),
    },
    in: { $and: [{ $ne: ["$$s", null] }, { $lte: ["$$s", { $cond: [truthy("$$l"), "$$l", 10] }] }] },
  },
};

// ----------------------------------------------------
// Date range (server-local calendar boundaries)
// ----------------------------------------------------
export function dashboardDateWindow(query = {}) {
  const range = String(query.range || "all").toLowerCase();
  const customStart = query.startDate;
  const customEnd = query.endDate;

  const now = new Date();
  let filterStart = null;
  let filterEnd = null;

  if (range === "today") {
    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (range === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    filterStart = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
    filterEnd = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
  } else if (range === "this_week" || range === "week") {
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    filterStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (range === "this_month" || range === "month") {
    filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === "this_year" || range === "year") {
    filterStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    filterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (range === "custom" && customStart && customEnd) {
    filterStart = new Date(customStart + "T00:00:00");
    filterEnd = new Date(customEnd + "T23:59:59.999");
  }

  const window =
    filterStart && filterEnd
      ? {
          start: filterStart,
          end: filterEnd,
          valid: !isNaN(filterStart.getTime()) && !isNaN(filterEnd.getTime()),
        }
      : null;
  return { range, window };
}

// Items without a date are always included; unparseable dates are excluded.
export function matchesDashboardDate(itemDate, window) {
  if (!window) return true;
  if (!itemDate) return true;
  const t = new Date(itemDate).getTime();
  return !isNaN(t) && t >= window.start.getTime() && t <= window.end.getTime();
}

const JS_FALSY = [null, "", 0, false];

// Superset filter for documents whose effective date (first truthy field) is not a BSON Date.
function nonDateEffectiveDateFilter(fields) {
  return {
    $or: fields.map((field, i) => ({
      ...Object.fromEntries(fields.slice(0, i).map((prev) => [prev, { $in: JS_FALSY }])),
      [field]: { $nin: JS_FALSY, $not: { $type: "date" } },
    })),
  };
}

// String/other non-Date dates are parsed with JavaScript's Date (as the original code did),
// because MongoDB's string-to-date parsing differs for non-ISO and local-time formats.
async function idsMatchingNonDateValues(Model, scope, dateFields, window) {
  const rows = await Model.aggregate([
    { $match: { $and: [scope, nonDateEffectiveDateFilter(dateFields)] } },
    { $project: { d: firstTruthy(dateFields.map((f) => `$${f}`), null) } },
    { $match: { d: { $not: { $type: ["date", "null"] } } } },
  ]);
  return rows.filter((r) => matchesDashboardDate(r.d, window)).map((r) => r._id);
}

// `dateFields` is the fallback chain the original code used (e.g. orderDate || createdAt).
// `stringDates` enables the JavaScript-parsed path for chains that can hold non-Date values;
// createdAt-only chains rely on Mongoose timestamps always writing a BSON Date.
async function dateFilterStages(Model, scope, { dateFields = ["createdAt"], window, stringDates = false }) {
  if (!window) return [];
  const extraIds = window.valid && stringDates ? await idsMatchingNonDateValues(Model, scope, dateFields, window) : [];
  const allowed = [{ _dashDate: null }];
  if (window.valid) allowed.push({ _dashDate: { $gte: window.start, $lte: window.end } });
  if (extraIds.length) allowed.push({ _id: { $in: extraIds } });
  return [
    { $addFields: { _dashDate: firstTruthy(dateFields.map((f) => `$${f}`), null) } },
    { $match: { $or: allowed } },
  ];
}

async function aggregateInRange(Model, scope, dateOptions, stages) {
  return Model.aggregate([{ $match: scope }, ...(await dateFilterStages(Model, scope, dateOptions)), ...stages]);
}

// ----------------------------------------------------
// Vendor dashboard
// ----------------------------------------------------
const FARMER_GROUP = {
  $group: {
    _id: null,
    totalFarmers: { $sum: 1 },
    activeFarmers: countIf(statusIn(["Active", "ACTIVE"])),
    farmerApprovalPending: countIf({
      $or: [statusIn(["Pending", "Pending Approval", "SUBMITTED", "pending"]), { $eq: ["$verificationStatus", "Pending"] }],
    }),
    farmerManagerAssignPending: countIf({
      $or: [falsy("$managerId"), falsy("$managerName"), { $in: ["$managerName", ["—", "Unassigned"]] }],
    }),
  },
};

const MANAGER_GROUP = {
  $group: { _id: null, totalManagers: { $sum: 1 }, activeManagers: countIf(statusIn(["Active", "ACTIVE"])) },
};

const CROP_GROUP = {
  $group: {
    _id: null,
    totalCrops: { $sum: 1 },
    growingCrops: countIf(statusIn(["Growing", "Sowing", "Planned"])),
    harvestReadyCrops: countIf(statusIn(["READY_FOR_HARVEST", "Ready for Harvest", "Harvested"])),
  },
};

const GRADE_LABEL = {
  $toUpper: {
    $convert: {
      input: firstTruthy(["$grades.label", "$grades.name", "$grades.grade"], ""),
      to: "string",
      onError: "",
      onNull: "",
    },
  },
};

const PRODUCT_FACET = {
  $facet: {
    totals: [
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          productsApprovalPending: countIf(statusIn(["Pending", "Pending Approval", "PENDING_APPROVAL", "SUBMITTED"])),
          activeProducts: countIf(statusIn(["Active", "Approved", "In Stock"])),
          totalInventory: { $sum: toNumber("$stock", 0) },
          lowStockCount: countIf(VENDOR_LOW_STOCK_EXPR),
        },
      },
    ],
    lowStock: [
      { $match: { $expr: VENDOR_LOW_STOCK_EXPR } },
      { $limit: 10 },
      { $project: { _id: 0, id: 1, name: 1, farmerId: 1, stock: 1, lowStockLimit: 1, category: 1 } },
    ],
    // Label checks run in this order, so e.g. "REJECTED" counts as C (it contains "C").
    grades: [
      { $match: { $expr: { $isArray: "$grades" } } },
      { $unwind: "$grades" },
      {
        $project: {
          qty: toNumber(firstTruthy(["$grades.quantity", "$grades.stock"], 0), 0),
          bucket: {
            $let: {
              vars: { l: GRADE_LABEL },
              in: {
                $switch: {
                  branches: [
                    { case: containsText("$$l", "A"), then: "A" },
                    { case: containsText("$$l", "B"), then: "B" },
                    { case: containsText("$$l", "C"), then: "C" },
                    { case: containsText("$$l", "REJECT"), then: "R" },
                  ],
                  default: "",
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          gradeA: sumIf({ $eq: ["$bucket", "A"] }, "$qty"),
          gradeB: sumIf({ $eq: ["$bucket", "B"] }, "$qty"),
          gradeC: sumIf({ $eq: ["$bucket", "C"] }, "$qty"),
          rejected: sumIf({ $eq: ["$bucket", "R"] }, "$qty"),
        },
      },
    ],
  },
};

const ORDER_FACET = {
  $facet: {
    totals: [
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: countIf(
            statusIn(["New", "NEW", "Confirmed", "Approved", "Processing", "PREPARING", "ACCEPTED", "Ready for pickup", "READY_FOR_PICKUP"])
          ),
          rejectedOrders: countIf(statusIn(["Rejected", "REJECTED", "Cancelled", "CANCELLED", "Failed"])),
          completedOrders: countIf(
            statusIn(["Completed", "COMPLETED", "GRADE_CONFIRMED", "ORDER_COMPLETED", "Received", "RECEIVED"])
          ),
          inProgressOrders: countIf(
            statusIn(["IN_TRANSIT", "ARRIVED", "ARRIVED_AT_CENTRE", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE", "DISPATCHED"])
          ),
          totalOrderValue: { $sum: toNumber(firstTruthy(["$totalAmount", "$orderValue", "$amount"], 0), 0) },
        },
      },
    ],
    recent: [
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          id: 1,
          orderId: 1,
          orderNumber: 1,
          farmerId: 1,
          farmerName: 1,
          productName: 1,
          cropName: 1,
          "products.name": 1,
          totalQuantity: 1,
          orderedQuantity: 1,
          unit: 1,
          totalAmount: 1,
          orderValue: 1,
          amount: 1,
          status: 1,
          orderDate: 1,
          createdAt: 1,
        },
      },
    ],
  },
};

const EARNING_GROUP = {
  $group: {
    _id: null,
    totalEarnings: { $sum: toNumber("$netEarnings", 0) },
    pendingEarnings: sumIf(statusIn(["Pending", "PAYMENT_PENDING"]), toNumber("$netEarnings", 0)),
    paidEarnings: sumIf(statusIn(["Paid", "PAID", "PAYMENT_COMPLETED"]), toNumber("$netEarnings", 0)),
  },
};

const PICKUP_GROUP = {
  $group: {
    _id: null,
    totalPickups: { $sum: 1 },
    readyPickups: countIf(statusIn(["READY_FOR_PICKUP", "READY", "PENDING", "Draft", "Ready for pickup"])),
    assignedPickups: countIf(statusIn(["DRIVER_ASSIGNED", "PICKUP_SCHEDULED", "DISPATCHED", "ARRIVED", "DRIVER_ARRIVED"])),
    incomingPickups: countIf(statusIn(["IN_TRANSIT", "PICKED_UP", "PICKUP_CONFIRMED", "On the way to centre"])),
    centrePickups: countIf(
      statusIn([
        "ARRIVED_AT_CENTRE",
        "COLLECTION_CENTRE_RECEIVED",
        "RECEIVED_AT_COLLECTION_CENTRE",
        "UNLOADING",
        "WEIGHT_CHECK",
        "RECEIVED",
        "Received",
      ])
    ),
    completedPickups: countIf(statusIn(["COMPLETED", "RECEIVED", "Received"])),
  },
};

const DRIVER_GROUP = {
  $group: {
    _id: null,
    totalDrivers: { $sum: 1 },
    activeDrivers: countIf(statusIn(["Active", "ACTIVE"])),
    driverApprovalPending: countIf({
      $or: [statusIn(["Pending", "Inactive", "Suspended"]), { $eq: ["$verificationStatus", "Pending"] }],
    }),
    onDutyDrivers: countIf({ $or: [{ $eq: ["$isAvailable", false] }, { $eq: ["$status", "On Duty"] }] }),
  },
};

const QUALITY_GROUP = {
  $group: {
    _id: null,
    totalInspections: { $sum: 1 },
    qualityPending: countIf(statusIn(["QUALITY_PENDING", "Pending", "PENDING", "SUBMITTED"])),
    qualityInProcess: countIf(statusIn(["INSPECTION", "Quality Check", "QUALITY_CHECK", "GRADING", "Grading"])),
    qualityCompleted: countIf(statusIn(["GRADE_CONFIRMED", "ORDER_COMPLETED", "Completed", "COMPLETED", "Received"])),
  },
};

async function farmerStats(scope, window) {
  const [row] = await Farmer.aggregate([
    { $match: scope },
    {
      $facet: {
        any: [{ $limit: 1 }, { $project: { _id: 1 } }],
        stats: [...(await dateFilterStages(Farmer, scope, { window })), FARMER_GROUP],
      },
    },
  ]);
  return { any: Boolean(row?.any?.length), stats: row?.stats?.[0] || {} };
}

const firstRow = (rows) => rows?.[0] || {};
const orEmpty = (promise) => promise.catch(() => null);

export async function buildVendorDashboard(vendorId, query) {
  const { range, window } = dashboardDateWindow(query);
  const vendorScope = vendorId ? { vendorId } : { vendorId: "__NONE__" };
  const managerScope = vendorId ? { vendorId } : { vendorId: "__NONE__" };
  const cropScope = vendorId ? { vendorId } : { vendorId: "__NONE__" };
  const productScope = vendorId ? { vendorId } : { vendorId: "__NONE__" };
  const orderScope = vendorId
    ? { vendorId, isDeleted: { $ne: true } }
    : { vendorId: "__NONE__", isDeleted: { $ne: true } };
  const earningScope = vendorId ? { vendorId } : { vendorId: "__NONE__" };

  const [vendorFarmerStats, managerRows, cropRows, productRows, orderRows, earningRows, pickupRows, driverRows, qualityRows] =
    await Promise.all([
      farmerStats(vendorScope, window),
      orEmpty(aggregateInRange(FarmerManager, managerScope, { window }, [MANAGER_GROUP])),
      orEmpty(aggregateInRange(FarmerCrop, cropScope, { window, dateFields: ["createdAt", "sowingDate"], stringDates: true }, [CROP_GROUP])),
      orEmpty(aggregateInRange(FarmerProduct, productScope, { window }, [PRODUCT_FACET])),
      orEmpty(
        aggregateInRange(
          FarmerHarvestOrder,
          orderScope,
          { window, dateFields: ["orderDate", "createdAt"], stringDates: true },
          [ORDER_FACET]
        )
      ),
      orEmpty(aggregateInRange(FarmerEarning, earningScope, { window }, [EARNING_GROUP])),
      orEmpty(
        aggregateInRange(
          Pickup,
          vendorScope,
          { window, dateFields: ["scheduledDate", "pickupDate", "createdAt"], stringDates: true },
          [PICKUP_GROUP]
        )
      ),
      orEmpty(aggregateInRange(PickupDriver, vendorScope, { window }, [DRIVER_GROUP])),
      orEmpty(aggregateInRange(QualityInspection, vendorScope, { window }, [QUALITY_GROUP])),
    ]);

  const f = vendorFarmerStats.stats;
  const m = firstRow(managerRows);
  const c = firstRow(cropRows);
  const productFacet = firstRow(productRows);
  const p = firstRow(productFacet.totals);
  const g = firstRow(productFacet.grades);
  const orderFacet = firstRow(orderRows);
  const o = firstRow(orderFacet.totals);
  const e = firstRow(earningRows);
  const pk = firstRow(pickupRows);
  const d = firstRow(driverRows);
  const q = firstRow(qualityRows);

  const lowStockDocs = productFacet.lowStock || [];
  const recentDocs = orderFacet.recent || [];

  const nameIds = [...new Set([...lowStockDocs, ...recentDocs].map((r) => r.farmerId).filter(Boolean))];
  const farmerMap = new Map();
  if (nameIds.length) {
    const named = await Farmer.find({ ...vendorScope, $or: [{ id: { $in: nameIds } }, { farmerId: { $in: nameIds } }] })
      .select("id farmerId name")
      .lean();
    named.forEach((row) => {
      if (row.id) farmerMap.set(row.id, row.name);
      if (row.farmerId) farmerMap.set(row.farmerId, row.name);
    });
  }

  const totalManagers = m.totalManagers || 0;
  const activeManagers = m.activeManagers || 0;
  const totalProducts = p.totalProducts || 0;
  const incomingPickups = pk.incomingPickups || 0;

  return {
    range,
    totalFarmers: f.totalFarmers || 0,
    activeFarmers: f.activeFarmers || 0,
    farmerApprovalPending: f.farmerApprovalPending || 0,
    farmerManagerAssignPending: f.farmerManagerAssignPending || 0,
    totalManagers,
    activeManagers,
    inactiveManagers: totalManagers - activeManagers,
    totalCrops: c.totalCrops || 0,
    growingCrops: c.growingCrops || 0,
    harvestReadyCrops: c.harvestReadyCrops || 0,
    totalProducts,
    productsApprovalPending: p.productsApprovalPending || 0,
    activeProducts: p.activeProducts || 0,
    totalInventory: p.totalInventory || 0,
    inventoryProductsCount: totalProducts,
    lowStockCount: p.lowStockCount || 0,
    lowStockProducts: lowStockDocs.map((prod) => ({
      id: prod.id,
      name: prod.name,
      farmerName: farmerMap.get(prod.farmerId) || "—",
      stock: prod.stock || 0,
      lowStockLimit: prod.lowStockLimit || 10,
      category: prod.category || "General",
    })),
    totalOrders: o.totalOrders || 0,
    pendingOrders: o.pendingOrders || 0,
    rejectedOrders: o.rejectedOrders || 0,
    completedOrders: o.completedOrders || 0,
    inProgressOrders: o.inProgressOrders || 0,
    totalOrderValue: o.totalOrderValue || 0,
    recentOrders: recentDocs.map((ord) => ({
      id: ord.id || ord.orderId,
      orderNumber: ord.orderNumber || ord.id || ord.orderId,
      farmerId: ord.farmerId,
      farmerName: farmerMap.get(ord.farmerId) || ord.farmerName || "—",
      productName: ord.productName || ord.cropName || (ord.products && ord.products[0]?.name) || "—",
      totalQuantity: ord.totalQuantity ?? ord.orderedQuantity ?? 0,
      unit: ord.unit || "Kg",
      totalAmount: ord.totalAmount ?? ord.orderValue ?? ord.amount ?? 0,
      status: ord.status || "New",
      orderDate: ord.orderDate || ord.createdAt,
    })),
    totalDrivers: d.totalDrivers || 0,
    activeDrivers: d.activeDrivers || 0,
    driverApprovalPending: d.driverApprovalPending || 0,
    onDutyDrivers: d.onDutyDrivers || 0,
    readyPickups: pk.readyPickups || 0,
    assignedPickups: pk.assignedPickups || 0,
    totalPickups: pk.totalPickups || 0,
    incomingPickups,
    centrePickups: pk.centrePickups || 0,
    completedPickups: pk.completedPickups || 0,
    transitPickups: incomingPickups,
    totalInspections: q.totalInspections || 0,
    qualityPending: q.qualityPending || 0,
    qualityInProcess: q.qualityInProcess || 0,
    qualityCompleted: q.qualityCompleted || 0,
    totalEarnings: e.totalEarnings || 0,
    pendingEarnings: e.pendingEarnings || 0,
    paidEarnings: e.paidEarnings || 0,
    grades: { gradeA: g.gradeA || 0, gradeB: g.gradeB || 0, gradeC: g.gradeC || 0, rejected: g.rejected || 0 },
  };
}
