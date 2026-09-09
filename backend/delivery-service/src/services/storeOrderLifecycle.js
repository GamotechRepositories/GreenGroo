import StoreOrder from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import { completeDelivery } from "./DeliveryCompletionService.js";
import { restoreOrderStock } from "./storeStockService.js";
import { syncCustomerOrderFromStore } from "./syncCustomerOrderFromStore.js";
import { getIO } from "../../../socket.js";

const ASSIGNMENT_BY_STATUS = {
  incoming: "NONE",
  order_received: "NONE",
  stock_issue: "NONE",
  packed: "SEARCHING_FOR_DRIVER",
  offered: "OFFER_SENT",
  assigned: "DRIVER_ASSIGNED",
  pickup_verified: "PICKUP_VERIFIED",
  out_for_delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  cancelled: "NONE",
};

export async function releaseAssignedRider(storeOrder) {
  if (!storeOrder?.assignedRiderId) return;
  const rider = await DeliveryBoy.findById(storeOrder.assignedRiderId);
  if (!rider) return;
  const activeId = rider.activeOrderId ? String(rider.activeOrderId) : "";
  if (rider.status === "on_delivery" || activeId === String(storeOrder._id)) {
    rider.status = "online";
    rider.activeOrderId = null;
    rider.lastStatusAt = new Date();
    await rider.save();
  }
}

function emitStoreStatus(storeOrder, extra = {}) {
  try {
    getIO().to(`store_${storeOrder.managerId}`).emit("order_status_updated", {
      orderId: storeOrder._id.toString(),
      orderNumber: storeOrder.orderNumber,
      status: storeOrder.status,
      assignmentStatus: storeOrder.assignmentStatus,
      ...extra,
    });
  } catch (_) {}
}

/**
 * Admin or manager driven status change. Completing delivery skips rider OTP/proof
 * so ops can close an order that never finished in the app.
 */
export async function applyStoreOrderStatus({
  storeOrderId,
  status,
  skipCompletionGuards = false,
  restoreStockOnCancel = true,
}) {
  const allowed = StoreOrder.schema.path("status").enumValues;
  if (!allowed.includes(status)) {
    return { success: false, statusCode: 400, message: "Invalid order status" };
  }

  const order = await StoreOrder.findById(storeOrderId);
  if (!order) {
    return { success: false, statusCode: 404, message: "Delivery order not found" };
  }

  if (order.status === status) {
    return { success: true, message: "Status unchanged", order };
  }

  if (status === "delivered") {
    if (order.assignedRiderId) {
      const result = await completeDelivery({
        orderId: order._id,
        riderId: order.assignedRiderId,
        skipConditionCheck: skipCompletionGuards,
      });
      if (!result.success) return { ...result, statusCode: 400 };
      if (!result.order.customerOtpVerified && skipCompletionGuards) {
        result.order.customerOtpVerified = true;
        result.order.customerOtpVerifiedAt = result.order.customerOtpVerifiedAt || new Date();
        result.order.paymentStatus =
          result.order.paymentMethod === "COD" ? "collected" : result.order.paymentStatus || "paid_online";
        await result.order.save();
      }
      await syncCustomerOrderFromStore(result.order, "delivered");
      return { success: true, message: "Order marked delivered and completed", order: result.order };
    }

    const now = new Date();
    order.status = "delivered";
    order.assignmentStatus = "DELIVERED";
    order.deliveredAt = now;
    if (order.paymentMethod === "COD") order.paymentStatus = "collected";
    await order.save();
    await syncCustomerOrderFromStore(order, "delivered");
    emitStoreStatus(order, { deliveredAt: now });
    return { success: true, message: "Order marked delivered and completed", order };
  }

  if (status === "cancelled") {
    if (order.status === "delivered") {
      return { success: false, statusCode: 400, message: "Delivered orders cannot be cancelled" };
    }
    const now = new Date();
    if (restoreStockOnCancel) {
      await restoreOrderStock(order.managerId, order);
    }
    await releaseAssignedRider(order);
    order.status = "cancelled";
    order.assignmentStatus = "NONE";
    order.currentOfferDriverId = null;
    order.offeredRiderId = null;
    await order.save();
    await syncCustomerOrderFromStore(order, "cancelled");
    emitStoreStatus(order, { cancelledAt: now });
    return { success: true, message: "Order cancelled", order };
  }

  order.status = status;
  if (ASSIGNMENT_BY_STATUS[status]) order.assignmentStatus = ASSIGNMENT_BY_STATUS[status];
  if (status === "packed" && !order.packedAt) order.packedAt = new Date();
  if (status === "assigned" && !order.assignedAt) order.assignedAt = new Date();
  if (status === "out_for_delivery") order.customerAddressUnlocked = true;
  await order.save();
  await syncCustomerOrderFromStore(order, status);
  emitStoreStatus(order);
  return { success: true, message: "Order status updated", order };
}
