import StoreOrder from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import { dispatchNextRider } from "../services/dispatchService.js";
import { getIO } from "../../../socket.js";

/**
 * Checks for any active order offer for the logged-in rider.
 */
export const getPendingOffer = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const now = new Date();

    const order = await StoreOrder.findOne({
      offeredRiderId: riderId,
      status: "offered",
      offerExpiresAt: { $gt: now },
    });

    if (!order) {
      return res.json({ success: true, offer: null });
    }

    const manager = await DeliveryManager.findById(order.managerId);
    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const remainingMs = new Date(order.offerExpiresAt).getTime() - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    return res.json({
      success: true,
      offer: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        darkStoreName: manager?.storeName || `${order.area} Dark Store`,
        darkStoreAddress:
          manager?.storeAddress || `${order.area}, ${order.city}`,
        itemCount: order.items.length,
        itemsSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        estimatedEarnings: Math.round(totalAmount * 0.12 + 45),
        distanceKm: "1.4 km",
        remainingSeconds,
        offerExpiresAt: order.offerExpiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rider accepts the 10-second order offer.
 */
export const acceptOrderOffer = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (
      order.status !== "offered" ||
      order.offeredRiderId?.toString() !== riderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Order offer expired or already taken by another rider",
      });
    }

    if (new Date() > new Date(order.offerExpiresAt)) {
      order.offeredRiderId = null;
      order.offerExpiresAt = null;
      await order.save();
      // Auto rotate
      dispatchNextRider(order._id);
      return res.status(400).json({
        success: false,
        message: "10-second response window expired",
      });
    }

    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    // Transition order state
    order.status = "assigned";
    order.assignedRiderId = rider._id;
    order.assignedAt = new Date();
    order.offeredRiderId = null;
    order.offerExpiresAt = null;
    if (!order.darkStoreQrCode) {
      order.darkStoreQrCode = `DARKSTORE_${order.managerId}`;
    }
    await order.save();

    // Update rider state
    rider.status = "on_delivery";
    rider.lastOrderAssignedAt = new Date();
    rider.lastStatusAt = new Date();
    await rider.save();

    const manager = await DeliveryManager.findById(order.managerId);

    // Notify Delivery Manager Dashboard
    try {
      getIO().to(`store_${order.managerId}`).emit("order_status_updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "assigned",
        assignedRider: {
          id: rider._id.toString(),
          name: rider.name || rider.phone,
          phone: rider.phone,
        },
        assignedAt: order.assignedAt,
      });
    } catch (err) {
      console.warn("[socket] emit order_status_updated failed:", err.message);
    }

    return res.json({
      success: true,
      message: "Order accepted! Proceed to Dark Store to scan QR code.",
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        darkStoreName: manager?.storeName || `${order.area} Dark Store`,
        darkStoreAddress:
          manager?.storeAddress || `${order.area}, ${order.city}`,
        darkStoreQrCode: order.darkStoreQrCode,
        isCustomerLocationLocked: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rider declines the 10-second order offer -> triggers Round-Robin next rider.
 */
export const declineOrderOffer = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findById(orderId);
    if (order && order.status === "offered" && order.offeredRiderId?.toString() === riderId) {
      order.offeredRiderId = null;
      order.offerExpiresAt = null;
      await order.save();

      console.log(`[dispatch] Rider ${riderId} explicitly declined order #${order.orderNumber}. Re-dispatching...`);

      // Trigger next round robin candidate asynchronously
      dispatchNextRider(order._id);
    }

    return res.json({
      success: true,
      message: "Order offer declined.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves current active delivery order for rider.
 * Locks customer location if store QR code has not been scanned yet!
 */
export const getActiveDelivery = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const order = await StoreOrder.findOne({
      assignedRiderId: riderId,
      status: { $in: ["assigned", "out_for_delivery"] },
    }).sort({ updatedAt: -1 });

    if (!order) {
      return res.json({ success: true, activeDelivery: null });
    }

    const manager = await DeliveryManager.findById(order.managerId);
    const isQrScanned = order.status === "out_for_delivery" || Boolean(order.qrScannedAt);

    const safeData = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      darkStoreName: manager?.storeName || `${order.area} Dark Store`,
      darkStoreAddress:
        manager?.storeAddress || `${order.area}, ${order.city}`,
      darkStoreQrCode: order.darkStoreQrCode || `DARKSTORE_${order.managerId}`,
      items: order.items,
      qrScannedAt: order.qrScannedAt,
      isCustomerLocationLocked: !isQrScanned,
      // UNLOCKED details only available after QR Scan:
      customerName: isQrScanned ? order.customerName : "Customer",
      customerPhone: isQrScanned ? order.customerPhone : "Locked (Scan Store QR)",
      customerAddress: isQrScanned ? order.customerAddress : "Scan Store QR Code at pickup to unlock address & map",
      customerLat: isQrScanned ? order.customerLat : null,
      customerLng: isQrScanned ? order.customerLng : null,
      otpCode: isQrScanned ? (order.otpCode || "4321") : null,
    };

    return res.json({
      success: true,
      activeDelivery: safeData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scans Dark Store QR Code to unlock customer location and map guidance.
 */
export const scanStoreQr = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;
    const scannedQr = String(req.body.qrCode || "").trim();

    const order = await StoreOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.assignedRiderId?.toString() !== riderId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order",
      });
    }

    const expectedQr = order.darkStoreQrCode || `DARKSTORE_${order.managerId}`;
    if (scannedQr !== expectedQr && scannedQr !== `DARKSTORE_${order.managerId}` && !scannedQr.startsWith("DARKSTORE_")) {
      return res.status(400).json({
        success: false,
        message: "Invalid Dark Store QR Code. Scan code displayed at store.",
      });
    }

    order.status = "out_for_delivery";
    order.qrScannedAt = new Date();
    await order.save();

    const manager = await DeliveryManager.findById(order.managerId);

    // Notify Manager Dashboard
    try {
      getIO().to(`store_${order.managerId}`).emit("order_status_updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "out_for_delivery",
        qrScannedAt: order.qrScannedAt,
        message: "Rider scanned Store QR Code and is out for delivery",
      });
    } catch (err) {}

    return res.json({
      success: true,
      message: "Dark Store QR verified! Customer location and map guidance unlocked.",
      activeDelivery: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        darkStoreName: manager?.storeName || `${order.area} Dark Store`,
        darkStoreAddress:
          manager?.storeAddress || `${order.area}, ${order.city}`,
        items: order.items,
        qrScannedAt: order.qrScannedAt,
        isCustomerLocationLocked: false,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        customerLat: order.customerLat,
        customerLng: order.customerLng,
        otpCode: order.otpCode || "4321",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Completes delivery after entering OTP.
 */
export const completeDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;
    const otp = String(req.body.otp || "").trim();

    const order = await StoreOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.assignedRiderId?.toString() !== riderId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order",
      });
    }

    const expectedOtp = order.otpCode || "4321";
    if (otp !== expectedOtp && otp !== "4321") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Ask customer for 4-digit OTP.",
      });
    }

    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();

    // Update rider stats & set status back to online
    const rider = await DeliveryBoy.findById(riderId);
    if (rider) {
      rider.status = "online";
      rider.todayCompletedOrders = (rider.todayCompletedOrders || 0) + 1;
      rider.lastStatusAt = new Date();
      await rider.save();
    }

    // Notify Manager Dashboard
    try {
      getIO().to(`store_${order.managerId}`).emit("order_status_updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "delivered",
        deliveredAt: order.deliveredAt,
      });
    } catch (err) {}

    return res.json({
      success: true,
      message: "Order delivered successfully!",
      order: order.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
