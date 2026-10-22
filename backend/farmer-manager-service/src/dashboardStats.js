import {
  Farmer,
  FarmerManager,
  FarmerProduct,
  FarmerOrder,
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
                    { case: { $or: [containsText("$$l", "REJECT"), containsText("$$l", "DAMAGE")] }, then: "R" },
                    { case: { $or: [containsText("$$l", "GRADE A"), { $eq: ["$$l", "A"] }] }, then: "A" },
                    { case: { $or: [containsText("$$l", "GRADE B"), { $eq: ["$$l", "B"] }] }, then: "B" },
                    { case: { $or: [containsText("$$l", "GRADE C"), { $eq: ["$$l", "C"] }] }, then: "C" },
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
            statusIn([
              "IN_TRANSIT",
              "ARRIVED",
              "ARRIVED_AT_CENTRE",
              "COLLECTION_CENTRE_RECEIVED",
              "RECEIVED_AT_COLLECTION_CENTRE",
              "DISPATCHED",
              "DRIVER_ASSIGNED",
              "DRIVER_ARRIVED",
              "INSPECTION",
              "PICKED_UP",
              "ON_THE_WAY",
            ])
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

async function computeVendorQualityAndRejectionStats(vendorScope, window) {
  const [qis, orders, harvestOrders, prods, farmers] = await Promise.all([
    QualityInspection.find(vendorScope).lean().catch(() => []),
    FarmerOrder.find({ ...vendorScope, isDeleted: { $ne: true } }).lean().catch(() => []),
    FarmerHarvestOrder.find({ ...vendorScope, isDeleted: { $ne: true } }).lean().catch(() => []),
    FarmerProduct.find(vendorScope).lean().catch(() => []),
    Farmer.find(vendorScope).lean().catch(() => []),
  ]);

  // Build farmer map for fast lookup
  const farmerMap = new Map();
  farmers.forEach((f) => {
    if (f.id) farmerMap.set(String(f.id), f);
    if (f.farmerId) farmerMap.set(String(f.farmerId), f);
  });

  // Date window filters
  const filteredQis = qis.filter((q) =>
    matchesDashboardDate(q.gradingConfirmedAt || q.inspectionCompletedAt || q.createdAt, window)
  );
  const filteredOrders = orders.filter((o) =>
    matchesDashboardDate(o.orderDate || o.harvestDate || o.createdAt, window)
  );
  const filteredHarvestOrders = harvestOrders.filter((o) =>
    matchesDashboardDate(o.date || o.orderDate || o.createdAt, window)
  );
  const filteredProds = prods.filter((p) =>
    matchesDashboardDate(p.harvestDate || p.createdAt, window)
  );

  // Map orderId -> { productName, farmerId, farmerName }
  const orderInfoMap = new Map();
  filteredOrders.forEach((o) => {
    const name = o.productName || (o.products && o.products[0]?.name) || "";
    const fId = o.farmerId || "";
    const fName = o.farmerName || farmerMap.get(String(fId))?.name || "";
    if (o.id) orderInfoMap.set(String(o.id), { name, fId, fName });
    if (o.orderId) orderInfoMap.set(String(o.orderId), { name, fId, fName });
  });
  filteredHarvestOrders.forEach((o) => {
    const name = o.productName || "";
    const fId = o.farmerId || "";
    const fName = o.farmerName || farmerMap.get(String(fId))?.name || "";
    if (o.id) orderInfoMap.set(String(o.id), { name, fId, fName });
    if (o.orderId) orderInfoMap.set(String(o.orderId), { name, fId, fName });
  });

  const productStats = new Map();
  function ensureProduct(name, unit = "Kg") {
    const n = String(name || "Other Produce").trim() || "Other Produce";
    if (!productStats.has(n)) {
      productStats.set(n, {
        productName: n,
        unit,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        rejected: 0,
        farmers: new Set(),
        rejectionReasons: {},
      });
    }
    return productStats.get(n);
  }

  const farmerStats = new Map();
  function ensureFarmer(fId, fallbackName = "") {
    const key = String(fId || "unknown");
    const fDoc = farmerMap.get(key);
    const name = fDoc?.name || fallbackName || "Unknown Farmer";
    const code = fDoc?.farmerId || fDoc?.id || key;
    const mobile = fDoc?.mobile || "";
    const location = fDoc?.farmLocation || fDoc?.farmGeo?.village || fDoc?.location || "";
    if (!farmerStats.has(key)) {
      farmerStats.set(key, {
        farmerId: key,
        farmerCode: code,
        farmerName: name,
        mobile,
        location,
        unit: "Kg",
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        rejected: 0,
        products: new Set(),
        rejectionReasons: {},
      });
    }
    return farmerStats.get(key);
  }

  // 1. Process Quality Inspections (highest fidelity for quality & rejections)
  const inspectedOrderIds = new Set();
  for (const qi of filteredQis) {
    if (qi.orderId) inspectedOrderIds.add(String(qi.orderId));
    const ordInfo = orderInfoMap.get(String(qi.orderId)) || {};
    const pName = qi.productName || ordInfo.name || "Other Produce";
    const fId = qi.farmerId || ordInfo.fId || "";
    const fName = qi.farmerName || ordInfo.fName || "";

    const p = ensureProduct(pName);
    const f = ensureFarmer(fId, fName);

    const a = Number(qi.gradeAQuantity || 0);
    const b = Number(qi.gradeBQuantity || 0);
    const c = Number(qi.gradeCQuantity || 0);
    let rej = Number(qi.rejectedQuantity || 0);

    if (qi.gradeQuality && typeof qi.gradeQuality === "object") {
      let gqRej = 0;
      for (const [, gVal] of Object.entries(qi.gradeQuality)) {
        const rQty = Number(gVal?.rejectedQuantity || 0);
        if (rQty > 0) {
          gqRej += rQty;
          const reason = String(gVal.rejectionReason || "Damaged").trim();
          p.rejectionReasons[reason] = (p.rejectionReasons[reason] || 0) + rQty;
          f.rejectionReasons[reason] = (f.rejectionReasons[reason] || 0) + rQty;
        }
      }
      if (gqRej > rej) rej = gqRej;
    } else if (rej > 0 && qi.rejectionReason) {
      const reason = String(qi.rejectionReason).trim();
      p.rejectionReasons[reason] = (p.rejectionReasons[reason] || 0) + rej;
      f.rejectionReasons[reason] = (f.rejectionReasons[reason] || 0) + rej;
    }

    p.gradeA += a;
    p.gradeB += b;
    p.gradeC += c;
    p.rejected += rej;
    if (f.farmerName && f.farmerName !== "Unknown Farmer") p.farmers.add(f.farmerName);

    f.gradeA += a;
    f.gradeB += b;
    f.gradeC += c;
    f.rejected += rej;
    f.products.add(pName);
  }

  // 2. Process Orders that haven't been counted in Quality Inspection
  const allOrders = [...filteredOrders, ...filteredHarvestOrders];
  for (const o of allOrders) {
    const orderKey = String(o.id || o.orderId || "");
    if (orderKey && inspectedOrderIds.has(orderKey)) continue;

    const pName = o.productName || (o.products && o.products[0]?.name) || "Other Produce";
    const pUnit = o.unit || (o.products && o.products[0]?.unit) || "Kg";
    const fId = o.farmerId || "";
    const fName = o.farmerName || farmerMap.get(String(fId))?.name || "";

    const p = ensureProduct(pName, pUnit);
    const f = ensureFarmer(fId, fName);

    let oA = 0,
      oB = 0,
      oC = 0,
      oRej = 0;
    if (Array.isArray(o.grades) && o.grades.length > 0) {
      for (const g of o.grades) {
        const gLabel = String(g.label || g.name || "").toUpperCase();
        const qty = Number(g.quantity || 0);
        const rej = Number(g.rejectedQuantity || 0);
        if (gLabel.includes("GRADE A") || gLabel === "A" || gLabel.startsWith("A ")) oA += qty;
        else if (gLabel.includes("GRADE B") || gLabel === "B" || gLabel.startsWith("B ")) oB += qty;
        else if (gLabel.includes("GRADE C") || gLabel === "C" || gLabel.startsWith("C ")) oC += qty;
        else oA += qty;
        oRej += rej;
      }
    }
    if (Number(o.rejectionQty || 0) > 0) {
      const rQty = Number(o.rejectionQty);
      oRej += rQty;
      p.rejectionReasons["Harvest Rejection"] = (p.rejectionReasons["Harvest Rejection"] || 0) + rQty;
      f.rejectionReasons["Harvest Rejection"] = (f.rejectionReasons["Harvest Rejection"] || 0) + rQty;
    }

    p.gradeA += oA;
    p.gradeB += oB;
    p.gradeC += oC;
    p.rejected += oRej;
    if (f.farmerName && f.farmerName !== "Unknown Farmer") p.farmers.add(f.farmerName);

    f.gradeA += oA;
    f.gradeB += oB;
    f.gradeC += oC;
    f.rejected += oRej;
    f.products.add(pName);
  }

  // 3. Fallback to product catalog if no orders/inspections exist for that product
  for (const prod of filteredProds) {
    const pName = prod.name;
    if (!productStats.has(pName)) {
      const p = ensureProduct(pName, prod.unit || "Kg");
      if (Array.isArray(prod.grades)) {
        for (const g of prod.grades) {
          const gLabel = String(g.label || g.name || g.grade || "").toUpperCase();
          const qty = Number(g.quantity || g.stock || 0);
          if (gLabel.includes("GRADE A") || gLabel === "A" || gLabel.startsWith("A ")) p.gradeA += qty;
          else if (gLabel.includes("GRADE B") || gLabel === "B" || gLabel.startsWith("B ")) p.gradeB += qty;
          else if (gLabel.includes("GRADE C") || gLabel === "C" || gLabel.startsWith("C ")) p.gradeC += qty;
        }
      }
      if (prod.farmerId) {
        const f = ensureFarmer(prod.farmerId);
        if (f.farmerName && f.farmerName !== "Unknown Farmer") p.farmers.add(f.farmerName);
        f.products.add(pName);
      }
    }
  }

  // Product-wise output
  const byProduct = Array.from(productStats.values())
    .map((p) => {
      const total = p.gradeA + p.gradeB + p.gradeC + p.rejected;
      const rejectionRate = total > 0 ? Number(((p.rejected / total) * 100).toFixed(1)) : 0;
      return {
        productName: p.productName,
        unit: p.unit,
        gradeA: p.gradeA,
        gradeB: p.gradeB,
        gradeC: p.gradeC,
        rejected: p.rejected,
        total,
        rejectionRate,
        farmerCount: p.farmers.size,
        farmers: Array.from(p.farmers),
        rejectionReasons: p.rejectionReasons,
      };
    })
    .filter((p) => p.total > 0 || p.rejected > 0)
    .sort((a, b) => b.total - a.total);

  // Farmer-wise output
  const byFarmer = Array.from(farmerStats.values())
    .map((f) => {
      const total = f.gradeA + f.gradeB + f.gradeC + f.rejected;
      const rejectionRate = total > 0 ? Number(((f.rejected / total) * 100).toFixed(1)) : 0;
      return {
        farmerId: f.farmerId,
        farmerCode: f.farmerCode,
        farmerName: f.farmerName,
        mobile: f.mobile,
        location: f.location,
        unit: f.unit,
        gradeA: f.gradeA,
        gradeB: f.gradeB,
        gradeC: f.gradeC,
        rejected: f.rejected,
        total,
        rejectionRate,
        products: Array.from(f.products),
        productCount: f.products.size,
        rejectionReasons: f.rejectionReasons,
        reasons: Object.entries(f.rejectionReasons).map(([r, q]) => ({ reason: r, quantity: q })),
      };
    })
    .filter((f) => f.total > 0 || f.rejected > 0)
    .sort((a, b) => b.total - a.total);

  const totalGradeA = byProduct.reduce((sum, p) => sum + p.gradeA, 0);
  const totalGradeB = byProduct.reduce((sum, p) => sum + p.gradeB, 0);
  const totalGradeC = byProduct.reduce((sum, p) => sum + p.gradeC, 0);
  const totalRejected = byProduct.reduce((sum, p) => sum + p.rejected, 0);
  const totalProduce = totalGradeA + totalGradeB + totalGradeC + totalRejected;
  const overallRejectionRate = totalProduce > 0 ? Number(((totalRejected / totalProduce) * 100).toFixed(1)) : 0;

  // Rejection share by product
  const rejectionByProduct = byProduct
    .filter((p) => p.rejected > 0)
    .map((p) => ({
      productName: p.productName,
      unit: p.unit,
      rejected: p.rejected,
      rejectionRate: p.rejectionRate,
      shareOfRejections: totalRejected > 0 ? Number(((p.rejected / totalRejected) * 100).toFixed(1)) : 0,
      reasons: Object.entries(p.rejectionReasons).map(([r, q]) => ({ reason: r, quantity: q })),
    }))
    .sort((a, b) => b.rejected - a.rejected);

  // Rejection share by farmer
  const rejectionByFarmer = byFarmer
    .filter((f) => f.rejected > 0)
    .map((f) => ({
      farmerId: f.farmerId,
      farmerCode: f.farmerCode,
      farmerName: f.farmerName,
      mobile: f.mobile,
      products: f.products,
      rejected: f.rejected,
      total: f.total,
      rejectionRate: f.rejectionRate,
      unit: f.unit,
      shareOfRejections: totalRejected > 0 ? Number(((f.rejected / totalRejected) * 100).toFixed(1)) : 0,
      reasons: f.reasons,
    }))
    .sort((a, b) => b.rejected - a.rejected);

  // Overall rejection reasons breakdown
  const reasonsAgg = {};
  byProduct.forEach((p) => {
    Object.entries(p.rejectionReasons).forEach(([r, q]) => {
      reasonsAgg[r] = (reasonsAgg[r] || 0) + q;
    });
  });
  const rejectionReasonsOverall = Object.entries(reasonsAgg)
    .map(([reason, quantity]) => ({
      reason,
      quantity,
      percentage: totalRejected > 0 ? Number(((quantity / totalRejected) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const grades = {
    gradeA: totalGradeA,
    gradeB: totalGradeB,
    gradeC: totalGradeC,
    rejected: totalRejected,
    total: totalProduce,
    rejectionRate: overallRejectionRate,
    gradeAPercent: totalProduce > 0 ? Math.round((totalGradeA / totalProduce) * 100) : 0,
    gradeBPercent: totalProduce > 0 ? Math.round((totalGradeB / totalProduce) * 100) : 0,
    gradeCPercent: totalProduce > 0 ? Math.round((totalGradeC / totalProduce) * 100) : 0,
    rejectedPercent: totalProduce > 0 ? Math.round((totalRejected / totalProduce) * 100) : 0,
  };

  return {
    grades,
    byProduct,
    byFarmer,
    rejectionByProduct,
    rejectionByFarmer,
    rejectionReasonsOverall,
  };
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

  // Select primary order model (FarmerOrder has active orders in app; fallback to FarmerHarvestOrder)
  const [farmerOrderCount, harvestOrderCount] = await Promise.all([
    FarmerOrder.countDocuments(orderScope).catch(() => 0),
    FarmerHarvestOrder.countDocuments(orderScope).catch(() => 0),
  ]);
  const primaryOrderModel = farmerOrderCount >= harvestOrderCount ? FarmerOrder : FarmerHarvestOrder;

  const [vendorFarmerStats, managerRows, cropRows, productRows, orderRows, earningRows, pickupRows, driverRows, qualityRows, qualityStats] =
    await Promise.all([
      farmerStats(vendorScope, window),
      orEmpty(aggregateInRange(FarmerManager, managerScope, { window }, [MANAGER_GROUP])),
      orEmpty(aggregateInRange(FarmerCrop, cropScope, { window, dateFields: ["createdAt", "sowingDate"], stringDates: true }, [CROP_GROUP])),
      orEmpty(aggregateInRange(FarmerProduct, productScope, { window }, [PRODUCT_FACET])),
      orEmpty(
        aggregateInRange(
          primaryOrderModel,
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
      computeVendorQualityAndRejectionStats(vendorScope, window).catch(() => null),
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
    grades: qualityStats?.grades || {
      gradeA: g.gradeA || 0,
      gradeB: g.gradeB || 0,
      gradeC: g.gradeC || 0,
      rejected: g.rejected || 0,
      total: (g.gradeA || 0) + (g.gradeB || 0) + (g.gradeC || 0) + (g.rejected || 0),
      rejectionRate: 0,
      gradeAPercent: 0,
      gradeBPercent: 0,
      gradeCPercent: 0,
      rejectedPercent: 0,
    },
    byProduct: qualityStats?.byProduct || [],
    byFarmer: qualityStats?.byFarmer || [],
    rejectionByProduct: qualityStats?.rejectionByProduct || [],
    rejectionByFarmer: qualityStats?.rejectionByFarmer || [],
    rejectionReasonsOverall: qualityStats?.rejectionReasonsOverall || [],
  };
}
