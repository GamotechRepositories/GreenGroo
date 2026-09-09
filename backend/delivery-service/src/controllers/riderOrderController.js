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
import { calculateRiderEarning, estimateOfferEarning } from "../services/ShiftEarningService.js";
import { createCashLiability } from "../services/CashSettlementService.js";
import { getPaymentSummary } from "../services/PaymentCollectionService.js";
import { isS3Configured, uploadDataUrlToS3, uploadBufferToS3 } from "../services/s3Service.js";

const MAX_OTP_ATTEMPTS = 5;

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
    const rider = await DeliveryBoy.findById(riderId).select("currentBooking");
    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const remainingMs = new Date(order.offerExpiresAt).getTime() - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    let estimatedEarnings = 0;
    try {
      const estimate = await estimateOfferEarning({
        shiftId: order.shiftId || rider?.currentBooking?.shiftId || null,
        managerId: order.managerId,
        riderId,
        storeLat: manager?.latitude,
        storeLng: manager?.longitude,
        customerLat: order.customerLat,
        customerLng: order.customerLng,
      });
      estimatedEarnings = Math.round(estimate.earnUpTo || estimate.estimatedEarnings || 0);
    } catch (_) {}
    if (estimatedEarnings <= 0) {
      estimatedEarnings = Math.round(totalAmount * 0.12 + 45);
    }

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
        estimatedEarnings,
        earnUpTo: estimatedEarnings,
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

    // Store the rider's active shift booking on the order for earning slab lookup later
    try {
      const rider = await DeliveryBoy.findById(riderId).select("currentBooking");
      if (rider?.currentBooking?.shiftId && !order.shiftId) {
        await StoreOrder.findByIdAndUpdate(order._id, { shiftId: rider.currentBooking.shiftId });
        order.shiftId = rider.currentBooking.shiftId;
      }
    } catch (shiftErr) {
      console.warn("[acceptOrderOffer] shiftId linkage warning:", shiftErr.message);
    }

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
    const itemsTotal = (order.items || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const amountToCollect = Number(order.amountToCollect || 0);
    const deliveryFee = Math.max(0, Math.round(amountToCollect - itemsTotal));

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
      deliveryProofImageUrl: order.deliveryProofImageUrl || "",
      customerOtpVerified: Boolean(order.customerOtpVerified),
      paymentMethod: order.paymentMethod || "",
      paymentStatus: order.paymentStatus || "pending",
      amountToCollect,
      amountCollected: order.amountCollected || 0,
      itemsTotal: Math.round(itemsTotal),
      deliveryFee,
      // Never send OTP to rider — customer must share it from their order screen
      otpCode: null,
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

/**
 * Upload delivery proof photo (rider captures photo at customer location).
 * Saves to order.deliveryProofImageUrl. Must be called before OTP verification.
 */
export const uploadDeliveryProof = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const imageBase64 = String(
      req.body.imageBase64 || req.body.image || req.body.deliveryProofImage || ""
    ).trim();

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "Delivery proof image is required" });
    }

    const order = await StoreOrder.findOne({
      _id: orderId,
      assignedRiderId: riderId,
      status: { $in: ["assigned", "pickup_verified", "out_for_delivery"] },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Active order not found or not in delivery state",
      });
    }

    if (!order.customerAddressUnlocked) {
      return res.status(400).json({
        success: false,
        message: "Customer address must be unlocked before uploading delivery proof",
      });
    }

    // Upload to S3 if configured, otherwise store as-is (base64 data URL)
    let proofUrl = imageBase64;
    try {
      if (isS3Configured() && imageBase64.startsWith("data:")) {
        const s3Res = await uploadDataUrlToS3(imageBase64, "delivery-proofs");
        if (s3Res?.url) {
          proofUrl = s3Res.url;
        } else if (typeof s3Res === "string") {
          proofUrl = s3Res;
        }
      }
    } catch (err) {
      console.warn("[delivery-proof] S3 upload failed, storing data URL:", err.message);
    }

    order.deliveryProofImageUrl = String(proofUrl);
    order.proofUploadedAt = new Date();
    await order.save();

    return res.json({
      success: true,
      message: "Delivery proof uploaded. Please ask customer for OTP.",
      deliveryProofImageUrl: order.deliveryProofImageUrl,
      proofUploadedAt: order.proofUploadedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify customer OTP (backend validates — never trust Flutter).
 * OTP is rate-limited to MAX_OTP_ATTEMPTS.
 */
export const verifyCustomerOtp = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;
    const otp = String(req.body.otp || "").trim();

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const order = await StoreOrder.findOne({
      _id: orderId,
      assignedRiderId: riderId,
      status: { $in: ["pickup_verified", "out_for_delivery", "assigned"] },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Active order not found" });
    }

    if (order.customerOtpVerified) {
      return res.json({ success: true, alreadyVerified: true, message: "OTP already verified" });
    }

    // Rate-limit OTP attempts
    const now = new Date();
    if (order.otpLockedUntil && order.otpLockedUntil > now) {
      const waitSecs = Math.ceil((order.otpLockedUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again in ${waitSecs} seconds.`,
      });
    }

    const expectedOtp = String(order.otpCode || order.deliveryOtp || "").trim();
    if (!expectedOtp || otp !== expectedOtp) {
      order.otpAttempts = (order.otpAttempts || 0) + 1;
      if (order.otpAttempts >= MAX_OTP_ATTEMPTS) {
        order.otpLockedUntil = new Date(now.getTime() + 5 * 60 * 1000); // locked 5 min
      }
      await order.save();
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. Ask the customer for the code in their GreenGroo order. ${Math.max(0, MAX_OTP_ATTEMPTS - order.otpAttempts)} attempt(s) remaining.`,
        attemptsRemaining: Math.max(0, MAX_OTP_ATTEMPTS - order.otpAttempts),
      });
    }

    // OTP correct
    order.customerOtpVerified = true;
    order.customerOtpVerifiedAt = now;
    order.otpAttempts = 0;
    order.otpLockedUntil = undefined;
    await order.save();

    return res.json({
      success: true,
      message: "OTP verified successfully. You can now complete the delivery.",
      customerOtpVerified: true,
      customerOtpVerifiedAt: order.customerOtpVerifiedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm cash collection from customer.
 * Updates order payment fields and creates a CashSettlement record.
 * Backend remains source of truth — Flutter cannot submit arbitrary amounts.
 */
export const confirmCashCollection = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findOne({
      _id: orderId,
      assignedRiderId: riderId,
      status: { $in: ["pickup_verified", "out_for_delivery", "assigned"] },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Active order not found" });
    }

    // Guard: don't allow cash collection if already paid online
    if (order.paymentStatus === "paid_online") {
      return res.status(400).json({
        success: false,
        message: "This order is already paid online. No cash collection required.",
      });
    }

    if (order.paymentStatus === "collected") {
      return res.json({ success: true, alreadyCollected: true, message: "Cash already marked as collected" });
    }

    const amountToCollect = order.amountToCollect || 0;
    if (amountToCollect <= 0) {
      // Backfill from items for older orders missing amountToCollect
      const itemsTotal = (order.items || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      );
      if (itemsTotal <= 0) {
        return res.status(400).json({ success: false, message: "No amount to collect for this order" });
      }
      order.amountToCollect = Math.round(itemsTotal);
    }

    // Update order payment status
    order.paymentMethod = "COD";
    order.paymentStatus = "collected";
    order.amountCollected = order.amountToCollect;
    await order.save();

    // Create cash liability record and increment rider's pending cash
    const darkStoreId = order.darkStoreId || order.managerId;
    await createCashLiability({
      orderId: order._id,
      riderId,
      darkStoreId,
      amount: order.amountToCollect,
      orderNumber: order.orderNumber,
    });

    return res.json({
      success: true,
      message: `Cash ₹${order.amountToCollect} collected. This amount must be submitted to the Dark Store.`,
      amountCollected: order.amountToCollect,
      paymentStatus: "collected",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Main delivery completion endpoint.
 *
 * Pre-conditions enforced by backend (not trusted from Flutter):
 *   1. Order is in valid delivery state
 *   2. Rider is assigned to this order
 *   3. Customer address was unlocked (pickup verified)
 *   4. Delivery proof photo uploaded
 *   5. Customer OTP verified by backend
 *   6. Payment: either paid_online OR cash collected (paymentStatus = collected)
 *
 * On success:
 *   - Order status → delivered
 *   - Calculate delivery distance and earning from Shift slabs
 *   - Update rider statistics (todayEarnings, totalLifetimeEarnings, todayCompletedOrders)
 *   - Note: Gig/incentive bonus is calculated separately via checkAndTrackIncentive
 */
export const completeDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.assignedRiderId?.toString() !== riderId) {
      return res.status(403).json({ success: false, message: "You are not assigned to this order" });
    }

    // Already delivered?
    if (order.status === "delivered") {
      return res.json({ success: true, alreadyDelivered: true, message: "Order already delivered", order: order.toSafeJSON() });
    }

    // ── Condition 1: Customer address must have been unlocked ──────────────
    if (!order.customerAddressUnlocked) {
      return res.status(400).json({
        success: false,
        message: "Pickup must be verified and item proof approved before delivery",
      });
    }

    // ── Condition 2: Delivery proof photo must be uploaded ─────────────────
    if (!order.deliveryProofImageUrl) {
      return res.status(400).json({
        success: false,
        message: "Delivery proof photo is required. Capture a photo at the customer's location.",
      });
    }

    // ── Condition 3: Customer OTP must be verified ─────────────────────────
    if (!order.customerOtpVerified) {
      const otp = String(req.body.otp || "").trim();
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: "Ask the customer for the Delivery OTP shown in their order screen.",
        });
      }

      if (order.otpLockedUntil && order.otpLockedUntil > new Date()) {
        const waitSecs = Math.ceil((order.otpLockedUntil - new Date()) / 1000);
        return res.status(429).json({
          success: false,
          message: `Too many incorrect OTP attempts. Try again in ${waitSecs} seconds.`,
        });
      }

      const expectedOtp = String(order.otpCode || order.deliveryOtp || "").trim();
      if (!expectedOtp || otp !== expectedOtp) {
        order.otpAttempts = (order.otpAttempts || 0) + 1;
        if (order.otpAttempts >= MAX_OTP_ATTEMPTS) {
          order.otpLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        }
        await order.save();
        return res.status(400).json({
          success: false,
          message: `Incorrect OTP. Ask the customer for the code in their GreenGroo order. ${Math.max(0, MAX_OTP_ATTEMPTS - order.otpAttempts)} attempt(s) remaining.`,
          attemptsRemaining: Math.max(0, MAX_OTP_ATTEMPTS - order.otpAttempts),
        });
      }

      order.customerOtpVerified = true;
      order.customerOtpVerifiedAt = new Date();
      order.otpAttempts = 0;
      order.otpLockedUntil = undefined;
    }

    // ── Condition 4: Payment must be resolved ──────────────────────────────
    // Accept: paid_online, collected (cash), or free/zero-amount orders
    const paymentOk =
      order.paymentStatus === "paid_online" ||
      order.paymentStatus === "collected" ||
      (order.amountToCollect || 0) === 0;

    if (!paymentOk) {
      return res.status(400).json({
        success: false,
        message: "Payment must be collected or confirmed before completing delivery",
      });
    }

    const now = new Date();

    // ── Mark order delivered ───────────────────────────────────────────────
    order.status = "delivered";
    order.assignmentStatus = "DELIVERED";
    order.deliveredAt = now;

    // ── Calculate rider delivery earning from Shift KM slabs ───────────────
    const rider = await DeliveryBoy.findById(riderId);
    const darkStore = await DeliveryManager.findById(order.managerId);

    const shiftIdForCalc = order.shiftId || rider?.currentBooking?.shiftId || null;
    const earningResult = await calculateRiderEarning({
      shiftId: shiftIdForCalc,
      managerId: order.managerId,
      riderId,
      atDate: order.assignedAt || order.packedAt || now,
      storeLat: darkStore?.latitude ?? null,
      storeLng: darkStore?.longitude ?? null,
      customerLat: order.customerLat ?? null,
      customerLng: order.customerLng ?? null,
    });

    const distanceKm = earningResult.distanceKm;
    const riderDeliveryEarning = earningResult.riderEarning;
    const earningSlab = earningResult.earningSlab;

    order.deliveryDistanceKm = distanceKm || 0;
    order.riderDeliveryEarning = riderDeliveryEarning || 0;
    if (earningSlab) order.earningSlab = earningSlab;
    if (earningResult.shift?._id && !order.shiftId) {
      order.shiftId = earningResult.shift._id;
    }
    if (shiftIdForCalc && !order.shiftId) order.shiftId = shiftIdForCalc;
    order.earningCalculatedAt = now;

    await order.save();

    // ── Update rider statistics ────────────────────────────────────────────
    if (rider) {
      rider.status = "online";
      rider.activeOrderId = null;
      rider.todayCompletedOrders = (rider.todayCompletedOrders || 0) + 1;
      // Add only the configured delivery earning — NOT the customer's cash
      rider.todayEarnings = (rider.todayEarnings || 0) + riderDeliveryEarning;
      rider.totalLifetimeEarnings = (rider.totalLifetimeEarnings || 0) + riderDeliveryEarning;
      rider.lastOrderCompletedAt = now;
      rider.lastStatusAt = now;
      rider.onlineSince = rider.onlineSince || now;
      await rider.save();
    }

    // ── Gig / Incentive bonus (separate from delivery earning) ─────────────
    await checkAndTrackIncentive(riderId, order.managerId).catch(() => {});

    if (riderDeliveryEarning > 0) {
      try {
        const { notifyOrderCompleted } = await import("../services/RiderNotificationService.js");
        await notifyOrderCompleted(riderId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: riderDeliveryEarning,
        });
      } catch (err) {
        console.warn("[completeDelivery] wallet notification failed:", err.message);
      }
    }

    // ── Notify Dark Store ──────────────────────────────────────────────────
    try {
      getIO().to(`store_${order.managerId}`).emit("order_delivered", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "delivered",
        deliveredAt: order.deliveredAt,
        deliveryDistanceKm: order.deliveryDistanceKm,
        riderDeliveryEarning: order.riderDeliveryEarning,
      });
    } catch (err) {}

    return res.json({
      success: true,
      message: "Order delivered successfully!",
      order: order.toSafeJSON(),
      deliverySummary: {
        distanceKm: order.deliveryDistanceKm,
        riderDeliveryEarning: order.riderDeliveryEarning,
        earningSlab: order.earningSlab,
        paymentStatus: order.paymentStatus,
        amountCollected: order.amountCollected,
      },
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

/**
 * Rider confirms online payment from customer (e.g. UPI/Razorpay at delivery).
 * Backend must be the source of truth — Flutter cannot set paymentStatus directly.
 * POST /rider/orders/:orderId/confirm-online-payment
 */
export const confirmOnlinePaymentForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findOne({
      _id: orderId,
      assignedRiderId: riderId,
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.paymentStatus === "collected") {
      return res.status(400).json({ success: false, message: "Cash already collected for this order." });
    }
    if (order.paymentStatus === "paid_online") {
      return res.json({ success: true, message: "Order already marked as paid online.", paymentStatus: "paid_online" });
    }

    // TODO: In production, verify Razorpay payment here using razorpay_payment_id + signature
    // For now, allow manager-confirmed / backend flow
    order.paymentMethod = "online";
    order.paymentStatus = "paid_online";
    order.amountCollected = order.amountToCollect || 0;
    await order.save();

    return res.json({
      success: true,
      message: "Online payment confirmed.",
      paymentStatus: "paid_online",
      amountCollected: order.amountCollected,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status for an order (rider view).
 * GET /rider/orders/:orderId/payment-status
 */
export const getOrderPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const order = await StoreOrder.findOne({ _id: orderId, assignedRiderId: riderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return res.json({
      success: true,
      payment: getPaymentSummary(order),
    });
  } catch (error) {
    next(error);
  }
};
