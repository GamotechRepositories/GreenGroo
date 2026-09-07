/**
 * cashSettlementController
 *
 * Rider endpoints:
 *   GET  /rider/cash/pending        — rider sees their pending cash liability
 *   POST /rider/cash/submit         — rider declares cash submitted to store (optional intermediate step)
 *
 * Manager endpoints:
 *   GET  /manager/cash              — manager sees all pending cash per rider
 *   POST /manager/cash/confirm      — manager confirms receipt of cash from a rider
 */

import {
  getDarkStorePendingCash,
  getRiderPendingCash,
  riderSubmitsCash,
  confirmCashReceipt,
} from "../services/CashSettlementService.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import CashSettlement from "../models/CashSettlement.js";
import StoreOrder from "../models/StoreOrder.js";

const istDateString = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const istDayRange = (dateString) => ({
  start: new Date(`${dateString}T00:00:00+05:30`),
  end: new Date(`${dateString}T23:59:59.999+05:30`),
});

// ─── RIDER ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * GET /rider/cash/pending
 * Rider views their own pending cash obligations.
 */
export const getRiderCashPending = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const darkStoreId = rider.managerId;
    if (!darkStoreId) {
      return res.json({
        success: true,
        pendingCashAmount: 0,
        settlements: [],
        message: "No dark store assigned",
      });
    }

    const { totalPending, settlements } = await getRiderPendingCash(riderId, darkStoreId);

    return res.json({
      success: true,
      pendingCashAmount: rider.pendingCashAmount || 0,
      calculatedPending: totalPending,
      settlements: settlements.map((s) => s.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /rider/cash/submit
 * Rider marks cash as submitted (physically at the store).
 * The manager still needs to confirm.
 */
export const riderSubmitCash = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const darkStoreId = rider.managerId;
    if (!darkStoreId) {
      return res.status(400).json({ success: false, message: "No dark store assigned" });
    }

    const { modifiedCount } = await riderSubmitsCash(riderId, darkStoreId);

    return res.json({
      success: true,
      message:
        modifiedCount > 0
          ? `${modifiedCount} settlement(s) marked as submitted. Waiting for Dark Store confirmation.`
          : "No pending cash to submit.",
      submittedCount: modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery-boys/earnings/detail?date=YYYY-MM-DD
 * Per-order delivery earnings for the rider (defaults to today IST).
 *
 * GET /api/delivery-boys/earnings/detail?range=week
 * Last 7 IST days (including today) with daily totals + deliveries.
 */
export const getRiderEarningsDetail = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const range = String(req.query.range || "").trim().toLowerCase();

    if (range === "week") {
      const days = [];
      let weekTotal = 0;
      let weekOrderCount = 0;
      const todayStr = istDateString();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setTime(d.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = istDateString(d);
        const { start, end } = istDayRange(dateString);
        const orders = await StoreOrder.find({
          assignedRiderId: rider._id,
          status: "delivered",
          deliveredAt: { $gte: start, $lte: end },
        }).sort({ deliveredAt: -1 });

        const deliveries = orders.map((order) => ({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          deliveredAt: order.deliveredAt,
          deliveryDistanceKm: order.deliveryDistanceKm || 0,
          riderDeliveryEarning: order.riderDeliveryEarning || 0,
        }));
        const dayTotal = deliveries.reduce(
          (sum, row) => sum + (row.riderDeliveryEarning || 0),
          0
        );
        weekTotal += dayTotal;
        weekOrderCount += deliveries.length;
        days.push({
          date: dateString,
          dayLabel: new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            weekday: "short",
          }).format(start),
          isToday: dateString === todayStr,
          orderCount: deliveries.length,
          totalEarnings: dayTotal,
          deliveries,
        });
      }

      return res.json({
        success: true,
        range: "week",
        weekTotalEarnings: weekTotal,
        weekOrderCount,
        todayEarnings:
          days.find((day) => day.isToday)?.totalEarnings ??
          rider.todayEarnings ??
          0,
        totalLifetimeEarnings: rider.totalLifetimeEarnings || 0,
        walletBalance: rider.walletBalance || 0,
        days,
      });
    }

    const requestedDate = String(req.query.date || "").trim();
    const dateString = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : istDateString();
    const { start, end } = istDayRange(dateString);

    const orders = await StoreOrder.find({
      assignedRiderId: rider._id,
      status: "delivered",
      deliveredAt: { $gte: start, $lte: end },
    }).sort({ deliveredAt: -1 });

    const deliveries = orders.map((order) => ({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      deliveredAt: order.deliveredAt,
      deliveryDistanceKm: order.deliveryDistanceKm || 0,
      riderDeliveryEarning: order.riderDeliveryEarning || 0,
      earningSlab: order.earningSlab
        ? {
            minKm: order.earningSlab.minKm,
            maxKm: order.earningSlab.maxKm,
            riderAmount: order.earningSlab.riderAmount,
          }
        : null,
    }));

    const totalEarnings = deliveries.reduce(
      (sum, d) => sum + (d.riderDeliveryEarning || 0),
      0
    );

    return res.json({
      success: true,
      date: dateString,
      orderCount: deliveries.length,
      totalEarnings,
      todayEarnings: totalEarnings || rider.todayEarnings || 0,
      totalLifetimeEarnings: rider.totalLifetimeEarnings || 0,
      walletBalance: rider.walletBalance || 0,
      deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// ─── MANAGER ENDPOINTS ───────────────────────────────────────────────────────

/**
 * GET /manager/cash
 * Dark Store manager views all pending/submitted cash across their riders.
 */
export const getManagerCashOverview = async (req, res, next) => {
  try {
    const managerId = req.user.id;

    const riderGroups = await getDarkStorePendingCash(managerId);

    const grandTotal = riderGroups.reduce((sum, r) => sum + r.totalPending, 0);

    return res.json({
      success: true,
      grandTotalPending: grandTotal,
      riderCount: riderGroups.length,
      riders: riderGroups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /manager/cash/confirm
 * Dark Store manager confirms receipt of cash from a rider.
 * Body: { riderId: string, settlementIds?: string[] }
 * If settlementIds is omitted, all PENDING/SUBMITTED settlements for the rider are confirmed.
 */
export const confirmRiderCash = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { riderId, settlementIds = [] } = req.body;

    if (!riderId) {
      return res.status(400).json({ success: false, message: "riderId is required" });
    }

    // Dark Store isolation — rider must belong to this manager's store
    const rider = await DeliveryBoy.findById(riderId);
    if (!rider || rider.managerId?.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: "Rider does not belong to your dark store",
      });
    }

    const result = await confirmCashReceipt({
      darkStoreId: managerId,
      riderId,
      managerId,
      settlementIds,
    });

    return res.json({
      success: true,
      message:
        result.confirmed > 0
          ? `Confirmed ₹${result.totalAmount} cash from ${rider.name || rider.phone}`
          : "No settlements to confirm.",
      confirmed: result.confirmed,
      totalAmount: result.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /manager/cash/rider/:riderId
 * Get settlement history for a specific rider (manager view).
 */
export const getRiderCashHistory = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { riderId } = req.params;
    const { status, limit = 50 } = req.query;

    const rider = await DeliveryBoy.findById(riderId);
    if (!rider || rider.managerId?.toString() !== managerId) {
      return res.status(403).json({ success: false, message: "Rider not found in your store" });
    }

    const filter = { darkStoreId: managerId, riderId };
    if (status) filter.status = status;

    const settlements = await CashSettlement.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const total = settlements.reduce((sum, s) => sum + s.amount, 0);

    return res.json({
      success: true,
      rider: { id: rider._id.toString(), name: rider.name, phone: rider.phone },
      pendingCashAmount: rider.pendingCashAmount || 0,
      total,
      settlements: settlements.map((s) => s.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};
