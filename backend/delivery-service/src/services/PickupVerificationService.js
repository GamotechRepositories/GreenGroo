import crypto from "crypto";
import PickupVerificationToken from "../models/PickupVerificationToken.js";
import StoreOrder from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import { getIO } from "../../../socket.js";
import { PICKUP_TOKEN_TTL_MS } from "../config/orderAssignmentConfig.js";

function buildQrPayload(orderId, token) {
  return `PICKUP:${orderId}:${token}`;
}

export async function generateDriverPickupToken(order) {
  const existing = await PickupVerificationToken.findOne({
    orderId: order._id,
    driverId: order.assignedRiderId,
    used: false,
    verified: false,
    tokenExpiresAt: { $gt: new Date() },
  });

  if (existing) {
    return {
      token: existing.verificationToken,
      qrPayload: buildQrPayload(order._id.toString(), existing.verificationToken),
      expiresAt: existing.tokenExpiresAt,
    };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + PICKUP_TOKEN_TTL_MS);

  await PickupVerificationToken.create({
    orderId: order._id,
    driverId: order.assignedRiderId,
    darkStoreId: order.managerId,
    verificationToken: token,
    tokenExpiresAt: expiresAt,
  });

  return {
    token,
    qrPayload: buildQrPayload(order._id.toString(), token),
    expiresAt,
  };
}

export async function verifyPickupScan({ darkStoreId, orderId, scannedPayload, verifiedBy }) {
  const raw = String(scannedPayload || "").trim();
  let token = raw;
  if (raw.startsWith("PICKUP:")) {
    const parts = raw.split(":");
    token = parts[2] || "";
  }

  if (!token) {
    return { success: false, status: 400, message: "Invalid pickup QR code" };
  }

  const order = await StoreOrder.findOne({
    _id: orderId,
    managerId: darkStoreId,
  });

  if (!order) {
    return { success: false, status: 404, message: "Order not found for this dark store" };
  }

  if (order.status !== "assigned") {
    return {
      success: false,
      status: 400,
      message: `Order must be assigned to a driver before pickup scan (current: ${order.status})`,
    };
  }

  if (!order.assignedRiderId) {
    return { success: false, status: 400, message: "No driver assigned to this order" };
  }

  const record = await PickupVerificationToken.findOne({
    orderId: order._id,
    verificationToken: token,
    darkStoreId,
    driverId: order.assignedRiderId,
  });

  if (!record) {
    return { success: false, status: 400, message: "Invalid or mismatched pickup verification token" };
  }

  if (record.used || record.verified) {
    return { success: false, status: 400, message: "Pickup token already used" };
  }

  if (new Date() > new Date(record.tokenExpiresAt)) {
    return { success: false, status: 400, message: "Pickup verification token expired" };
  }

  const driver = await DeliveryBoy.findOne({
    _id: order.assignedRiderId,
    managerId: darkStoreId,
  });

  if (!driver) {
    return { success: false, status: 403, message: "Driver does not belong to this dark store" };
  }

  const now = new Date();

  record.used = true;
  record.verified = true;
  record.verifiedAt = now;
  record.verifiedBy = verifiedBy;
  await record.save();

  order.pickupVerified = true;
  order.pickupVerifiedAt = now;
  order.pickupVerifiedBy = verifiedBy;
  order.customerAddressUnlocked = true;
  order.qrScannedAt = now;
  order.status = "out_for_delivery";
  await order.save();

  try {
    getIO()
      .to(`rider_${order.assignedRiderId}`)
      .emit("pickup_verified", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        message: "Pickup verified. Customer address unlocked.",
      });
    getIO()
      .to(`rider_${order.assignedRiderId}`)
      .emit("customer_address_unlocked", {
        orderId: order._id.toString(),
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        customerLat: order.customerLat,
        customerLng: order.customerLng,
      });
    getIO()
      .to(`store_${darkStoreId}`)
      .emit("pickup_verified", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "out_for_delivery",
        pickupVerifiedAt: now,
      });
    getIO()
      .to(`store_${darkStoreId}`)
      .emit("order_out_for_delivery", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
  } catch (err) {
    console.warn("[pickup] socket emit failed:", err.message);
  }

  return {
    success: true,
    order,
    driver: {
      id: driver._id.toString(),
      name: driver.name || driver.phone,
    },
  };
}

/** Driver scans the pickup QR shown on the manager incoming-order screen. */
export async function verifyPickupByDriverScan({ driverId, scannedPayload }) {
  const raw = String(scannedPayload || "").trim();
  if (!raw.startsWith("PICKUP:")) {
    return { success: false, status: 400, message: "Invalid pickup QR code" };
  }

  const parts = raw.split(":");
  const orderId = parts[1];
  if (!orderId) {
    return { success: false, status: 400, message: "Invalid pickup QR code" };
  }

  const order = await StoreOrder.findById(orderId);
  if (!order) {
    return { success: false, status: 404, message: "Order not found for this QR" };
  }

  if (String(order.assignedRiderId) !== String(driverId)) {
    return {
      success: false,
      status: 403,
      message: "This pickup QR is not for your assigned order",
    };
  }

  return verifyPickupScan({
    darkStoreId: order.managerId,
    orderId: order._id,
    scannedPayload: raw,
    verifiedBy: null,
  });
}
