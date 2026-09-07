/**
 * CashSettlementService
 *
 * Manages cash liability lifecycle for deliveries paid in cash.
 *
 * IMPORTANT:
 *  - Cash collected from the customer is a LIABILITY, not rider earnings.
 *  - Only the Dark Store manager can confirm physical cash receipt.
 *  - All financial mutations use atomic MongoDB operations.
 */

import mongoose from "mongoose";
import CashSettlement from "../models/CashSettlement.js";
import DeliveryBoy from "../models/DeliveryBoy.js";

/**
 * Create a cash settlement record when a rider collects cash.
 * Also atomically increments rider.pendingCashAmount.
 *
 * @param {object} params
 * @param {string|ObjectId} params.darkStoreId
 * @param {string|ObjectId} params.riderId
 * @param {string|ObjectId} params.orderId
 * @param {string} params.orderNumber
 * @param {number} params.amount  - cash collected from customer
 * @returns {Promise<CashSettlement>}
 */
export async function createCashLiability({ darkStoreId, riderId, orderId, orderNumber, amount }) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Create settlement record
    const [settlement] = await CashSettlement.create(
      [
        {
          darkStoreId,
          riderId,
          orderId,
          orderNumber: orderNumber || "",
          amount,
          status: "PENDING",
          collectedAt: new Date(),
        },
      ],
      { session }
    );

    // Increment rider's pending cash atomically
    await DeliveryBoy.findByIdAndUpdate(
      riderId,
      { $inc: { pendingCashAmount: amount } },
      { session }
    );

    await session.commitTransaction();
    return settlement;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Mark all PENDING settlements for a rider as SUBMITTED
 * (rider has physically brought cash to dark store, awaiting manager confirmation).
 *
 * @param {string|ObjectId} riderId
 * @param {string|ObjectId} darkStoreId
 * @returns {Promise<{modifiedCount: number}>}
 */
export async function riderSubmitsCash(riderId, darkStoreId) {
  const result = await CashSettlement.updateMany(
    { riderId, darkStoreId, status: "PENDING" },
    { $set: { status: "SUBMITTED", submittedAt: new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
}

/**
 * Dark Store manager confirms receipt of cash.
 * Atomically marks settlements as COMPLETED and reduces rider.pendingCashAmount.
 *
 * @param {object} params
 * @param {string|ObjectId} params.darkStoreId
 * @param {string|ObjectId} params.riderId
 * @param {string|ObjectId} params.managerId
 * @param {string[]|ObjectId[]} [params.settlementIds] - specific settlements to confirm; if empty, confirms all SUBMITTED ones
 * @returns {Promise<{confirmed: number, totalAmount: number}>}
 */
export async function confirmCashReceipt({ darkStoreId, riderId, managerId, settlementIds = [] }) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const filter = {
      darkStoreId,
      riderId,
      status: { $in: ["SUBMITTED", "PENDING"] },
    };
    if (settlementIds.length > 0) {
      filter._id = { $in: settlementIds };
    }

    const settlements = await CashSettlement.find(filter).session(session);
    if (settlements.length === 0) {
      await session.abortTransaction();
      return { confirmed: 0, totalAmount: 0 };
    }

    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    const ids = settlements.map((s) => s._id);

    await CashSettlement.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: "COMPLETED",
          confirmedAt: new Date(),
          confirmedBy: managerId,
        },
      },
      { session }
    );

    // Reduce rider pending cash — clamp to 0 to avoid negative values
    const rider = await DeliveryBoy.findById(riderId).session(session);
    if (rider) {
      rider.pendingCashAmount = Math.max(0, (rider.pendingCashAmount || 0) - totalAmount);
      await rider.save({ session });
    }

    await session.commitTransaction();
    return { confirmed: settlements.length, totalAmount };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Fetch pending/submitted cash summary for a rider at a specific dark store.
 *
 * @param {string|ObjectId} riderId
 * @param {string|ObjectId} darkStoreId
 * @returns {Promise<{totalPending: number, settlements: CashSettlement[]}>}
 */
export async function getRiderPendingCash(riderId, darkStoreId) {
  const settlements = await CashSettlement.find({
    riderId,
    darkStoreId,
    status: { $in: ["PENDING", "SUBMITTED"] },
  }).sort({ createdAt: 1 });

  const totalPending = settlements.reduce((sum, s) => sum + s.amount, 0);
  return { totalPending, settlements };
}

/**
 * Fetch all pending/submitted cash across all riders for a dark store (manager view).
 *
 * @param {string|ObjectId} darkStoreId
 * @returns {Promise<object[]>}
 */
export async function getDarkStorePendingCash(darkStoreId) {
  const settlements = await CashSettlement.find({
    darkStoreId,
    status: { $in: ["PENDING", "SUBMITTED"] },
  })
    .populate("riderId", "name phone")
    .populate("orderId", "orderNumber")
    .sort({ createdAt: -1 });

  // Group by rider
  const byRider = new Map();
  for (const s of settlements) {
    const rId = s.riderId?._id?.toString() || s.riderId?.toString();
    if (!byRider.has(rId)) {
      byRider.set(rId, {
        riderId: rId,
        riderName: s.riderId?.name || "Unknown",
        riderPhone: s.riderId?.phone || "",
        totalPending: 0,
        settlements: [],
      });
    }
    const entry = byRider.get(rId);
    entry.totalPending += s.amount;
    entry.settlements.push(s.toSafeJSON ? s.toSafeJSON() : s);
  }

  return Array.from(byRider.values());
}
