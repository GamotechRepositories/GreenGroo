import StoreOrder from "../models/StoreOrder.js";
import { getManager } from "./managerDashboardController.js";

const TZ = "Asia/Kolkata";
const PERIODS = new Set(["day", "week", "month"]);

const orderAmountExpr = {
  $let: {
    vars: {
      billed: {
        $cond: [
          { $gt: [{ $ifNull: ["$partTotal", 0] }, 0] },
          "$partTotal",
          { $ifNull: ["$amountToCollect", 0] },
        ],
      },
      itemsTotal: {
        $sum: {
          $map: {
            input: {
              $filter: {
                input: { $ifNull: ["$items", []] },
                as: "it",
                cond: { $ne: ["$$it.customerInformed", true] },
              },
            },
            as: "it",
            in: {
              $multiply: [{ $ifNull: ["$$it.price", 0] }, { $ifNull: ["$$it.quantity", 0] }],
            },
          },
        },
      },
    },
    in: { $cond: [{ $gt: ["$$billed", 0] }, "$$billed", "$$itemsTotal"] },
  },
};

const deliveredDateExpr = { $ifNull: ["$deliveredAt", "$updatedAt"] };

const bucketExpr = (period) => {
  if (period === "month") {
    return { $dateTrunc: { date: deliveredDateExpr, unit: "month", timezone: TZ } };
  }
  if (period === "week") {
    return {
      $dateTrunc: { date: deliveredDateExpr, unit: "week", timezone: TZ, startOfWeek: "monday" },
    };
  }
  return { $dateTrunc: { date: deliveredDateExpr, unit: "day", timezone: TZ } };
};

/** `YYYY-MM-DD` is read as an IST calendar day. */
const parseIstDay = (value, endOfDay = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Start of today / this week (Mon) / this month in IST, as UTC Date. */
const istBoundaries = () => {
  const offsetMs = 330 * 60 * 1000;
  const nowIst = new Date(Date.now() + offsetMs);
  const y = nowIst.getUTCFullYear();
  const m = nowIst.getUTCMonth();
  const d = nowIst.getUTCDate();
  const dayStart = new Date(Date.UTC(y, m, d) - offsetMs);
  const dow = (nowIst.getUTCDay() + 6) % 7;
  const weekStart = new Date(dayStart.getTime() - dow * 86400000);
  const monthStart = new Date(Date.UTC(y, m, 1) - offsetMs);
  return { dayStart, weekStart, monthStart };
};

export const deliveredMatch = (managerId, extra = {}) => ({
  managerId,
  status: "delivered",
  ...extra,
});

export async function revenueTotals(managerId) {
  const { dayStart, weekStart, monthStart } = istBoundaries();
  const sumSince = (since) => ({
    $sum: { $cond: [{ $gte: [deliveredDateExpr, since] }, orderAmountExpr, 0] },
  });
  const countSince = (since) => ({
    $sum: { $cond: [{ $gte: [deliveredDateExpr, since] }, 1, 0] },
  });
  const [row] = await StoreOrder.aggregate([
    { $match: deliveredMatch(managerId) },
    {
      $group: {
        _id: null,
        allTime: { $sum: orderAmountExpr },
        allTimeOrders: { $sum: 1 },
        today: sumSince(dayStart),
        todayOrders: countSince(dayStart),
        week: sumSince(weekStart),
        weekOrders: countSince(weekStart),
        month: sumSince(monthStart),
        monthOrders: countSince(monthStart),
      },
    },
  ]);
  const r = (v) => Math.round(Number(v) || 0);
  return {
    allTime: r(row?.allTime),
    allTimeOrders: row?.allTimeOrders || 0,
    today: r(row?.today),
    todayOrders: row?.todayOrders || 0,
    week: r(row?.week),
    weekOrders: row?.weekOrders || 0,
    month: r(row?.month),
    monthOrders: row?.monthOrders || 0,
  };
}

export const getRevenueReport = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const period = PERIODS.has(String(req.query.period)) ? String(req.query.period) : "day";
    const from = parseIstDay(req.query.from);
    const to = parseIstDay(req.query.to, true);

    const range = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;

    const pipeline = [
      { $match: deliveredMatch(manager._id) },
      { $addFields: { _deliveredOn: deliveredDateExpr, _amount: orderAmountExpr } },
      ...(Object.keys(range).length ? [{ $match: { _deliveredOn: range } }] : []),
      { $match: { _deliveredOn: { $lte: new Date() } } },
      {
        $group: {
          _id: bucketExpr(period),
          revenue: { $sum: "$_amount" },
          orders: { $sum: 1 },
          cod: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "COD"] }, "$_amount", 0] },
          },
          online: {
            $sum: { $cond: [{ $ne: ["$paymentMethod", "COD"] }, "$_amount", 0] },
          },
          riderPayout: { $sum: { $ifNull: ["$riderDeliveryEarning", 0] } },
        },
      },
      { $sort: { _id: -1 } },
    ];

    const [rows, totals] = await Promise.all([
      StoreOrder.aggregate(pipeline),
      revenueTotals(manager._id),
    ]);

    return res.json({
      success: true,
      period,
      totals,
      rows: rows.map((row) => ({
        start: row._id,
        revenue: Math.round(row.revenue || 0),
        orders: row.orders || 0,
        cod: Math.round(row.cod || 0),
        online: Math.round(row.online || 0),
        riderPayout: Math.round(row.riderPayout || 0),
        avgOrder: row.orders ? Math.round((row.revenue || 0) / row.orders) : 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};
