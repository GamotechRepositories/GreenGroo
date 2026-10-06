import mongoose from "mongoose";
import Order from "../../legacy/models/order/Order.js";
import User from "../../legacy/models/user.js";
import SupportMessage from "../../legacy/models/support/SupportMessage.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import ReturnPickup from "../../delivery-service/src/models/ReturnPickup.js";
import {
  Vendor,
  Farmer,
  FarmerManager,
  FarmerOrder,
  Pickup,
  CollectionCentre,
} from "../../farmer-manager-service/src/models.js";
import { FinanceLedger, RefundClaim } from "./models.js";

const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEPARTMENTS = ["preorder", "ready2cook", "instant"];
/** Abandoned checkouts (payment never completed) are tracked separately, never counted as orders. */
const PLACED = { $ne: "attempted" };
const CANCELLED = ["cancelled", "return"];

const ok = (res, data) => res.json({ success: true, data });

const round = (n, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(Number(n || 0) * f) / f;
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactCi = (s) => new RegExp(`^\\s*${escapeRegex(String(s).trim())}\\s*$`, "i");

function istDay(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function parseDay(value, endOfDay) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveRange(query) {
  const now = new Date();
  let to = parseDay(query.to, true) || parseDay(istDay(now), true);
  let from = parseDay(query.from, false) || new Date(to.getTime() - 30 * DAY_MS + 1);
  if (from > to) [from, to] = [parseDay(istDay(to), false), parseDay(istDay(from), true)];
  const span = to.getTime() - from.getTime() + 1;
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - span + 1);
  const days = Math.round(span / DAY_MS);
  const unit = days <= 62 ? "day" : days <= 370 ? "week" : "month";
  return { from, to, prevFrom, prevTo, days, unit };
}

/** Bucket key for an IST day string, aligned to Monday weeks / calendar months. */
function bucketOf(dayStr, unit) {
  if (unit === "day") return dayStr;
  if (unit === "month") return `${dayStr.slice(0, 7)}-01`;
  const d = new Date(`${dayStr}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - shift * DAY_MS).toISOString().slice(0, 10);
}

function bucketKeys(range) {
  const keys = [];
  const seen = new Set();
  for (let t = range.from.getTime(); t <= range.to.getTime(); t += DAY_MS) {
    const key = bucketOf(istDay(t), range.unit);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

/** Roll per-day rows ({ _id: "YYYY-MM-DD", ...numbers }) into continuous buckets. */
function toSeries(range, dailyRows, fields) {
  const empty = () => Object.fromEntries(fields.map((f) => [f, 0]));
  const map = new Map(bucketKeys(range).map((k) => [k, { date: k, ...empty() }]));
  for (const row of dailyRows) {
    const key = bucketOf(row._id, range.unit);
    const slot = map.get(key);
    if (!slot) continue;
    for (const f of fields) slot[f] += Number(row[f] || 0);
  }
  return [...map.values()].map((row) => {
    for (const f of fields) row[f] = round(row[f], 2);
    return row;
  });
}

const dayExpr = (field) => ({ $dateToString: { format: "%Y-%m-%d", date: field, timezone: TZ } });
const isCancelled = { $in: ["$status", CANCELLED] };
const isDelivered = { $eq: ["$status", "delivered"] };
const sumIf = (cond, value = 1) => ({ $sum: { $cond: [cond, value, 0] } });
const toObjectId = (id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null);

const STORE_ORDER_VALUE = {
  $cond: [
    { $gt: [{ $ifNull: ["$amountToCollect", 0] }, 0] },
    "$amountToCollect",
    {
      $sum: {
        $map: {
          input: { $ifNull: ["$items", []] },
          as: "i",
          in: { $multiply: [{ $ifNull: ["$$i.price", 0] }, { $ifNull: ["$$i.quantity", 0] }] },
        },
      },
    },
  ],
};

function pctChange(current, previous) {
  if (!previous) return current ? null : 0;
  return round(((current - previous) / previous) * 100, 1);
}

function readFilters(query) {
  const clean = (v) => {
    const s = String(v || "").trim();
    return s && s !== "all" ? s : "";
  };
  return {
    city: clean(query.city),
    store: clean(query.store),
    department: DEPARTMENTS.includes(clean(query.department)) ? clean(query.department) : "",
    payment: ["cod", "online"].includes(clean(query.payment)) ? clean(query.payment) : "",
    accountType: ["retail", "bulk"].includes(clean(query.accountType)) ? clean(query.accountType) : "",
  };
}

/**
 * Filters that every customer-order query shares. Store and account type need lookups first,
 * so this resolves them once and returns a match builder for any date window.
 */
async function buildOrderScope(filters) {
  const base = {};
  if (filters.city) base["deliveryAddress.city"] = exactCi(filters.city);
  if (filters.department) base.departments = filters.department;
  if (filters.payment) base.paymentMethod = filters.payment;

  if (filters.store) {
    const storeId = toObjectId(filters.store);
    const ids = storeId
      ? await StoreOrder.distinct("sourceOrderId", {
          $or: [{ managerId: storeId }, { darkStoreId: storeId }],
          sourceOrderId: { $ne: null },
        })
      : [];
    base._id = { $in: ids };
  }

  if (filters.accountType) {
    const userFilter =
      filters.accountType === "bulk" ? { accountType: "bulk" } : { accountType: { $ne: "bulk" } };
    base.user = { $in: await User.distinct("_id", userFilter) };
  }

  return (from, to, extra = {}) => ({ ...base, createdAt: { $gte: from, $lte: to }, ...extra });
}

function storeOrderMatch(filters, from, to) {
  const match = { createdAt: { $gte: from, $lte: to } };
  if (filters.store) {
    const storeId = toObjectId(filters.store);
    match.$or = [{ managerId: storeId }, { darkStoreId: storeId }];
  }
  if (filters.city) match.city = exactCi(filters.city);
  if (filters.department) match.departments = filters.department;
  if (filters.payment) match.paymentMethod = filters.payment === "cod" ? "COD" : "online";
  return match;
}

async function orderKpis(match) {
  const [row] = await Order.aggregate([
    { $match: { ...match, status: PLACED } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        delivered: sumIf(isDelivered),
        cancelled: sumIf(isCancelled),
        revenue: sumIf(isDelivered, "$total"),
        gmv: sumIf({ $not: [isCancelled] }, "$total"),
        discounts: {
          $sum: {
            $add: [
              { $ifNull: ["$couponDiscount", 0] },
              { $ifNull: ["$rewardDiscount", 0] },
              { $ifNull: ["$giftCardDiscount", 0] },
            ],
          },
        },
        customers: { $addToSet: "$user" },
      },
    },
  ]);
  const abandoned = await Order.countDocuments({ ...match, status: "attempted" });
  const r = row || { orders: 0, delivered: 0, cancelled: 0, revenue: 0, gmv: 0, discounts: 0, customers: [] };
  const live = r.orders - r.cancelled;
  return {
    revenue: round(r.revenue),
    gmv: round(r.gmv),
    orders: r.orders,
    delivered: r.delivered,
    cancelled: r.cancelled,
    aov: live ? round(r.gmv / live) : 0,
    cancellationRate: r.orders ? round((r.cancelled / r.orders) * 100, 1) : 0,
    customers: r.customers.length,
    discounts: round(r.discounts),
    abandoned,
  };
}

async function deliveryKpis(match) {
  const [row] = await StoreOrder.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        delivered: sumIf(isDelivered),
        failed: sumIf({ $eq: ["$status", "delivery_failed"] }),
        minutes: {
          $push: {
            $cond: [
              { $and: [isDelivered, { $ne: [{ $ifNull: ["$deliveredAt", null] }, null] }] },
              {
                $divide: [
                  { $subtract: ["$deliveredAt", { $ifNull: ["$assignedAt", { $ifNull: ["$packedAt", "$createdAt"] }] }] },
                  60000,
                ],
              },
              null,
            ],
          },
        },
      },
    },
  ]);
  const r = row || { total: 0, delivered: 0, failed: 0, minutes: [] };
  const mins = r.minutes.filter((m) => m != null && m >= 0).sort((a, b) => a - b);
  const mid = Math.floor(mins.length / 2);
  /** Median, so a few orders marked delivered days late don't swamp the figure. */
  const median = !mins.length ? 0 : mins.length % 2 ? mins[mid] : (mins[mid - 1] + mins[mid]) / 2;
  const attempted = r.delivered + r.failed;
  return {
    storeOrders: r.total,
    successRate: attempted ? round((r.delivered / attempted) * 100, 1) : 0,
    deliveryMinutes: round(median),
    failed: r.failed,
  };
}

function newCustomerMatch(filters, from, to) {
  const match = { createdAt: { $gte: from, $lte: to } };
  if (filters.accountType === "bulk") match.accountType = "bulk";
  else if (filters.accountType === "retail") match.accountType = { $ne: "bulk" };
  return match;
}

async function filterOptions() {
  const [stores, orderCities] = await Promise.all([
    DeliveryManager.find({}).select("storeName name city area").sort({ storeName: 1 }).lean(),
    Order.distinct("deliveryAddress.city"),
  ]);
  const cities = new Map();
  for (const c of [...stores.map((s) => s.city), ...orderCities]) {
    const name = String(c || "").trim();
    if (name && !cities.has(name.toLowerCase())) cities.set(name.toLowerCase(), name);
  }
  return {
    cities: [...cities.values()].sort((a, b) => a.localeCompare(b)),
    stores: stores.map((s) => ({
      id: String(s._id),
      name: s.storeName || s.name || `Store #${String(s._id).slice(-6)}`,
      city: s.city || "",
      area: s.area || "",
    })),
    departments: DEPARTMENTS,
  };
}

