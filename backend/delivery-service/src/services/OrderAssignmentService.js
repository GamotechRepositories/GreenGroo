import crypto from "crypto";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreOrder from "../models/StoreOrder.js";
import DriverOfferHistory from "../models/DriverOfferHistory.js";
import { haversineKm } from "./darkStoreResolver.js";
import { getIO } from "../../../socket.js";
import {
  LOCATION_FRESHNESS_MS,
  MAX_ASSIGNMENT_DISTANCE_M,
  MIN_ASSIGNMENT_DISTANCE_M,
  OFFER_TIMEOUT_SECONDS,
} from "../config/orderAssignmentConfig.js";

const activeOfferTimers = new Map();
const waitingOrderIds = new Set();

function darkStoreIdOf(orderOrManager) {
  return String(orderOrManager?.darkStoreId || orderOrManager?.managerId || "");
}

function metersBetween(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

function formatDistance(meters) {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function waitingSince(driver) {
  return (
    driver.lastOrderCompletedAt ||
    driver.lastOrderAssignedAt ||
    driver.lastOnlineAt ||
    driver.onlineSince ||
    driver.createdAt
  );
}

function assignmentMaxDistanceM(darkStore) {
  const geofence = Number(darkStore?.geofenceRadius);
  const fromStore = Number.isFinite(geofence) && geofence > 0 ? geofence : 500;
  return Math.max(fromStore, MAX_ASSIGNMENT_DISTANCE_M, 2000);
}

export async function findEligibleDrivers(darkStore, excludedIds = []) {
  const storeLat = darkStore.latitude;
  const storeLng = darkStore.longitude;
  const storeId = darkStore._id;
  const maxDistanceM = assignmentMaxDistanceM(darkStore);

  const drivers = await DeliveryBoy.find({
    managerId: storeId,
    isActive: true,
    status: "online",
    activeOrderId: null,
    _id: { $nin: excludedIds },
    $or: [{ verificationStatus: "approved" }, { verificationStatus: { $exists: false } }],
  });

  const now = Date.now();
  const eligible = [];

  for (const driver of drivers) {
    const loc = driver.currentLocation;
    if (!loc?.lat || !loc?.lng) continue;
    if (!loc.updatedAt || now - new Date(loc.updatedAt).getTime() > LOCATION_FRESHNESS_MS) {
      continue;
    }

    const distanceM = metersBetween(storeLat, storeLng, loc.lat, loc.lng);
    if (distanceM == null) continue;
    if (distanceM < MIN_ASSIGNMENT_DISTANCE_M || distanceM > maxDistanceM) {
      continue;
    }

    eligible.push({ driver, distanceM });
  }

  eligible.sort((a, b) => {
    const waitA = new Date(waitingSince(a.driver)).getTime();
    const waitB = new Date(waitingSince(b.driver)).getTime();
    if (waitA !== waitB) return waitA - waitB;
    const rrA = a.driver.roundRobinPosition ?? 0;
    const rrB = b.driver.roundRobinPosition ?? 0;
    return rrA - rrB;
  });

  return eligible;
}

function clearOfferTimer(orderId) {
  const key = String(orderId);
  if (activeOfferTimers.has(key)) {
    clearTimeout(activeOfferTimers.get(key));
    activeOfferTimers.delete(key);
  }
}

async function recordOfferResponse(orderId, driverId, response) {
  await DriverOfferHistory.findOneAndUpdate(
    { orderId, driverId, response: "PENDING" },
    { response, respondedAt: new Date() },
    { sort: { createdAt: -1 } }
  );
}

export async function startAssignmentForOrder(orderId) {
  return assignNextDriver(orderId);
}

export async function assignNextDriver(orderId) {
  try {
    const order = await StoreOrder.findById(orderId);
    if (!order) return { success: false, message: "Order not found" };

    if (!["packed", "offered"].includes(order.status)) {
      return {
        success: false,
        message: `Order is in state '${order.status}', cannot assign.`,
      };
    }

    const darkStore = await DeliveryManager.findById(order.managerId);
    if (!darkStore) return { success: false, message: "Dark store not found" };

    clearOfferTimer(order._id);

    const excludedIds = [
      ...(order.excludedDriverIds || order.roundRobinRidersAttempted || []),
    ].map(String);

    const eligible = await findEligibleDrivers(darkStore, excludedIds);

    if (!eligible.length) {
      order.status = "packed";
      order.assignmentStatus = "WAITING_FOR_DRIVER";
      order.currentOfferDriverId = null;
      order.offeredRiderId = null;
      order.offerStartedAt = null;
      order.offerExpiresAt = null;
      await order.save();
      waitingOrderIds.add(String(order._id));

      try {
        getIO()
          .to(`store_${darkStore._id}`)
          .emit("search_driver", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            assignmentStatus: "WAITING_FOR_DRIVER",
            message: "Waiting for nearby Delivery Partner...",
          });
        getIO()
          .to(`store_${darkStore._id}`)
          .emit("dispatch_no_riders_available", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            message: "Waiting for nearby Delivery Partner...",
          });
      } catch (err) {
        console.warn("[assignment] socket emit failed:", err.message);
      }

      return {
        success: false,
        noRiders: true,
        message: "Waiting for nearby Delivery Partner...",
      };
    }

    waitingOrderIds.delete(String(order._id));
    const { driver: selectedDriver, distanceM } = eligible[0];
    const offerDurationMs = OFFER_TIMEOUT_SECONDS * 1000;
    const startedAt = new Date();
    const expiresAt = new Date(Date.now() + offerDurationMs);

    order.status = "offered";
    order.assignmentStatus = "OFFER_SENT";
    order.currentOfferDriverId = selectedDriver._id;
    order.offeredRiderId = selectedDriver._id;
    order.offerStartedAt = startedAt;
    order.offerExpiresAt = expiresAt;
    if (!order.excludedDriverIds) order.excludedDriverIds = [];
    if (!order.roundRobinRidersAttempted) order.roundRobinRidersAttempted = [];
    if (!order.excludedDriverIds.some((id) => String(id) === String(selectedDriver._id))) {
      order.excludedDriverIds.push(selectedDriver._id);
    }
    if (!order.roundRobinRidersAttempted.some((id) => String(id) === String(selectedDriver._id))) {
      order.roundRobinRidersAttempted.push(selectedDriver._id);
    }
    await order.save();

    await DriverOfferHistory.create({
      orderId: order._id,
      darkStoreId: darkStore._id,
      driverId: selectedDriver._id,
      offeredAt: startedAt,
      response: "PENDING",
      distanceMeters: distanceM,
    });

    const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const estimatedEarnings = Math.round(orderTotal * 0.12 + 45);

    const offerPayload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      darkStoreId: darkStoreIdOf(order),
      darkStoreName: darkStore.storeName || `${darkStore.area} Dark Store`,
      darkStoreAddress: darkStore.storeAddress || `${darkStore.area}, ${darkStore.city}`,
      darkStoreLat: darkStore.latitude,
      darkStoreLng: darkStore.longitude,
      itemCount: order.items.length,
      itemsSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
      estimatedEarnings,
      distanceMeters: Math.round(distanceM),
      distanceKm: formatDistance(distanceM),
      offerStartedAt: startedAt.toISOString(),
      offerExpiresAt: expiresAt.toISOString(),
      timeoutSeconds: OFFER_TIMEOUT_SECONDS,
      remainingSeconds: OFFER_TIMEOUT_SECONDS,
    };

    try {
      getIO()
        .to(`rider_${selectedDriver._id}`)
        .emit("driver_order_offer", offerPayload);
      getIO()
        .to(`rider_${selectedDriver._id}`)
        .emit("order_offer_received", offerPayload);

      getIO()
        .to(`store_${darkStore._id}`)
        .emit("order_status_updated", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: "offered",
          assignmentStatus: "OFFER_SENT",
          offeredRider: {
            id: selectedDriver._id.toString(),
            name: selectedDriver.name || selectedDriver.phone,
            phone: selectedDriver.phone,
            distanceMeters: Math.round(distanceM),
          },
          offerExpiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
      console.warn("[assignment] socket emit failed:", err.message);
    }

    const timerId = setTimeout(async () => {
      activeOfferTimers.delete(String(order._id));
      try {
        const fresh = await StoreOrder.findById(order._id);
        if (
          fresh &&
          fresh.status === "offered" &&
          String(fresh.currentOfferDriverId) === String(selectedDriver._id)
        ) {
          await recordOfferResponse(fresh._id, selectedDriver._id, "TIMEOUT");
          fresh.currentOfferDriverId = null;
          fresh.offeredRiderId = null;
          fresh.offerStartedAt = null;
          fresh.offerExpiresAt = null;
          fresh.assignmentStatus = "SEARCHING_FOR_DRIVER";
          await fresh.save();

          try {
            getIO()
              .to(`rider_${selectedDriver._id}`)
              .emit("driver_offer_timeout", {
                orderId: fresh._id.toString(),
                message: "Offer expired.",
              });
            getIO()
              .to(`rider_${selectedDriver._id}`)
              .emit("order_offer_expired", {
                orderId: fresh._id.toString(),
                message: "Offer expired.",
              });
          } catch (e) {}

          await assignNextDriver(fresh._id);
        }
      } catch (err) {
        console.error("[assignment] timeout handler error:", err);
      }
    }, offerDurationMs + 300);

    activeOfferTimers.set(String(order._id), timerId);

    return {
      success: true,
      order: order.toSafeJSON(),
      offeredRider: {
        id: selectedDriver._id.toString(),
        name: selectedDriver.name,
        distanceMeters: Math.round(distanceM),
      },
    };
  } catch (error) {
    console.error("[assignment] assignNextDriver error:", error);
    return { success: false, error: error.message };
  }
}

