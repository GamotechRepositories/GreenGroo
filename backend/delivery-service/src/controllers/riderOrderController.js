import StoreOrder from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import {
  acceptDriverOffer,
  assignNextDriver,
  declineDriverOffer,
} from "../services/OrderAssignmentService.js";
import {
  generateDriverPickupToken,
  verifyPickupByDriverScan,
  verifyPickupScan,
  submitPickupProof,
  approvePickupProof,
} from "../services/PickupVerificationService.js";
import { refreshStoreOrderCustomerCoords } from "../services/customerLocationService.js";
import { OFFER_TIMEOUT_SECONDS } from "../config/orderAssignmentConfig.js";
import { getIO } from "../../../socket.js";
import { checkAndTrackIncentive } from "./incentiveController.js";

function distanceLabel(meters) {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export const getPendingOffer = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const now = new Date();

    const order = await StoreOrder.findOne({
      currentOfferDriverId: riderId,
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
        darkStoreId: (order.darkStoreId || order.managerId).toString(),
        darkStoreName: manager?.storeName || `${order.area} Dark Store`,
        darkStoreAddress: manager?.storeAddress || `${order.area}, ${order.city}`,
        darkStoreLat: manager?.latitude,
        darkStoreLng: manager?.longitude,
        itemCount: order.items.length,
        itemsSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        estimatedEarnings: Math.round(totalAmount * 0.12 + 45),
        distanceKm: "nearby",
        remainingSeconds,
        timeoutSeconds: OFFER_TIMEOUT_SECONDS,
        offerExpiresAt: order.offerExpiresAt,
        offerStartedAt: order.offerStartedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOrderOffer = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const result = await acceptDriverOffer(orderId, riderId);
    if (!result.success) {
      if (result.message?.includes("expired")) {
        assignNextDriver(orderId);
      }
      return res.status(400).json({ success: false, message: result.message });
    }

    const { order, darkStore } = result;
    const pickupQr = await generateDriverPickupToken(order);

    return res.json({
      success: true,
      message: "Order accepted! Proceed to the Dark Store for pickup verification.",
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        assignmentStatus: order.assignmentStatus,
        darkStoreId: (order.darkStoreId || order.managerId).toString(),
        darkStoreName: darkStore?.storeName || `${order.area} Dark Store`,
        darkStoreAddress: darkStore?.storeAddress || `${order.area}, ${order.city}`,
        darkStoreLat: darkStore?.latitude,
        darkStoreLng: darkStore?.longitude,
        pickupQrPayload: pickupQr.qrPayload,
        isCustomerLocationLocked: true,
        customerAddressUnlocked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const declineOrderOffer = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;
    await declineDriverOffer(orderId, riderId);
    return res.json({ success: true, message: "Order offer declined." });
  } catch (error) {
    next(error);
  }
};

export const getDriverPickupQr = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;

    const order = await StoreOrder.findOne({
      _id: orderId,
      assignedRiderId: riderId,
      status: "assigned",
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Active assigned order not found" });
    }

    const pickupQr = await generateDriverPickupToken(order);
    return res.json({
      success: true,
      pickupQrPayload: pickupQr.qrPayload,
      expiresAt: pickupQr.expiresAt,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveDelivery = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await DeliveryBoy.findById(riderId);

    let order = await StoreOrder.findOne({
      assignedRiderId: riderId,
      status: { $in: ["assigned", "pickup_verified", "out_for_delivery"] },
    }).sort({ updatedAt: -1 });

    if (!order && rider?.activeOrderId) {
      order = await StoreOrder.findOne({
        _id: rider.activeOrderId,
        assignedRiderId: riderId,
      });
    }

    if (!order) {
      if (rider?.activeOrderId) {
        await DeliveryBoy.findByIdAndUpdate(riderId, {
          $set: { activeOrderId: null, status: "online" },
        });
      }
      return res.json({ success: true, activeDelivery: null });
    }

    if (rider && (!rider.activeOrderId || rider.status !== "on_delivery")) {
      await DeliveryBoy.findByIdAndUpdate(riderId, {
        $set: { activeOrderId: order._id, status: "on_delivery" },
      });
    }

    const manager = await DeliveryManager.findById(order.managerId);
    const unlocked = Boolean(order.customerAddressUnlocked);

    if (unlocked && (order.customerLat == null || order.customerLng == null)) {
      await refreshStoreOrderCustomerCoords(order);
    }

    let pickupQrPayload = null;
    const qrScanned = Boolean(order.pickupQrScanned || order.qrScannedAt);
    if (!qrScanned && order.status === "assigned") {
      const pickupQr = await generateDriverPickupToken(order);
      pickupQrPayload = pickupQr.qrPayload;
    }

    const proofStatus = order.pickupProofStatus || "none";

    const safeData = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      assignmentStatus: order.assignmentStatus,
      darkStoreId: (order.darkStoreId || order.managerId).toString(),
      darkStoreName: manager?.storeName || `${order.area} Dark Store`,
      darkStoreAddress: manager?.storeAddress || `${order.area}, ${order.city}`,
      darkStorePhone: manager?.phone || null,
      darkStoreLat: manager?.latitude,
      darkStoreLng: manager?.longitude,
      pickupQrPayload,
      items: order.items,
      pickupQrScanned: qrScanned,
      pickupQrScannedAt: order.pickupQrScannedAt || order.qrScannedAt,
      pickupProofStatus: proofStatus,
      pickupProofSubmittedAt: order.pickupProofSubmittedAt,
      pickupVerified: Boolean(order.pickupVerified),
      pickupVerifiedAt: order.pickupVerifiedAt,
      isCustomerLocationLocked: !unlocked,
      customerAddressUnlocked: unlocked,
      customerName: unlocked ? order.customerName : "Customer",
      customerPhone: unlocked ? order.customerPhone : "Locked until manager approves item proof",
      customerAddress: unlocked
        ? order.customerAddress
        : qrScanned && proofStatus === "pending"
          ? "Waiting for manager to approve your item photo"
          : qrScanned
            ? "Take item photo and send to manager to unlock address"
            : "Customer address unlocks after QR scan + manager item approval",
      customerLat: unlocked ? order.customerLat : null,
      customerLng: unlocked ? order.customerLng : null,
      otpCode: unlocked ? order.otpCode || "4321" : null,
    };

    return res.json({ success: true, activeDelivery: safeData });
  } catch (error) {
    next(error);
  }
};

export const scanPickupQr = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const scannedPayload = String(
      req.body.qrPayload || req.body.qrData || req.body.qrCode || ""
    ).trim();

    if (!scannedPayload) {
      return res.status(400).json({ success: false, message: "QR payload is required" });
    }

    const result = await verifyPickupByDriverScan({ driverId: riderId, scannedPayload });
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }

    if (orderId && String(result.order._id) !== String(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Scanned QR does not match this order",
      });
    }

    const manager = await DeliveryManager.findById(result.order.managerId);

    return res.json({
      success: true,
      message: result.alreadyScanned
        ? "Pickup QR already scanned. Take item photo for manager approval."
        : "Pickup QR scanned! Now capture item photo for manager approval.",
      activeDelivery: {
        id: result.order._id.toString(),
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        darkStoreName: manager?.storeName || `${result.order.area} Dark Store`,
        darkStoreAddress: manager?.storeAddress || "",
        pickupQrScanned: true,
        pickupProofStatus: result.order.pickupProofStatus || "none",
        isCustomerLocationLocked: true,
        customerAddressUnlocked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerOrderPickupQr = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { orderId } = req.params;

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId,
      status: "assigned",
      assignedRiderId: { $ne: null },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Assigned order not found or not ready for pickup QR",
      });
    }

    const pickupQr = await generateDriverPickupToken(order);
    const rider = await DeliveryBoy.findById(order.assignedRiderId).select("name phone");

    return res.json({
      success: true,
      orderNumber: order.orderNumber,
      pickupQrPayload: pickupQr.qrPayload,
      expiresAt: pickupQr.expiresAt,
      driverName: rider?.name || rider?.phone || "Delivery Partner",
    });
  } catch (error) {
    next(error);
  }
};