async function salesSection(match, range) {
  const live = { ...match, status: { $nin: ["attempted", ...CANCELLED] } };
  const [daily, statuses, payments, fulfilment, departments, heat, cities, areas, promoTotals, coupons] =
    await Promise.all([
      Order.aggregate([
        { $match: { ...match, status: PLACED } },
        {
          $group: {
            _id: dayExpr("$createdAt"),
            orders: { $sum: 1 },
            revenue: sumIf(isDelivered, "$total"),
            gmv: sumIf({ $not: [isCancelled] }, "$total"),
            cancelled: sumIf(isCancelled),
            delivered: sumIf(isDelivered),
          },
        },
      ]),
      Order.aggregate([{ $match: match }, { $group: { _id: "$status", orders: { $sum: 1 }, value: { $sum: "$total" } } }]),
      Order.aggregate([
        { $match: live },
        { $group: { _id: "$paymentMethod", orders: { $sum: 1 }, value: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: live },
        { $group: { _id: { $ifNull: ["$fulfillmentType", "delivery"] }, orders: { $sum: 1 }, value: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: live },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $ifNull: ["$items.department", ""] },
            units: { $sum: "$items.quantity" },
            value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            orders: { $addToSet: "$_id" },
          },
        },
        { $project: { units: 1, value: 1, orders: { $size: "$orders" } } },
      ]),
      Order.aggregate([
        { $match: { ...match, status: PLACED } },
        {
          $group: {
            _id: {
              dow: { $dayOfWeek: { date: "$createdAt", timezone: TZ } },
              hour: { $hour: { date: "$createdAt", timezone: TZ } },
            },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...match, status: PLACED } },
        {
          $group: {
            _id: { $ifNull: ["$deliveryAddress.city", "Unknown"] },
            orders: { $sum: 1 },
            gmv: sumIf({ $not: [isCancelled] }, "$total"),
            revenue: sumIf(isDelivered, "$total"),
          },
        },
        { $sort: { gmv: -1 } },
        { $limit: 12 },
      ]),
      Order.aggregate([
        { $match: { ...match, status: PLACED } },
        {
          $group: {
            _id: { $ifNull: ["$deliveryAddress.area", "Unknown"] },
            city: { $first: "$deliveryAddress.city" },
            orders: { $sum: 1 },
            gmv: sumIf({ $not: [isCancelled] }, "$total"),
          },
        },
        { $sort: { orders: -1, gmv: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: live },
        {
          $group: {
            _id: null,
            coupon: { $sum: { $ifNull: ["$couponDiscount", 0] } },
            reward: { $sum: { $ifNull: ["$rewardDiscount", 0] } },
            giftCard: { $sum: { $ifNull: ["$giftCardDiscount", 0] } },
            delivery: { $sum: { $ifNull: ["$deliveryCharges", 0] } },
            gst: { $sum: { $ifNull: ["$gstAmount", 0] } },
            pointsEarned: { $sum: { $ifNull: ["$rewardPointsEarned", 0] } },
            pointsUsed: { $sum: { $ifNull: ["$rewardPointsUsed", 0] } },
            withCoupon: sumIf({ $gt: [{ $strLenCP: { $ifNull: ["$couponCode", ""] } }, 0] }),
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...live, couponCode: { $nin: ["", null] } } },
        { $group: { _id: "$couponCode", uses: { $sum: 1 }, discount: { $sum: "$couponDiscount" }, value: { $sum: "$total" } } },
        { $sort: { uses: -1 } },
        { $limit: 8 },
      ]),
    ]);

  const p = promoTotals[0] || {};
  return {
    trend: toSeries(range, daily, ["orders", "revenue", "gmv", "cancelled", "delivered"]),
    statuses: statuses
      .map((s) => ({ status: s._id || "unknown", orders: s.orders, value: round(s.value) }))
      .sort((a, b) => b.orders - a.orders),
    payments: payments.map((s) => ({ method: s._id || "unknown", orders: s.orders, value: round(s.value) })),
    fulfilment: fulfilment.map((s) => ({ type: s._id || "delivery", orders: s.orders, value: round(s.value) })),
    departments: departments
      .map((d) => ({ department: d._id || "unassigned", units: d.units, value: round(d.value), orders: d.orders }))
      .sort((a, b) => b.value - a.value),
    heatmap: heat.map((h) => ({ dow: h._id.dow, hour: h._id.hour, orders: h.orders })),
    cities: cities.map((c) => ({ city: c._id || "Unknown", orders: c.orders, gmv: round(c.gmv), revenue: round(c.revenue) })),
    areas: areas.map((a) => ({ area: a._id || "Unknown", city: a.city || "", orders: a.orders, gmv: round(a.gmv) })),
    promotions: {
      couponDiscount: round(p.coupon),
      rewardDiscount: round(p.reward),
      giftCardDiscount: round(p.giftCard),
      deliveryCharges: round(p.delivery),
      gst: round(p.gst),
      pointsEarned: round(p.pointsEarned),
      pointsUsed: round(p.pointsUsed),
      couponOrders: p.withCoupon || 0,
      orders: p.orders || 0,
      coupons: coupons.map((c) => ({ code: c._id, uses: c.uses, discount: round(c.discount), value: round(c.value) })),
    },
  };
}

