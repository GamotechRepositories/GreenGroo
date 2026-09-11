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
import { estimateOfferEarning } from "./ShiftEarningService.js";

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
  const deliveryKm = Number(darkStore?.deliveryRadiusKm);
  const fromGeofence = Number.isFinite(geofence) && geofence > 0 ? geofence : 500;
  const fromDelivery =
    Number.isFinite(deliveryKm) && deliveryKm > 0 ? deliveryKm * 1000 : 5000;
  // Keep assign radius >= go-online same-area allowance so "online" drivers can get offers
  return Math.max(fromGeofence, fromDelivery, MAX_ASSIGNMENT_DISTANCE_M, 15000);
}

export async function findEligibleDrivers(darkStore, excludedIds = []) {
  const storeLat = darkStore.latitude;
  const storeLng = darkStore.longitude;
  const storeId = darkStore._id;
  const maxDistanceM = assignmentMaxDistanceM(darkStore);

  if (storeLat == null || storeLng == null) {
    console.warn(
      `[assignment] store ${storeId} missing latitude/longitude — no drivers can be matched`
    );
  }

  const drivers = await DeliveryBoy.find({
    isActive: true,
    status: "online",
    activeOrderId: null,
    _id: { $nin: excludedIds },
    $and: [
      {
        $or: [
          { managerId: storeId },
          {
            managerId: { $in: [null, undefined] },
            $or: [
              { cityId: darkStore.cityId, area: darkStore.area },
              { city: darkStore.city, area: darkStore.area },
            ],
          },
        ],
      },
      {
        $or: [
          { verificationStatus: "approved" },
          { verificationStatus: { $exists: false } },
        ],
      },
    ],
  });

  const now = Date.now();
  const eligible = [];

  for (const driver of drivers) {
    const loc = driver.currentLocation;
    if (loc?.lat == null || loc?.lng == null) {
      console.warn(`[assignment] skip ${driver._id}: missing currentLocation`);
      continue;
    }

    const locUpdatedAt = loc.updatedAt || driver.lastStatusAt || driver.lastOnlineAt;
    if (!locUpdatedAt || now - new Date(locUpdatedAt).getTime() > LOCATION_FRESHNESS_MS) {
      console.warn(`[assignment] skip ${driver._id}: stale/missing location timestamp`);
      continue;
    }

    const distanceM = metersBetween(storeLat, storeLng, loc.lat, loc.lng);
    if (distanceM == null) {
      console.warn(`[assignment] skip ${driver._id}: cannot compute distance (store coords?)`);
      continue;
    }
    if (distanceM < MIN_ASSIGNMENT_DISTANCE_M || distanceM > maxDistanceM) {
      console.warn(
        `[assignment] skip ${driver._id}: ${Math.round(distanceM)}m outside [${MIN_ASSIGNMENT_DISTANCE_M}, ${maxDistanceM}]m`
      );
      continue;
    }

    eligible.push({ driver, distanceM });
  }

  eligible.sort((a, b) => {
    // 1) Nearest to dark store first
    const distDiff = a.distanceM - b.distanceM;
    if (Math.abs(distDiff) > 25) return distDiff;
    // 2) Longest waiting (online / idle longest) next
    const waitA = new Date(waitingSince(a.driver)).getTime();
    const waitB = new Date(waitingSince(b.driver)).getTime();
    if (waitA !== waitB) return waitA - waitB;
    // 3) Round-robin tie-break
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

export async function assignNextDriver(orderId, opts = {}) {
  try {
    const timedOutDriverId = opts.timedOutDriverId
      ? String(opts.timedOutDriverId)
      : null;

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

    const declinedIds = (order.declinedDriverIds || []).map(String);
    const softExcluded = [
      ...(order.excludedDriverIds || order.roundRobinRidersAttempted || []),
    ].map(String);
    // Hard exclude: anyone who declined this order (never re-offer to them)
    const excludedIds = [...new Set([...declinedIds, ...softExcluded])];

    let eligible = await findEligibleDrivers(darkStore, excludedIds);

    // Soft cycle (timeouts only) — clear soft exclusions so next round-robin pass can run
    if (!eligible.length && softExcluded.length) {
      console.warn(
        `[assignment] order ${order.orderNumber || order._id}: cycling soft exclusions (kept ${declinedIds.length} decliners)`
      );
      order.excludedDriverIds = [];
      order.roundRobinRidersAttempted = [];
      await order.save();
      eligible = await findEligibleDrivers(darkStore, declinedIds);
    }

    // Timeout + no other online driver → re-show Accept/Decline on the previous driver
    if (
      !eligible.length &&
      timedOutDriverId &&
      !declinedIds.includes(timedOutDriverId)
    ) {
      const prev = await DeliveryBoy.findById(timedOutDriverId);
      if (
        prev &&
        prev.isActive &&
        prev.status === "online" &&
        !prev.activeOrderId
      ) {
        console.warn(
          `[assignment] order ${order.orderNumber || order._id}: no other drivers — re-offering to previous ${timedOutDriverId}`
        );
        order.excludedDriverIds = (order.excludedDriverIds || []).filter(
          (id) => String(id) !== timedOutDriverId
        );
        order.roundRobinRidersAttempted = (
          order.roundRobinRidersAttempted || []
        ).filter((id) => String(id) !== timedOutDriverId);
        await order.save();

        const distanceM =
          metersBetween(
            darkStore.latitude,
            darkStore.longitude,
            prev.currentLocation?.lat,
            prev.currentLocation?.lng
          ) ?? 0;

        return sendOfferToDriver(order, prev, darkStore, distanceM);
      }
    }

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

    // Bind store hub if driver was online via area match without managerId
    if (!selectedDriver.managerId || String(selectedDriver.managerId) !== String(darkStore._id)) {
      selectedDriver.managerId = darkStore._id;
      await selectedDriver.save().catch(() => {});
    }

    return sendOfferToDriver(order, selectedDriver, darkStore, distanceM);
  } catch (error) {
    console.error("[assignment] assignNextDriver error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Accept/Decline offer to a specific online driver (never force-assign).
 */
export async function offerToSpecificDriver(orderId, driverId) {
  try {
    const order = await StoreOrder.findById(orderId);
    if (!order) return { success: false, message: "Order not found" };

    if (
      ["assigned", "pickup_verified", "out_for_delivery", "delivered", "delivery_failed", "cancelled"].includes(
        order.status
      )
    ) {
      return {
        success: false,
        message: `Order already ${order.status} — cannot send offer`,
      };
    }

    const driver = await DeliveryBoy.findById(driverId);
    if (!driver || !driver.isActive) {
      return { success: false, message: "Driver not found" };
    }
    if (driver.status !== "online") {
      return { success: false, message: "Driver must be online to receive an offer" };
    }
    if (driver.activeOrderId) {
      return { success: false, message: "Driver already has an active delivery" };
    }

    const darkStore = await DeliveryManager.findById(order.managerId || order.darkStoreId);
    if (!darkStore) return { success: false, message: "Dark store not found" };

    if (!driver.managerId || String(driver.managerId) !== String(darkStore._id)) {
      driver.managerId = darkStore._id;
      await driver.save().catch(() => {});
    }

    clearOfferTimer(order._id);

    const distanceM =
      metersBetween(
        darkStore.latitude,
        darkStore.longitude,
        driver.currentLocation?.lat ?? driver.latitude,
        driver.currentLocation?.lng ?? driver.longitude
      ) ?? 0;

    return sendOfferToDriver(order, driver, darkStore, distanceM);
  } catch (error) {
    console.error("[assignment] offerToSpecificDriver error:", error);
    return { success: false, message: error.message };
  }
}

async function sendOfferToDriver(order, selectedDriver, darkStore, distanceM) {
  try {
    const offerDurationMs = OFFER_TIMEOUT_SECONDS * 1000;
    const startedAt = new Date();
    const expiresAt = new Date(Date.now() + offerDurationMs);

    order.status = "offered";
    order.assignmentStatus = "OFFER_SENT";
    order.currentOfferDriverId = selectedDriver._id;
    order.offeredRiderId = selectedDriver._id;
    order.offerStartedAt = startedAt;
    order.offerExpiresAt = expiresAt;
    order.assignedRiderId = null;
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
    let estimatedEarnings = 0;
    try {
      const shiftId =
        order.shiftId ||
        selectedDriver.currentBooking?.shiftId ||
        null;
      const estimate = await estimateOfferEarning({
        shiftId,
        managerId: order.managerId || darkStore?._id,
        riderId: selectedDriver._id,
        storeLat: darkStore.latitude,
        storeLng: darkStore.longitude,
        customerLat: order.customerLat,
        customerLng: order.customerLng,
      });
      estimatedEarnings = Math.round(estimate.earnUpTo || estimate.estimatedEarnings || 0);
    } catch (_) {
      estimatedEarnings = 0;
    }
    if (estimatedEarnings <= 0) {
      estimatedEarnings = Math.round(orderTotal * 0.12 + 45);
    }

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
      earnUpTo: estimatedEarnings,
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

    try {
      const { notifyOrderReceived } = await import("./RiderNotificationService.js");
      await notifyOrderReceived(selectedDriver._id, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        estimatedEarnings,
      });
    } catch (err) {
      console.warn("[assignment] rider notification failed:", err.message);
    }

    clearOfferTimer(order._id);
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
              });
            getIO()
              .to(`rider_${selectedDriver._id}`)
              .emit("order_offer_expired", {
                orderId: fresh._id.toString(),
              });
          } catch (_) {}
          setImmediate(() =>
            assignNextDriver(fresh._id, { timedOutDriverId: selectedDriver._id })
          );
        }
      } catch (err) {
        console.warn("[assignment] offer timeout handler failed:", err.message);
      }
    }, offerDurationMs);
    activeOfferTimers.set(String(order._id), timerId);

    return {
      success: true,
      offered: true,
      offeredRider: {
        id: selectedDriver._id.toString(),
        name: selectedDriver.name,
        distanceMeters: Math.round(distanceM),
      },
      timeoutSeconds: OFFER_TIMEOUT_SECONDS,
    };
  } catch (error) {
    console.error("[assignment] sendOfferToDriver error:", error);
    return { success: false, error: error.message };
  }
}

