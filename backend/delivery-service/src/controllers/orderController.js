import Order from "../models/Order.js";
import Rider from "../models/Rider.js";
import Manager from "../models/Manager.js";
import Incentive from "../models/Incentive.js";
import { getIO } from "../../../socket.js";
import { isCurrentlyPeak } from "../utils/peakHoursHelper.js";

/**
 * Internal helper: Auto-assign an order with status 'packed' to an online rider (round robin).
 */
export async function autoAssignRider(order) {
  try {
    if (!order || order.status !== "packed") return order;

    // Find store manager details to match city/area
    const manager = await Manager.findById(order.storeId);
    if (!manager) return order;

    // Find online riders for store area sorted by oldest lastAssignedAt (nulls first)
    const onlineRiders = await Rider.find({
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
      status: "online",
      isActive: true,
    }).sort({ lastAssignedAt: 1, lastOrderAssignedAt: 1, createdAt: 1 });

    if (!onlineRiders.length) {
      // Mark as pending_rider if no online rider available
      order.status = "pending_rider";
      await order.save();
      return order;
    }

    const selectedRider = onlineRiders[0];
    const now = new Date();

    // Update order
    order.assignedRiderId = selectedRider._id;
    order.status = "assigned";
    if (!order.orderTimestamps) order.orderTimestamps = {};
    order.orderTimestamps.assignedAt = now;
    await order.save();

    // Update rider status and timestamp
    selectedRider.status = "on_delivery";
    selectedRider.lastAssignedAt = now;
    selectedRider.lastOrderAssignedAt = now;
    await selectedRider.save();

    // Emit socket events
    try {
      getIO().to(`rider_${selectedRider._id}`).emit("new_order_assigned", {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6),
        pickupAddress: order.pickupAddress,
        customerAddress: order.customerAddress,
        deliveryFee: order.deliveryFee,
        status: order.status,
      });

      getIO().to(`store_${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        status: order.status,
        assignedRiderId: selectedRider._id,
        riderName: selectedRider.name,
      });
    } catch (ioErr) {
      console.warn("[orderController] Socket emit warning:", ioErr.message);
    }

    return order;
  } catch (err) {
    console.error("[autoAssignRider] Error:", err.message);
    return order;
  }
}

/**
 * Creates a new order (status: packed) for a store and triggers auto assignment.
 */
export const createOrder = async (req, res) => {
  try {
    const {
      storeId,
      pickupAddress,
      customerAddress,
      customerPhone,
      deliveryFee,
      deliveryOtp,
    } = req.body;

    let targetStoreId = storeId;
    if (!targetStoreId && req.user?.role === "delivery_manager") {
      targetStoreId = req.user.id;
    }

    if (!targetStoreId) {
      return res.status(400).json({
        success: false,
        message: "storeId is required",
      });
    }

    const order = await Order.create({
      storeId: targetStoreId,
      pickupAddress: pickupAddress || "",
      customerAddress: customerAddress || "",
      customerPhone: customerPhone || "",
      deliveryFee: deliveryFee || 40,
      deliveryOtp: deliveryOtp || String(Math.floor(1000 + Math.random() * 9000)),
      status: "packed",
      orderTimestamps: {
        packedAt: new Date(),
      },
    });

    // Auto assign online rider
    const assignedOrder = await autoAssignRider(order);

    res.status(201).json({
      success: true,
      data: assignedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

/**
 * Manager only — Returns live orders for their storeId, with rider populated.
 */
export const getOrdersForStore = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can access store orders",
      });
    }

    const storeId = req.query.storeId || req.user.id;
    const { status } = req.query;

    const filter = { storeId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("assignedRiderId", "name phone status vehicleType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch store orders",
    });
  }
};

/**
 * Manager only — Manually assign or reassign an order to a specific rider.
 */
export const manualAssignOrder = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can assign orders",
      });
    }

    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
      return res.status(400).json({
        success: false,
        message: "orderId and riderId are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    const now = new Date();
    order.assignedRiderId = rider._id;
    order.status = "assigned";
    if (!order.orderTimestamps) order.orderTimestamps = {};
    order.orderTimestamps.assignedAt = now;
    await order.save();

    rider.status = "on_delivery";
    rider.lastAssignedAt = now;
    rider.lastOrderAssignedAt = now;
    await rider.save();

    // Emit socket notification
    try {
      getIO().to(`rider_${rider._id}`).emit("new_order_assigned", {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6),
        pickupAddress: order.pickupAddress,
        customerAddress: order.customerAddress,
        deliveryFee: order.deliveryFee,
        status: order.status,
      });

      getIO().to(`store_${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        status: order.status,
        assignedRiderId: rider._id,
        riderName: rider.name,
      });
    } catch (ioErr) {
      console.warn("[manualAssignOrder] Socket emit warning:", ioErr.message);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign order",
    });
  }
};

/**
 * Rider only — Update order status (accepted -> picked_up -> out_for_delivery -> delivered).
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["accepted", "rejected", "picked_up", "out_for_delivery", "delivered"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.assignedRiderId?.toString() !== riderId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order",
      });
    }

    const now = new Date();
    order.status = status;
    if (!order.orderTimestamps) order.orderTimestamps = {};

    if (status === "accepted") order.orderTimestamps.acceptedAt = now;
    if (status === "picked_up") order.orderTimestamps.pickedUpAt = now;
    if (status === "delivered") order.orderTimestamps.deliveredAt = now;

    if (status === "rejected") {
      // Re-queue order for assignment
      order.assignedRiderId = null;
      order.status = "packed";
      await order.save();

      const rider = await Rider.findById(riderId);
      if (rider) {
        rider.status = "online";
        await rider.save();
      }

      await autoAssignRider(order);

      return res.json({
        success: true,
        message: "Order rejected and re-queued",
        data: order,
      });
    }

    if (status === "delivered") {
      // Check store peak hours
      const isPeak = await isCurrentlyPeak(order.storeId);
      const peakBonusAmount = isPeak ? 20 : 0;

      order.isPeakOrder = isPeak;
      order.peakBonus = peakBonusAmount;

      const orderEarnings = (order.deliveryFee || 0) + peakBonusAmount;

      // Update Rider metrics
      const rider = await Rider.findById(riderId);
      if (rider) {
        rider.status = "online";
        rider.todayCompletedOrders = (rider.todayCompletedOrders || 0) + 1;
        rider.todayOrderCount = (rider.todayOrderCount || 0) + 1;
        rider.todayEarnings = (rider.todayEarnings || 0) + orderEarnings;
        await rider.save();
      }

      // Upsert daily Incentive record for rider
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      await Incentive.findOneAndUpdate(
        { riderId: rider._id, date: startOfDay },
        {
          $setOnInsert: { storeId: order.storeId },
          $inc: {
            totalOrders: 1,
            totalEarnings: orderEarnings,
            targetBonusEarned: peakBonusAmount,
          },
        },
        { upsert: true, new: true }
      );
    }

    await order.save();

    // Emit live status update event to manager dashboard
    try {
      getIO().to(`store_${order.storeId}`).emit("rider_status_updated", {
        orderId: order._id,
        status: order.status,
        riderId,
        isPeakOrder: order.isPeakOrder,
        deliveredAt: order.orderTimestamps?.deliveredAt,
      });

      getIO().to(`store_${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        status: order.status,
        assignedRiderId: riderId,
      });
    } catch (ioErr) {
      console.warn("[updateOrderStatus] Socket emit warning:", ioErr.message);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};