async function productsSection(match) {
  const live = { ...match, status: { $nin: ["attempted", ...CANCELLED] } };
  const [top, cancelledTop] = await Promise.all([
    Order.aggregate([
      { $match: live },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $last: "$items.name" },
          department: { $last: "$items.department" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orders: { $addToSet: "$_id" },
        },
      },
      { $project: { name: 1, department: 1, units: 1, revenue: 1, orders: { $size: "$orders" } } },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    Order.aggregate([
      { $match: { ...match, status: { $in: CANCELLED } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $last: "$items.name" }, units: { $sum: "$items.quantity" } } },
      { $sort: { units: -1 } },
      { $limit: 8 },
    ]),
  ]);
  return {
    top: top.map((t) => ({
      id: String(t._id || ""),
      name: t.name || "Product",
      department: t.department || "",
      units: t.units,
      revenue: round(t.revenue),
      orders: t.orders,
    })),
    cancelled: cancelledTop.map((t) => ({ id: String(t._id || ""), name: t.name || "Product", units: t.units })),
  };
}

async function customersSection(match, filters, range) {
  const live = { ...match, status: { $nin: ["attempted", ...CANCELLED] } };
  const [byType, top, inRange, newDaily] = await Promise.all([
    Order.aggregate([
      { $match: { ...match, status: PLACED } },
      { $lookup: { from: User.collection.name, localField: "user", foreignField: "_id", as: "u" } },
      {
        $group: {
          _id: { $cond: [{ $eq: [{ $first: "$u.accountType" }, "bulk"] }, "bulk", "retail"] },
          orders: { $sum: 1 },
          gmv: sumIf({ $not: [isCancelled] }, "$total"),
          customers: { $addToSet: "$user" },
        },
      },
      { $project: { orders: 1, gmv: 1, customers: { $size: "$customers" } } },
    ]),
    Order.aggregate([
      { $match: live },
      { $group: { _id: "$user", orders: { $sum: 1 }, spend: { $sum: "$total" }, last: { $max: "$createdAt" } } },
      { $sort: { spend: -1 } },
      { $limit: 8 },
      { $lookup: { from: User.collection.name, localField: "_id", foreignField: "_id", as: "u" } },
      {
        $project: {
          orders: 1,
          spend: 1,
          last: 1,
          name: { $first: "$u.name" },
          phone: { $first: "$u.phone" },
          accountType: { $first: "$u.accountType" },
        },
      },
    ]),
    Order.distinct("user", { ...match, status: PLACED }),
    User.aggregate([
      { $match: newCustomerMatch(filters, range.from, range.to) },
      { $group: { _id: dayExpr("$createdAt"), signups: { $sum: 1 } } },
    ]),
  ]);

  let returning = 0;
  if (inRange.length) {
    const earlier = await Order.distinct("user", {
      user: { $in: inRange },
      status: PLACED,
      createdAt: { $lt: range.from },
    });
    returning = earlier.length;
  }

  return {
    byType: byType.map((t) => ({ type: t._id, orders: t.orders, gmv: round(t.gmv), customers: t.customers })),
    newVsReturning: [
      { type: "new", customers: inRange.length - returning },
      { type: "returning", customers: returning },
    ],
    signups: toSeries(range, newDaily, ["signups"]),
    top: top.map((t) => ({
      id: String(t._id),
      name: t.name || "Deleted customer",
      phone: t.phone || "",
      accountType: t.accountType === "bulk" ? "bulk" : "retail",
      orders: t.orders,
      spend: round(t.spend),
      last: t.last,
    })),
  };
}

