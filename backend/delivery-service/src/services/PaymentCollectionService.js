/**
 * PaymentCollectionService
 *
 * Handles payment state transitions for StoreOrders.
 *
 * Payment rules:
 *  - paid_online (Razorpay prepaid): no cash collection allowed
 *  - pending: customer still owes money → rider collects cash or online
 *  - collected: rider has collected cash from customer
 *
 * The backend is the source of truth.
 * Flutter must NOT directly set paymentStatus to "collected" without calling this service.
 */

import StoreOrder from "../models/StoreOrder.js";
import { createCashLiability } from "./CashSettlementService.js";

/**
 * Return a payment summary object to show the rider/Flutter.
 * Does NOT mutate the order.
 *
 * @param {object} order - StoreOrder document
 * @param {object} manager - DeliveryManager document (for Dark Store lat/lng)
 * @returns {object}
 */
export function getPaymentSummary(order, manager = null) {
  const isPrepaid = order.paymentStatus === "paid_online";
  const isCollected = order.paymentStatus === "collected";
  const isPending = order.paymentStatus === "pending" || !order.paymentStatus;

  return {
    paymentStatus: order.paymentStatus || "pending",
    paymentMethod: order.paymentMethod || "",
    amountToCollect: order.amountToCollect || 0,
    amountCollected: order.amountCollected || 0,
    isPrepaid,
    isCollected,
    isPending,
    noCollectionRequired: isPrepaid || isCollected,
  };
}

/**
 * Confirm cash payment by the rider.
 * - Validates that the order is NOT already prepaid online
 * - Updates order payment fields
 * - Creates a CashSettlement record
 * - Returns updated order
 *
 * @param {object} params
 * @param {string|ObjectId} params.orderId
 * @param {string|ObjectId} params.riderId
 * @param {number} params.amountCollected
 * @returns {Promise<{success: boolean, order: object, message: string}>}
 */
export async function confirmCashCollection({ orderId, riderId, amountCollected }) {
  const order = await StoreOrder.findById(orderId);
  if (!order) return { success: false, message: "Order not found" };

  if (order.assignedRiderId?.toString() !== riderId.toString()) {
    return { success: false, message: "You are not assigned to this order" };
  }

  if (order.paymentStatus === "paid_online") {
    return {
      success: false,
      message: "This order is already paid online. No cash collection required.",
    };
  }

  if (order.paymentStatus === "collected") {
    return { success: true, message: "Cash already collected.", order };
  }

  const amount = Number(amountCollected) || order.amountToCollect || 0;

  order.paymentMethod = "COD";
  order.paymentStatus = "collected";
  order.amountCollected = amount;
  await order.save();

  // Create cash settlement liability
  try {
    await createCashLiability({
      darkStoreId: order.darkStoreId || order.managerId,
      riderId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount,
    });
  } catch (cashErr) {
    console.error("[PaymentCollectionService] createCashLiability error:", cashErr.message);
    // Non-blocking: order already saved, log and continue
  }

  return { success: true, order, message: "Cash collected successfully." };
}

/**
 * Mark an order as paid via online payment (e.g. Razorpay link during delivery).
 * Backend must verify payment before calling this.
 *
 * @param {object} params
 * @param {string|ObjectId} params.orderId
 * @param {string|ObjectId} params.riderId
 * @param {number} params.amount
 * @returns {Promise<{success: boolean, order: object, message: string}>}
 */
export async function confirmOnlinePayment({ orderId, riderId, amount }) {
  const order = await StoreOrder.findById(orderId);
  if (!order) return { success: false, message: "Order not found" };

  if (order.assignedRiderId?.toString() !== riderId.toString()) {
    return { success: false, message: "You are not assigned to this order" };
  }

  if (order.paymentStatus === "collected") {
    return { success: false, message: "Cash already collected for this order. Cannot mark as online." };
  }

  order.paymentMethod = "online";
  order.paymentStatus = "paid_online";
  order.amountCollected = Number(amount) || order.amountToCollect || 0;
  await order.save();

  return { success: true, order, message: "Online payment confirmed." };
}

/**
 * Validate that an order is in a payable state before delivery completion.
 * Returns true if delivery can proceed.
 *
 * @param {object} order - StoreOrder document
 * @returns {{ canProceed: boolean, reason: string }}
 */
export function validatePaymentForCompletion(order) {
  if (order.paymentStatus === "paid_online") {
    return { canProceed: true, reason: "prepaid" };
  }
  if (order.paymentStatus === "collected") {
    return { canProceed: true, reason: "cash_collected" };
  }
  return {
    canProceed: false,
    reason: "payment_required",
    message: "Payment must be collected before completing delivery.",
  };
}
