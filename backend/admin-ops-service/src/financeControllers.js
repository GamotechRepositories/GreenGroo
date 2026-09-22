import Order from "../../legacy/models/order/Order.js";
import Product from "../../legacy/models/Product.js";
import DeliveryBoy from "../../delivery-service/src/models/DeliveryBoy.js";
import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import ReturnPickup from "../../delivery-service/src/models/ReturnPickup.js";
import User from "../../legacy/models/user.js";
import { FinanceLedger, RefundClaim } from "./models.js";
import {
  createReturnPickupFromClaim,
  resolveDarkStoreForOrder,
} from "../../delivery-service/src/controllers/returnPickupController.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function normalizeAccountType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "bulk" || raw === "b2b" || raw === "wholesale") return "bulk";
  return "retail";
}

function normalizeClaimStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "approved") return "accepted";
  if (raw === "processed") return "successful";
  if (["pending", "accepted", "rejected", "successful"].includes(raw)) return raw;
  return "";
}

function serializeClaim(claim, extras = {}) {
  const row = claim?.toObject ? claim.toObject() : claim;
  const status = normalizeClaimStatus(row.status) || row.status || "pending";
  return {
    id: String(row._id),
    _id: String(row._id),
    orderId: row.orderId ? String(row.orderId) : null,
    orderNumber: row.orderNumber || "",
    userId: row.userId ? String(row.userId) : null,
    accountType: row.accountType === "bulk" ? "bulk" : "retail",
    type: row.type || "refund",
    reason: row.reason || "",
    productImage: row.productImage || "",
    amount: Number(row.amount || 0),
    status,
    customerName: row.customerName || "",
    customerPhone: row.customerPhone || "",
    customerAddress: row.customerAddress || "",
    adminNote: row.adminNote || "",
    darkStoreId: row.darkStoreId ? String(row.darkStoreId) : null,
    managerId: row.managerId ? String(row.managerId) : null,
    returnPickupId: row.returnPickupId ? String(row.returnPickupId) : null,
    acceptedAt: row.acceptedAt,
    rejectedAt: row.rejectedAt,
    successfulAt: row.successfulAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...extras,
  };
}

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
    if (req.query.accountType || req.query.userType) {
      filter.accountType = normalizeAccountType(req.query.accountType || req.query.userType);
    }
    const status = normalizeClaimStatus(req.query.status);
    if (status) {
      filter.status =
        status === "accepted"
          ? { $in: ["accepted", "approved"] }
          : status === "successful"
            ? { $in: ["successful", "processed"] }
            : status;
    }
    if (req.query.type && req.query.type !== "all") filter.type = req.query.type;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const end = new Date(req.query.dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const search = String(req.query.search || req.query.q || "").trim();
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, "i") },
        { customerName: new RegExp(search, "i") },
        { customerPhone: new RegExp(search, "i") },
        { reason: new RegExp(search, "i") },
      ];
    }

    const claims = await RefundClaim.find(filter).sort({ createdAt: -1 }).lean();
    const pickupIds = claims.map((c) => c.returnPickupId).filter(Boolean);
    const pickups = pickupIds.length
      ? await ReturnPickup.find({ _id: { $in: pickupIds } }).select("status").lean()
      : [];
    const pickupMap = Object.fromEntries(pickups.map((p) => [String(p._id), p]));

    const storeIds = [
      ...new Set(claims.map((c) => c.darkStoreId || c.managerId).filter(Boolean).map(String)),
    ];
    const stores = storeIds.length
      ? await DeliveryManager.find({ _id: { $in: storeIds } })
          .select("storeName name city area")
          .lean()
      : [];
    const storeMap = Object.fromEntries(stores.map((s) => [String(s._id), s]));

    const data = claims.map((claim) => {
      const pickup = claim.returnPickupId ? pickupMap[String(claim.returnPickupId)] : null;
      const store = storeMap[String(claim.darkStoreId || claim.managerId || "")];
      return serializeClaim(claim, {
        returnStatus: pickup?.status || null,
        storeName: store?.storeName || store?.name || "",
        storeArea: store?.area || "",
        storeCity: store?.city || "",
      });
    });

    return ok(res, data, {
      count: data.length,
      stats: {
        total: data.length,
        pending: data.filter((c) => c.status === "pending").length,
        accepted: data.filter((c) => c.status === "accepted").length,
        rejected: data.filter((c) => c.status === "rejected").length,
        successful: data.filter((c) => c.status === "successful").length,
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

    let user = null;
    if (order?.user) user = await User.findById(order.user).select("name phone accountType").lean();
    if (!user && req.body.customerPhone) {
      const phone = String(req.body.customerPhone).replace(/\D/g, "").slice(-10);
      if (phone) user = await User.findOne({ phone }).select("name phone accountType").lean();
    }

    const accountType = normalizeAccountType(req.body.accountType || user?.accountType || "retail");

    let darkStoreId = req.body.darkStoreId || null;
    let managerId = req.body.managerId || darkStoreId || null;
    let customerAddress = String(req.body.customerAddress || "").trim();

    if (order?._id) {
      const resolved = await resolveDarkStoreForOrder(order._id);
      if (resolved) {
        darkStoreId = darkStoreId || resolved.darkStoreId;
        managerId = managerId || resolved.managerId;
        customerAddress = customerAddress || resolved.customerAddress || "";
      }
    }

    const claim = await RefundClaim.create({
      orderId: order?._id || null,
      orderNumber: order?.orderNumber || String(req.body.orderNumber || "").trim(),
      userId: user?._id || order?.user || null,
      accountType,
      type: req.body.type === "warranty" ? "warranty" : "refund",
      reason,
      amount: Number(req.body.amount || order?.total || 0),
      customerName: String(
        req.body.customerName || user?.name || order?.deliveryAddress?.fullName || ""
      ).trim(),
      customerPhone: String(
        req.body.customerPhone || user?.phone || order?.deliveryAddress?.number || ""
      ).trim(),
      customerAddress:
        customerAddress ||
        String(order?.deliveryAddress?.addressLine || order?.deliveryAddress?.fullAddress || "").trim(),
      adminNote: String(req.body.adminNote || "").trim(),
      status: "pending",
      darkStoreId: darkStoreId || null,
      managerId: managerId || null,
    });

    return res.status(201).json({ success: true, data: serializeClaim(claim) });
  } catch (error) {
    next(error);
  }
}

export async function updateRefund(req, res, next) {
  try {
    const claim = await RefundClaim.findById(req.params.id);
    if (!claim) return fail(res, 404, "Claim not found");

    const nextStatus = normalizeClaimStatus(req.body.status);
    if (req.body.adminNote !== undefined) claim.adminNote = String(req.body.adminNote);
    if (req.body.amount !== undefined) claim.amount = Number(req.body.amount);
    if (req.body.darkStoreId) {
      claim.darkStoreId = req.body.darkStoreId;
      claim.managerId = req.body.darkStoreId;
    }

    if (nextStatus && nextStatus !== normalizeClaimStatus(claim.status)) {
      if (nextStatus === "accepted") {
        try {
          const pickup = await createReturnPickupFromClaim(claim, {
            managerId: claim.managerId,
            darkStoreId: claim.darkStoreId,
          });
          claim.returnPickupId = pickup._id;
          claim.managerId = pickup.managerId;
          claim.darkStoreId = pickup.darkStoreId;
          claim.status = "accepted";
          claim.acceptedAt = new Date();
        } catch (err) {
          return fail(res, 400, err.message || "Could not create return pickup for dark store");
        }
      } else if (nextStatus === "rejected") {
        claim.status = "rejected";
        claim.rejectedAt = new Date();
        if (claim.returnPickupId) {
          await ReturnPickup.findByIdAndUpdate(claim.returnPickupId, { status: "cancelled" });
        }
      } else if (nextStatus === "pending") {
        claim.status = "pending";
      } else if (nextStatus === "successful") {
        claim.status = "successful";
        claim.successfulAt = new Date();
        if (claim.returnPickupId) {
          await ReturnPickup.findByIdAndUpdate(claim.returnPickupId, {
            status: "successful",
            successfulAt: new Date(),
          });
        }
        if (claim.orderId && claim.type === "refund") {
          await Order.findByIdAndUpdate(claim.orderId, {
            status: "return",
            paymentStatus: "refundable",
          });
        }
      }
    }

    await claim.save();
    return ok(res, serializeClaim(claim));
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