async function deliverySection(filters, range) {
  const match = storeOrderMatch(filters, range.from, range.to);
  const durationExpr = {
    $divide: [
      { $subtract: ["$deliveredAt", { $ifNull: ["$assignedAt", { $ifNull: ["$packedAt", "$createdAt"] }] }] },
      60000,
    ],
  };
  const fleetMatch = {};
  if (filters.store) {
    const storeId = toObjectId(filters.store);
    fleetMatch.$or = [{ managerId: storeId }, { storeId }, { storeId: filters.store }];
  }
  if (filters.city) fleetMatch.city = exactCi(filters.city);

  const [statuses, daily, byStore, reasons, riders, durations, fleetStatus, fleetVerification, fleetVehicles] =
    await Promise.all([
      StoreOrder.aggregate([{ $match: match }, { $group: { _id: "$status", orders: { $sum: 1 } } }]),
      StoreOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: dayExpr("$createdAt"),
            created: { $sum: 1 },
            delivered: sumIf(isDelivered),
            failed: sumIf({ $eq: ["$status", "delivery_failed"] }),
          },
        },
      ]),
      StoreOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ["$darkStoreId", "$managerId"] },
            orders: { $sum: 1 },
            delivered: sumIf(isDelivered),
            failed: sumIf({ $eq: ["$status", "delivery_failed"] }),
            cancelled: sumIf({ $eq: ["$status", "cancelled"] }),
            value: sumIf(isDelivered, STORE_ORDER_VALUE),
            minutes: {
              $avg: { $cond: [{ $and: [isDelivered, { $ifNull: ["$deliveredAt", false] }] }, durationExpr, null] },
            },
          },
        },
        { $lookup: { from: DeliveryManager.collection.name, localField: "_id", foreignField: "_id", as: "s" } },
        { $sort: { orders: -1 } },
      ]),
      StoreOrder.aggregate([
        { $match: { ...match, status: "delivery_failed" } },
        { $group: { _id: { $ifNull: ["$failureReason", ""] }, orders: { $sum: 1 } } },
        { $sort: { orders: -1 } },
        { $limit: 8 },
      ]),
      StoreOrder.aggregate([
        { $match: { ...match, assignedRiderId: { $ne: null } } },
        {
          $group: {
            _id: "$assignedRiderId",
            assigned: { $sum: 1 },
            delivered: sumIf(isDelivered),
            failed: sumIf({ $eq: ["$status", "delivery_failed"] }),
            earnings: { $sum: { $ifNull: ["$riderDeliveryEarning", 0] } },
            km: { $sum: { $ifNull: ["$deliveryDistanceKm", 0] } },
          },
        },
        { $sort: { delivered: -1, assigned: -1 } },
        { $limit: 10 },
        { $lookup: { from: DeliveryBoy.collection.name, localField: "_id", foreignField: "_id", as: "r" } },
      ]),
      StoreOrder.aggregate([
        { $match: { ...match, status: "delivered", deliveredAt: { $ne: null } } },
        { $project: { m: durationExpr } },
        {
          $bucket: {
            groupBy: "$m",
            boundaries: [-1e9, 20, 30, 45, 60, 90, 1e12],
            default: "other",
            output: { orders: { $sum: 1 } },
          },
        },
      ]),
      DeliveryBoy.aggregate([{ $match: fleetMatch }, { $group: { _id: "$status", riders: { $sum: 1 } } }]),
      DeliveryBoy.aggregate([{ $match: fleetMatch }, { $group: { _id: "$verificationStatus", riders: { $sum: 1 } } }]),
      DeliveryBoy.aggregate([{ $match: fleetMatch }, { $group: { _id: "$vehicleType", riders: { $sum: 1 } } }]),
    ]);

  const bucketLabels = [
    [-1e9, "< 20 min"],
    [20, "20–30 min"],
    [30, "30–45 min"],
    [45, "45–60 min"],
    [60, "60–90 min"],
    [90, "90+ min"],
  ];
  const durationMap = new Map(durations.map((d) => [String(d._id), d.orders]));

  return {
    statuses: statuses.map((s) => ({ status: s._id || "unknown", orders: s.orders })).sort((a, b) => b.orders - a.orders),
    trend: toSeries(range, daily, ["created", "delivered", "failed"]),
    stores: byStore.map((s) => {
      const store = s.s?.[0];
      const attempted = s.delivered + s.failed;
      return {
        id: String(s._id),
        name: store ? store.storeName || store.name || "Dark store" : `Removed store #${String(s._id).slice(-6)}`,
        city: store?.city || "",
        orders: s.orders,
        delivered: s.delivered,
        failed: s.failed,
        cancelled: s.cancelled,
        value: round(s.value),
        avgMinutes: s.minutes != null ? round(s.minutes) : null,
        successRate: attempted ? round((s.delivered / attempted) * 100, 1) : null,
      };
    }),
    failureReasons: reasons.map((r) => ({ reason: r._id || "No reason given", orders: r.orders })),
    riders: riders.map((r) => ({
      id: String(r._id),
      name: r.r?.[0]?.name || `Rider #${String(r._id).slice(-6)}`,
      assigned: r.assigned,
      delivered: r.delivered,
      failed: r.failed,
      earnings: round(r.earnings),
      km: round(r.km, 1),
    })),
    durations: bucketLabels.map(([key, label]) => ({ bucket: label, orders: durationMap.get(String(key)) || 0 })),
    fleet: {
      status: fleetStatus.map((f) => ({ status: f._id || "offline", riders: f.riders })),
      verification: fleetVerification.map((f) => ({ status: f._id || "pending", riders: f.riders })),
      vehicles: fleetVehicles.map((f) => ({ vehicle: f._id || "not set", riders: f.riders })),
    },
  };
}