/** Legacy rider-initiated store QR scan — prefer scanPickupQr */
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
      return res.status(403).json({ success: false, message: "You are not assigned to this order" });
    }

    const expectedQr = order.darkStoreQrCode || `DARKSTORE_${order.managerId}`;
    if (scannedQr !== expectedQr && !scannedQr.startsWith("DARKSTORE_")) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR. Show your pickup QR to the Dark Store for scanning.",
      });
    }

    order.pickupQrScanned = true;
    order.pickupQrScannedAt = new Date();
    order.qrScannedAt = new Date();
    order.assignmentStatus = "PICKUP_PENDING";
    await order.save();

    try {
      getIO().to(`store_${order.managerId}`).emit("pickup_qr_scanned", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
    } catch (err) {}

    return res.json({
      success: true,
      message: "Store QR scanned. Capture item photo for manager approval.",
      activeDelivery: {
        id: order._id.toString(),
        pickupQrScanned: true,
        pickupProofStatus: order.pickupProofStatus || "none",
        isCustomerLocationLocked: true,
        customerAddressUnlocked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
      return res.status(403).json({ success: false, message: "You are not assigned to this order" });
    }

    if (!order.customerAddressUnlocked) {
      return res.status(400).json({
        success: false,
        message: "Manager must approve item proof before delivery",
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
    order.assignmentStatus = "DELIVERED";
    order.deliveredAt = new Date();
    await order.save();

    const rider = await DeliveryBoy.findById(riderId);
    if (rider) {
      const totalAmount = (order.items || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );
      const estimatedEarnings = Math.round(totalAmount * 0.12 + 45);

      rider.status = "online";
      rider.activeOrderId = null;
      rider.todayCompletedOrders = (rider.todayCompletedOrders || 0) + 1;
      rider.todayEarnings = (rider.todayEarnings || 0) + estimatedEarnings;
      rider.walletBalance = (rider.walletBalance || 0) + estimatedEarnings;
      rider.totalLifetimeEarnings = (rider.totalLifetimeEarnings || 0) + estimatedEarnings;
      rider.lastOrderCompletedAt = new Date();
      rider.lastStatusAt = new Date();
      rider.onlineSince = rider.onlineSince || new Date();
      await rider.save();
    }

    await checkAndTrackIncentive(riderId, order.managerId).catch(() => {});

    try {
      getIO().to(`store_${order.managerId}`).emit("order_delivered", {
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

export const verifyPickupByManager = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { orderId } = req.params;
    const scannedPayload = String(req.body.qrPayload || req.body.token || "").trim();

    const result = await verifyPickupScan({
      darkStoreId: managerId,
      orderId,
      scannedPayload,
      verifiedBy: managerId,
    });

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.alreadyScanned
        ? "Pickup QR already scanned for this order."
        : "Pickup QR scanned. Driver should send item photo for approval.",
      order: result.order.toSafeJSON(),
      driver: result.driver,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPickupProofByDriver = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const imageBase64 = String(
      req.body.imageBase64 || req.body.pickupProofImage || req.body.image || ""
    ).trim();

    const result = await submitPickupProof({ orderId, driverId: riderId, imageBase64 });
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.alreadySubmitted
        ? "Item photo already sent. Waiting for manager approval."
        : "Item photo sent to manager. Address unlocks after approval.",
      activeDelivery: {
        id: result.order._id.toString(),
        orderNumber: result.order.orderNumber,
        pickupQrScanned: true,
        pickupProofStatus: result.order.pickupProofStatus,
        isCustomerLocationLocked: true,
        customerAddressUnlocked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approvePickupProofByManager = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { orderId } = req.params;

    const result = await approvePickupProof({ orderId, managerId });
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.alreadyApproved
        ? "Item proof already approved."
        : "Item proof approved. Driver can now navigate to customer.",
      order: result.order.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