export async function acceptDriverOffer(orderId, driverId) {
  const now = new Date();
  clearOfferTimer(orderId);

  // Resolve the rider's active shift booking (used for delivery earning calculation)
  const acceptingDriver = await DeliveryBoy.findById(driverId).select("currentBooking");
  const riderShiftId = acceptingDriver?.currentBooking?.shiftId || null;

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
        // Store rider's active shift so earning slabs can be resolved on delivery
        ...(riderShiftId ? { shiftId: riderShiftId } : {}),
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

  // 5-min same-route window starts AFTER accept, before pickup QR scan
  let sameRoute = null;
  try {
    const { openSameRouteWindowAfterAccept } = await import(
      "./sameRouteAttachService.js"
    );
    sameRoute = await openSameRouteWindowAfterAccept(order, darkStore);
    if (sameRoute?.routeBatchWindowEndsAt) {
      order.routeBatchWindowEndsAt = sameRoute.routeBatchWindowEndsAt;
    }
    if (typeof sameRoute?.pickupQrUnlocked === "boolean") {
      order.pickupQrUnlocked = sameRoute.pickupQrUnlocked;
    }
    if (sameRoute?.attached?.length) {
      order.pickupQrUnlocked = true;
      order.routeBatchWindowEndsAt = null;
    }
  } catch (err) {
    console.warn("[assignment] same-route window failed:", err.message);
  }

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
        assignedRiderId: driver._id.toString(),
        routeBatchWindowEndsAt: order.routeBatchWindowEndsAt,
        pickupQrUnlocked: Boolean(order.pickupQrUnlocked),
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
        assignedRiderId: driver._id.toString(),
        assignedAt: order.assignedAt,
        routeBatchWindowEndsAt: order.routeBatchWindowEndsAt,
        pickupQrUnlocked: Boolean(order.pickupQrUnlocked),
      });
  } catch (err) {
    console.warn("[assignment] socket emit failed:", err.message);
  }

  return { success: true, order, driver, darkStore, sameRoute };
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

  if (!order.declinedDriverIds) order.declinedDriverIds = [];
  if (!order.declinedDriverIds.some((id) => String(id) === String(driverId))) {
    order.declinedDriverIds.push(driverId);
  }
  if (!order.excludedDriverIds) order.excludedDriverIds = [];
  if (!order.excludedDriverIds.some((id) => String(id) === String(driverId))) {
    order.excludedDriverIds.push(driverId);
  }

  order.currentOfferDriverId = null;
  order.offeredRiderId = null;
  order.offerStartedAt = null;
  order.offerExpiresAt = null;
  order.assignmentStatus = "SEARCHING_FOR_DRIVER";
  await order.save();

  try {
    getIO()
      .to(`store_${order.managerId}`)
      .emit("order_status_updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        assignmentStatus: "SEARCHING_FOR_DRIVER",
        message: "Driver declined — offering next partner",
      });
  } catch (_) {}

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