async function supplySection(range) {
  const inRange = { createdAt: { $gte: range.from, $lte: range.to } };
  const activeFarmers = { isDeleted: { $ne: true } };
  const [vendors, farmers, farmerVerification, managers, centres, farmerOrders, pickups, farmerDaily] =
    await Promise.all([
      Vendor.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Farmer.aggregate([{ $match: activeFarmers }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Farmer.aggregate([{ $match: activeFarmers }, { $group: { _id: "$verificationStatus", count: { $sum: 1 } } }]),
      FarmerManager.countDocuments({}),
      CollectionCentre.countDocuments({}),
      FarmerOrder.aggregate([
        { $match: inRange },
        {
          $group: {
            _id: "$status",
            orders: { $sum: 1 },
            value: { $sum: { $cond: [{ $gt: ["$totalAmount", 0] }, "$totalAmount", { $ifNull: ["$amount", 0] }] } },
          },
        },
        { $sort: { orders: -1 } },
      ]),
      Pickup.aggregate([{ $match: inRange }, { $group: { _id: "$status", pickups: { $sum: 1 } } }, { $sort: { pickups: -1 } }]),
      Farmer.aggregate([
        { $match: { ...activeFarmers, ...inRange } },
        { $group: { _id: dayExpr("$createdAt"), joined: { $sum: 1 } } },
      ]),
    ]);
  const total = (rows) => rows.reduce((s, r) => s + r.count, 0);
  return {
    counts: {
      vendors: total(vendors),
      farmers: total(farmers),
      farmerManagers: managers,
      collectionCentres: centres,
    },
    vendors: vendors.map((v) => ({ status: v._id || "Pending", count: v.count })),
    farmers: farmers.map((v) => ({ status: v._id || "Pending", count: v.count })),
    farmerVerification: farmerVerification.map((v) => ({ status: v._id || "Pending", count: v.count })),
    farmerOrders: farmerOrders.map((o) => ({ status: o._id || "NEW", orders: o.orders, value: round(o.value) })),
    pickups: pickups.map((p) => ({ status: p._id || "UNKNOWN", pickups: p.pickups })),
    farmerJoins: toSeries(range, farmerDaily, ["joined"]),
  };
}

async function financeSection(range, filters) {
  const ledgerMatch = { date: { $gte: range.from, $lte: range.to } };
  const claimMatch = { createdAt: { $gte: range.from, $lte: range.to } };
  if (filters.accountType) claimMatch.accountType = filters.accountType;
  if (filters.store) {
    const storeId = toObjectId(filters.store);
    claimMatch.$or = [{ darkStoreId: storeId }, { managerId: storeId }];
  }
  const [byType, daily, claims, claimTypes, tickets, returns] = await Promise.all([
    FinanceLedger.aggregate([{ $match: ledgerMatch }, { $group: { _id: "$type", amount: { $sum: "$amount" }, entries: { $sum: 1 } } }]),
    FinanceLedger.aggregate([
      { $match: ledgerMatch },
      {
        $group: {
          _id: dayExpr("$date"),
          income: sumIf({ $eq: ["$type", "income"] }, "$amount"),
          expense: sumIf({ $eq: ["$type", "expense"] }, "$amount"),
          payout: sumIf({ $eq: ["$type", "payout"] }, "$amount"),
          settlement: sumIf({ $eq: ["$type", "settlement"] }, "$amount"),
        },
      },
    ]),
    RefundClaim.aggregate([
      { $match: claimMatch },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "approved"] }, then: "accepted" },
                { case: { $eq: ["$status", "processed"] }, then: "successful" },
              ],
              default: "$status",
            },
          },
          claims: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    RefundClaim.aggregate([{ $match: claimMatch }, { $group: { _id: "$type", claims: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    SupportMessage.aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: "$status", tickets: { $sum: 1 } } },
    ]),
    ReturnPickup.countDocuments({ createdAt: { $gte: range.from, $lte: range.to } }),
  ]);
  const totals = Object.fromEntries(["income", "expense", "payout", "settlement"].map((t) => [t, 0]));
  for (const row of byType) totals[row._id] = round(row.amount);
  return {
    totals,
    trend: toSeries(range, daily, ["income", "expense", "payout", "settlement"]),
    claims: claims.map((c) => ({ status: c._id || "pending", claims: c.claims, amount: round(c.amount) })),
    claimTypes: claimTypes.map((c) => ({ type: c._id || "refund", claims: c.claims, amount: round(c.amount) })),
    support: tickets.map((t) => ({ status: t._id || "open", tickets: t.tickets })),
    returnPickups: returns,
  };
}

