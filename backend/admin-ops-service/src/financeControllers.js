import Order from "../../legacy/models/order/Order.js";
import Product from "../../legacy/models/Product.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import { FinanceLedger, RefundClaim } from "./models.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

export async function listFinance(req, res, next) {
  try {
    const filter = {};
    if (req.query.type && req.query.type !== "all") filter.type = req.query.type;
    const entries = await FinanceLedger.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    const [ledgerTotals, orderTotals] = await Promise.all([
      FinanceLedger.aggregate([
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ["attempted", "cancelled"] } } },
        {
          $group: {
            _id: null,
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
            refundable: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "refundable"] }, "$total", 0] },
            },
          },
        },
      ]),
    ]);
    const byType = Object.fromEntries(ledgerTotals.map((row) => [row._id, row.total]));
    return ok(res, entries, {
      stats: {
        sales: orderTotals[0]?.sales || 0,
        orders: orderTotals[0]?.orders || 0,
        income: byType.income || 0,
        expense: byType.expense || 0,
        payout: byType.payout || 0,
        settlement: byType.settlement || 0,
        refundable: orderTotals[0]?.refundable || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createFinanceEntry(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    const title = String(req.body.title || "").trim();
    const type = String(req.body.type || "income");
    if (!title) return fail(res, 400, "Title is required");
    if (!Number.isFinite(amount) || amount < 0) return fail(res, 400, "Amount is required");
    if (!["income", "expense", "payout", "settlement"].includes(type)) {
      return fail(res, 400, "Invalid finance type");
    }
    const entry = await FinanceLedger.create({
      type,
      title,
      amount,
      storeName: String(req.body.storeName || "").trim(),
      vendorName: String(req.body.vendorName || "").trim(),
      reference: String(req.body.reference || "").trim(),
      notes: String(req.body.notes || "").trim(),
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    return res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

export async function updateFinanceEntry(req, res, next) {
  try {
    const entry = await FinanceLedger.findById(req.params.id);
    if (!entry) return fail(res, 404, "Finance entry not found");
    ["type", "title", "amount", "storeName", "vendorName", "reference", "notes", "date"].forEach(
      (key) => {
        if (req.body[key] !== undefined) entry[key] = req.body[key];
      }
    );
    await entry.save();
    return ok(res, entry);
  } catch (error) {
    next(error);
  }
}

export async function deleteFinanceEntry(req, res, next) {
  try {
    const entry = await FinanceLedger.findByIdAndDelete(req.params.id);
    if (!entry) return fail(res, 404, "Finance entry not found");
    return ok(res, { id: req.params.id });
  } catch (error) {
    next(error);
  }
}

export async function listRefunds(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    if (req.query.type && req.query.type !== "all") filter.type = req.query.type;
    const claims = await RefundClaim.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, claims, {
      stats: {
        total: claims.length,
        pending: claims.filter((c) => c.status === "pending").length,
        approved: claims.filter((c) => c.status === "approved").length,
        refundAmount: claims
          .filter((c) => ["approved", "processed"].includes(c.status) && c.type === "refund")
          .reduce((sum, c) => sum + Number(c.amount || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRefund(req, res, next) {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return fail(res, 400, "Reason is required");
    let order = null;
    if (req.body.orderId) order = await Order.findById(req.body.orderId);
    if (!order && req.body.orderNumber) {
      order = await Order.findOne({ orderNumber: String(req.body.orderNumber).trim() });
    }
    const claim = await RefundClaim.create({
      orderId: order?._id || null,
      orderNumber: order?.orderNumber || String(req.body.orderNumber || "").trim(),
      type: req.body.type === "warranty" ? "warranty" : "refund",
      reason,
      amount: Number(req.body.amount || order?.total || 0),
      customerName: String(req.body.customerName || order?.deliveryAddress?.fullName || "").trim(),
      customerPhone: String(req.body.customerPhone || order?.deliveryAddress?.number || "").trim(),
      adminNote: String(req.body.adminNote || "").trim(),
      status: "pending",
    });
    return res.status(201).json({ success: true, data: claim });
  } catch (error) {
    next(error);
  }
}

export async function updateRefund(req, res, next) {
  try {
    const claim = await RefundClaim.findById(req.params.id);
    if (!claim) return fail(res, 404, "Claim not found");
    if (req.body.status && ["pending", "approved", "rejected", "processed"].includes(req.body.status)) {
      claim.status = req.body.status;
    }
    if (req.body.adminNote !== undefined) claim.adminNote = String(req.body.adminNote);
    if (req.body.amount !== undefined) claim.amount = Number(req.body.amount);
    await claim.save();

    if (claim.orderId && (claim.status === "approved" || claim.status === "processed") && claim.type === "refund") {
      await Order.findByIdAndUpdate(claim.orderId, { paymentStatus: "refundable" });
    }
    return ok(res, claim);
  } catch (error) {
    next(error);
  }
}

export async function getReports(_req, res, next) {
  try {
    const [orderAgg, recentOrders, productCount, riderCount, storeOrders, topProducts] =
      await Promise.all([
        Order.aggregate([
          { $match: { status: { $nin: ["attempted"] } } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              sales: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "return"]] }, 0, "$total"] } },
            },
          },
        ]),
        Order.find({ status: { $nin: ["attempted"] } })
          .sort({ createdAt: -1 })
          .limit(8)
          .select("orderNumber total status paymentStatus createdAt")
          .lean(),
        Product.countDocuments({ isActive: true }),
        DeliveryBoy.countDocuments(),
        StoreOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { status: { $nin: ["attempted", "cancelled"] } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              units: { $sum: "$items.quantity" },
              sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
          },
          { $sort: { sales: -1 } },
          { $limit: 6 },
        ]),
      ]);

    const byStatus = Object.fromEntries(orderAgg.map((row) => [row._id, row]));
    const sales = orderAgg.reduce((sum, row) => sum + (row.sales || 0), 0);
    const orders = orderAgg.reduce((sum, row) => sum + (row.count || 0), 0);

    return ok(res, {
      kpis: {
        sales,
        orders,
        products: productCount,
        riders: riderCount,
        delivered: byStatus.delivered?.count || 0,
        cancelled: byStatus.cancelled?.count || 0,
      },
      ordersByStatus: orderAgg,
      deliveryByStatus: storeOrders,
      topProducts,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
}
