import mongoose from "mongoose";
import StoreOrder, { deliveryDelayJSON } from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import Product from "../../../legacy/models/Product.js";
import { getManager } from "./managerDashboardController.js";
import { formatEta, getRouteAndEta, toPoint } from "../services/directionsService.js";
import {
  LIVE_TRACKING_STATUSES,
  ROUTE_REFRESH_SECONDS,
  getLatestLocation,
  isStoreOrderTrackable,
  recordDispatchEta,
  storeOrderDestination,
} from "../services/orderTrackingService.js";

const TO_STORE_STATUSES = ["offered", "assigned"];
const CLOSED = ["delivered", "cancelled", "delivery_failed"];

const minutesBetween = (from, to) => {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 60000)) : null;
};

const outForDeliveryAt = (order) =>
  order.pickupProofApprovedAt || order.pickupVerifiedAt || null;

async function itemImages(items = []) {
  const skus = [...new Set(items.map((i) => String(i.sku || "").trim()).filter(Boolean))];
  const names = [...new Set(items.map((i) => String(i.name || "").trim()).filter(Boolean))];
  if (!skus.length && !names.length) return { bySku: new Map(), byName: new Map() };

  const products = await Product.find({
    $or: [{ sku: { $in: skus } }, { name: { $in: names } }],
  })
    .select("sku name productImages")
    .lean();

  const bySku = new Map();
  const byName = new Map();
  for (const p of products) {
    const image = p.productImages?.[0] || "";
    if (!image) continue;
    if (p.sku) bySku.set(String(p.sku).trim(), image);
    byName.set(String(p.name || "").trim().toLowerCase(), image);
  }
  return { bySku, byName };
}