export async function acceptDriverOffer(orderId, driverId) {
  const now = new Date();
  clearOfferTimer(orderId);

  const order = await StoreOrder.findOneAndUpdate(
    {
      _id: orderId,
      status: "offered",
      currentOfferDriverId: driverId,
      offerExpiresAt: { $gt: now },
    },
    {
      $set: {
        status: "assigned",
        assignmentStatus: "DRIVER_ASSIGNED",
        assignedRiderId: driverId,
        assignedAt: now,
        currentOfferDriverId: null,
        offeredRiderId: null,
        offerStartedAt: null,
        offerExpiresAt: null,
        pickupVerified: false,
        customerAddressUnlocked: false,
      },
    },
    { new: true }
  );

  if (!order) {
    return { success: false, message: "Offer expired or already taken" };
  }

  const driver = await DeliveryBoy.findOneAndUpdate(
    {
      _id: driverId,
      status: "online",
      activeOrderId: null,
      managerId: order.managerId,
    },
    {
      $set: {
        status: "on_delivery",
        activeOrderId: order._id,
        lastOrderAssignedAt: now,
        lastAssignedAt: now,
        lastStatusAt: now,
        roundRobinPosition: Date.now(),
      },
    },
    { new: true }
  );

  if (!driver) {
    order.status = "offered";
    order.assignmentStatus = "OFFER_SENT";
    order.currentOfferDriverId = driverId;
    await order.save();
    return { success: false, message: "Driver no longer available" };
  }

  await recordOfferResponse(order._id, driverId, "ACCEPTED");
  waitingOrderIds.delete(String(order._id));

  const darkStore = await DeliveryManager.findById(order.managerId);

  try {
    getIO()
      .to(`store_${order.managerId}`)
      .emit("driver_assigned", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "assigned",
        assignmentStatus: "DRIVER_ASSIGNED",
        assignedRider: {
          id: driver._id.toString(),
          name: driver.name || driver.phone,
          phone: driver.phone,
        },
      });
    getIO()
      .to(`store_${order.managerId}`)
      .emit("order_status_updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "assigned",
        assignmentStatus: "DRIVER_ASSIGNED",
        assignedRider: {
          id: driver._id.toString(),
          name: driver.name || driver.phone,
          phone: driver.phone,
        },
        assignedAt: order.assignedAt,
      });
  } catch (err) {
    console.warn("[assignment] socket emit failed:", err.message);
  }

  return { success: true, order, driver, darkStore };
}