/**
 * GET /api/admin-ops/analytics
 * Query: from, to (YYYY-MM-DD, IST), city, store, department, payment, accountType.
 * Every number is computed live from the database for the selected window; KPIs are
 * compared with the window of equal length immediately before it.
 */
export async function getAnalytics(req, res, next) {
  try {
    const range = resolveRange(req.query);
    const filters = readFilters(req.query);
    const scope = await buildOrderScope(filters);
    const current = scope(range.from, range.to);
    const previous = scope(range.prevFrom, range.prevTo);

    const [options, kpiNow, kpiPrev, delNow, delPrev, signupsNow, signupsPrev, sales, products, customers, delivery, supply, finance] =
      await Promise.all([
        filterOptions(),
        orderKpis(current),
        orderKpis(previous),
        deliveryKpis(storeOrderMatch(filters, range.from, range.to)),
        deliveryKpis(storeOrderMatch(filters, range.prevFrom, range.prevTo)),
        User.countDocuments(newCustomerMatch(filters, range.from, range.to)),
        User.countDocuments(newCustomerMatch(filters, range.prevFrom, range.prevTo)),
        salesSection(current, range),
        productsSection(current),
        customersSection(current, filters, range),
        deliverySection(filters, range),
        supplySection(range),
        financeSection(range, filters),
      ]);

    const now = { ...kpiNow, ...delNow, newCustomers: signupsNow };
    const prev = { ...kpiPrev, ...delPrev, newCustomers: signupsPrev };
    const kpis = Object.fromEntries(
      Object.keys(now).map((key) => [key, { value: now[key], previous: prev[key], change: pctChange(now[key], prev[key]) }])
    );

    return ok(res, {
      range: {
        from: istDay(range.from),
        to: istDay(range.to),
        previousFrom: istDay(range.prevFrom),
        previousTo: istDay(range.prevTo),
        days: range.days,
        unit: range.unit,
      },
      filters,
      options,
      kpis,
      sales,
      products,
      customers,
      delivery,
      supply,
      finance,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}