function buildTimeline(order) {
  const delay = order.deliveryDelay;
  const steps = [
    { key: "placed", label: "Order placed", at: order.createdAt },
    { key: "packed", label: "Confirmed & packed", at: order.packedAt },
    { key: "assigned", label: "Rider assigned", at: order.assignedAt || order.fullTimeAssignedAt },
    { key: "pickup_scan", label: "Rider reached store (QR scanned)", at: order.pickupQrScannedAt || order.qrScannedAt },
    { key: "out_for_delivery", label: "Picked up · out for delivery", at: outForDeliveryAt(order) },
  ];
  if (delay?.reportedAt && delay.minutes > 0) {
    steps.push({ key: "delay_reported", label: `Rider reported ${delay.minutes} min delay`, at: delay.reportedAt });
  }
  if (delay?.customerNotifiedAt) {
    steps.push({ key: "delay_notified", label: "Customer informed of delay", at: delay.customerNotifiedAt });
  }
  if (order.status === "delivered") {
    steps.push({ key: "delivered", label: "Delivered", at: order.deliveredAt });
  } else if (order.status === "delivery_failed") {
    steps.push({ key: "failed", label: "Delivery failed", at: order.failedAt });
  } else if (order.status === "cancelled") {
    steps.push({ key: "cancelled", label: "Cancelled", at: order.updatedAt });
  }

  const reached = steps
    .filter((s) => s.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return reached.map((step, i) => ({
    ...step,
    minutesFromPrevious: i === 0 ? null : minutesBetween(reached[i - 1].at, step.at),
  }));
}

function buildStats(order, now) {
  const outAt = outForDeliveryAt(order);
  const endAt = order.deliveredAt || order.failedAt || null;
  const liveEnd = endAt || (CLOSED.includes(order.status) ? null : now);
  return {
    packMinutes: minutesBetween(order.createdAt, order.packedAt),
    riderAssignMinutes: minutesBetween(order.packedAt, order.assignedAt),
    riderToStoreMinutes: minutesBetween(order.assignedAt, outAt),
    rideMinutes: minutesBetween(outAt, liveEnd),
    totalMinutes: minutesBetween(order.createdAt, liveEnd),
    distanceKm: Number(order.deliveryDistanceKm) || Number(order.distanceKm) || null,
    completed: Boolean(endAt),
  };
}

/**
 * GET /orders/:orderId/tracking
 * Everything the manager needs for one delivery: items with photos, customer and
 * rider contacts, live rider position + route/ETA, delay vs the promised time and
 * a timed history that stays available after the order is completed.
 */
export const getManagerOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    const manager = await getManager(req);
    const order = await StoreOrder.findOne({ _id: orderId, managerId: manager._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const now = new Date();
    const isPickup = order.fulfillmentType === "pickup";
    const [rider, images, destination] = await Promise.all([
      order.assignedRiderId
        ? DeliveryBoy.findById(order.assignedRiderId)
            .select("name phone vehicleType currentLocation selfie.url rating")
            .lean()
        : null,
      itemImages(order.items),
      isPickup ? null : storeOrderDestination(order),
    ]);

    const store = toPoint({ lat: manager.latitude, lng: manager.longitude });
    const outAt = outForDeliveryAt(order);
    if (!isPickup && outAt && !order.dispatchEta?.expectedAt) {
      await recordDispatchEta(order);
    }

    let phase = "not_started";
    if (CLOSED.includes(order.status)) phase = "done";
    else if (LIVE_TRACKING_STATUSES.includes(order.status) && outAt) phase = "to_customer";
    else if (order.assignedRiderId && (TO_STORE_STATUSES.includes(order.status) || order.status === "pickup_verified")) {
      phase = "to_store";
    }

    const lastLocation =
      phase === "to_customer" || phase === "to_store" ? getLatestLocation(order, rider) : null;

    let eta = null;
    let route = null;
    const target = phase === "to_customer" ? destination : phase === "to_store" ? store : null;
    const origin = lastLocation || (phase === "to_customer" ? store : null);
    if (target && origin) {
      const result = await getRouteAndEta({
        cacheKey: `manager:${phase}:${order._id}`,
        origin,
        destination: target,
      });
      if (result) {
        eta = {
          seconds: result.etaSeconds,
          text: result.etaText || formatEta(result.etaSeconds),
          distanceMeters: result.distanceMeters,
          arrivalAt: new Date(now.getTime() + result.etaSeconds * 1000),
          source: result.source,
          fromStore: !lastLocation,
          target: phase === "to_customer" ? "customer" : "store",
        };
        route = { polyline: result.polyline || "" };
      }
    }

    const expectedAt = order.dispatchEta?.expectedAt || null;
    let delayMinutes = null;
    if (expectedAt) {
      const compareAt =
        order.deliveredAt || (phase === "to_customer" && eta ? eta.arrivalAt : null);
      if (compareAt) {
        delayMinutes = Math.round(
          (new Date(compareAt).getTime() - new Date(expectedAt).getTime()) / 60000
        );
      }
    }

    const items = order.items.map((item) => ({
      id: item._id.toString(),
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      department: item.department || "",
      image:
        images.bySku.get(String(item.sku || "").trim()) ||
        images.byName.get(String(item.name || "").trim().toLowerCase()) ||
        "",
    }));

    res.json({
      success: true,
      tracking: {
        order: { ...order.toSafeJSON(), items },
        phase,
        trackable: isStoreOrderTrackable(order),
        isPickup,
        rider: rider
          ? {
              id: rider._id.toString(),
              name: rider.name || "Delivery partner",
              phone: rider.phone || "",
              vehicleType: rider.vehicleType || "",
              photo: rider.selfie?.url || "",
              rating: rider.rating ?? null,
            }
          : null,
        customer: {
          name: order.customerName || "Customer",
          phone: order.customerPhone || "",
          address: order.customerAddress || "",
        },
        store: store ? { name: manager.storeName || "Dark store", ...store } : null,
        destination,
        lastLocation,
        eta,
        route,
        delay: {
          expectedAt,
          promisedMinutes: order.dispatchEta?.seconds
            ? Math.round(order.dispatchEta.seconds / 60)
            : null,
          minutes: delayMinutes,
          riderReported: deliveryDelayJSON(order.deliveryDelay),
        },
        timeline: buildTimeline(order),
        stats: buildStats(order, now),
        refreshSeconds: ROUTE_REFRESH_SECONDS,
        serverTime: now.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