export async function declineDriverOffer(orderId, driverId) {
  const order = await StoreOrder.findOne({
    _id: orderId,
    status: "offered",
    currentOfferDriverId: driverId,
  });

  if (!order) return { success: true, rotated: false };

  clearOfferTimer(orderId);
  await recordOfferResponse(order._id, driverId, "DECLINED");

  order.currentOfferDriverId = null;
  order.offeredRiderId = null;
  order.offerStartedAt = null;
  order.offerExpiresAt = null;
  order.assignmentStatus = "SEARCHING_FOR_DRIVER";
  await order.save();

  setImmediate(() => assignNextDriver(order._id));
  return { success: true, rotated: true };
}

export async function retryWaitingAssignmentsForStore(darkStoreId) {
  const storeId = String(darkStoreId);
  const waitingOrders = await StoreOrder.find({
    managerId: darkStoreId,
    status: { $in: ["packed", "offered"] },
    assignmentStatus: { $in: ["WAITING_FOR_DRIVER", "SEARCHING_FOR_DRIVER", null] },
  }).limit(20);

  for (const order of waitingOrders) {
    if (order.status === "offered" && order.offerExpiresAt > new Date()) continue;
    await assignNextDriver(order._id);
  }

  for (const orderId of waitingOrderIds) {
    const order = await StoreOrder.findById(orderId);
    if (order && String(order.managerId) === storeId) {
      await assignNextDriver(order._id);
    }
  }
}

/** @deprecated use assignNextDriver */
export const dispatchNextRider = assignNextDriver;
