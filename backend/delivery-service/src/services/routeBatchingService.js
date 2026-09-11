/**
 * Same-route batching helpers for dark-store orders.
 * Configurable thresholds — do not hardcode in callers.
 */
export const BATCHING_WAIT_MS = Number(
  process.env.ROUTE_BATCHING_WAIT_MS || 5 * 60 * 1000
);
/** Max km between two customer pins to call them "same route". */
export const SAME_ROUTE_DISTANCE_KM = Number(
  process.env.SAME_ROUTE_DISTANCE_THRESHOLD_KM || 2.5
);
/** Max extra km of detour vs going to the farther stop alone. */
export const MAX_DETOUR_KM = Number(process.env.MAX_DETOUR_DISTANCE_KM || 1.5);

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function readPin(order) {
  const lat = Number(order?.customerLat);
  const lng = Number(order?.customerLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Compatible if destinations are close OR B lies near the store→A corridor
 * (before/after A on roughly the same bearing).
 */
export function evaluateRouteCompatibility(orderA, orderB, store = {}) {
  const a = readPin(orderA);
  const b = readPin(orderB);
  if (!a || !b) {
    // Fallback: soft area match when GPS missing
    const areaA = String(orderA?.area || "").trim().toLowerCase();
    const areaB = String(orderB?.area || "").trim().toLowerCase();
    if (areaA && areaB && (areaA === areaB || areaA.includes(areaB) || areaB.includes(areaA))) {
      return {
        compatible: true,
        score: 0.55,
        reason: "area_match",
        distanceBetweenKm: null,
        suggestedSequence: ["A", "B"],
      };
    }
    return { compatible: false, score: 0, reason: "missing_coords" };
  }

  const betweenKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
  const storeLat = Number(store.latitude ?? store.lat);
  const storeLng = Number(store.longitude ?? store.lng);
  const hasStore = Number.isFinite(storeLat) && Number.isFinite(storeLng);

  let storeToA = null;
  let storeToB = null;
  let detourKm = null;
  let suggestedSequence = ["A", "B"];

  if (hasStore) {
    storeToA = haversineKm(storeLat, storeLng, a.lat, a.lng);
    storeToB = haversineKm(storeLat, storeLng, b.lat, b.lng);
    // Path store→near→far vs separate trips
    const nearFirst = storeToA <= storeToB;
    const near = nearFirst ? a : b;
    const far = nearFirst ? b : a;
    const leg1 = nearFirst ? storeToA : storeToB;
    const leg2 = haversineKm(near.lat, near.lng, far.lat, far.lng);
    const combined = leg1 + leg2;
    const separate = storeToA + storeToB;
    detourKm = Math.max(0, combined - Math.max(storeToA, storeToB));
    suggestedSequence = nearFirst ? ["A", "B"] : ["B", "A"];

    // Opposite direction: both far from each other and combined much worse
    if (betweenKm > SAME_ROUTE_DISTANCE_KM * 2 && combined > separate * 0.95) {
      return {
        compatible: false,
        score: 0.1,
        reason: "opposite_or_far",
        distanceBetweenKm: Math.round(betweenKm * 100) / 100,
        storeToAKm: Math.round(storeToA * 100) / 100,
        storeToBKm: Math.round(storeToB * 100) / 100,
        detourKm: Math.round(detourKm * 100) / 100,
        suggestedSequence,
      };
    }
  }

  const closeEnough = betweenKm <= SAME_ROUTE_DISTANCE_KM;
  const lowDetour = detourKm != null && detourKm <= MAX_DETOUR_KM;
  const compatible = closeEnough || lowDetour;

  let score = 0;
  if (closeEnough) score += 0.6;
  if (lowDetour) score += 0.3;
  if (betweenKm <= SAME_ROUTE_DISTANCE_KM / 2) score += 0.1;

  return {
    compatible,
    score: Math.min(1, Math.round(score * 100) / 100),
    reason: compatible
      ? closeEnough
        ? "nearby_destinations"
        : "low_detour_corridor"
      : "not_compatible",
    distanceBetweenKm: Math.round(betweenKm * 100) / 100,
    storeToAKm: storeToA != null ? Math.round(storeToA * 100) / 100 : null,
    storeToBKm: storeToB != null ? Math.round(storeToB * 100) / 100 : null,
    detourKm: detourKm != null ? Math.round(detourKm * 100) / 100 : null,
    suggestedSequence,
  };
}

export function makeBatchId(primaryOrderId) {
  return `batch_${String(primaryOrderId)}_${Date.now()}`;
}

/**
 * Find orders still inside the 5-minute same-route window (packed / offered / assigned).
 */
export async function findBatchWaitingOrders(StoreOrder, managerId, { excludeId } = {}) {
  const now = new Date();
  const q = {
    managerId,
    status: { $in: ["packed", "offered", "assigned"] },
    routeBatchWindowEndsAt: { $gt: now },
    pickupQrScanned: { $ne: true },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return StoreOrder.find(q).sort({ assignedAt: -1, packedAt: 1 });
}

/**
 * Anchors for same-route pairing: anything still in the open batch window,
 * plus recently assigned trips.
 */
export async function findAssignableRouteAnchors(StoreOrder, managerId, { excludeId } = {}) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - BATCHING_WAIT_MS);
  const inWindow = await findBatchWaitingOrders(StoreOrder, managerId, { excludeId });
  // Prefer accepted trips still waiting for companion (before QR)
  const active = await StoreOrder.find({
    managerId,
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    status: { $in: ["packed", "offered", "assigned"] },
    $or: [
      { routeBatchWindowEndsAt: { $gt: now }, pickupQrScanned: { $ne: true } },
      {
        status: "assigned",
        assignedAt: { $gte: windowStart },
        assignedRiderId: { $ne: null },
        pickupQrScanned: { $ne: true },
      },
      { packedAt: { $gte: windowStart }, status: { $in: ["packed", "offered"] } },
    ],
  }).sort({ assignedAt: -1, packedAt: -1 });

  const byId = new Map();
  for (const o of [...inWindow, ...active]) {
    byId.set(String(o._id), o);
  }
  // Assigned + open window first so auto-attach prefers them
  return [...byId.values()].sort((a, b) => {
    const score = (o) => {
      let s = 0;
      if (o.status === "assigned" && o.assignedRiderId) s += 3;
      if (o.routeBatchWindowEndsAt && new Date(o.routeBatchWindowEndsAt) > now) s += 2;
      if (!(o.pickupQrScanned || o.qrScannedAt)) s += 1;
      return s;
    };
    return score(b) - score(a);
  });
}

export function buildSuggestionPayload(orderA, orderB, store, compat) {
  const seq = compat.suggestedSequence || ["A", "B"];
  return {
    compatible: true,
    score: compat.score,
    reason: compat.reason,
    distanceBetweenKm: compat.distanceBetweenKm,
    storeToAKm: compat.storeToAKm,
    storeToBKm: compat.storeToBKm,
    detourKm: compat.detourKm,
    suggestedSequence: seq,
    recommendedRiderId: orderA.assignedRiderId
      ? String(orderA.assignedRiderId)
      : orderB.assignedRiderId
        ? String(orderB.assignedRiderId)
        : null,
    orderA: {
      id: String(orderA._id),
      orderNumber: orderA.orderNumber,
      customerName: orderA.customerName,
      customerAddress: orderA.customerAddress,
      customerLat: orderA.customerLat,
      customerLng: orderA.customerLng,
      distanceKm: orderA.distanceKm ?? compat.storeToAKm,
      status: orderA.status,
      assignmentStatus: orderA.assignmentStatus,
      assignedRiderId: orderA.assignedRiderId ? String(orderA.assignedRiderId) : null,
      routeBatchWindowEndsAt: orderA.routeBatchWindowEndsAt,
    },
    orderB: {
      id: String(orderB._id),
      orderNumber: orderB.orderNumber,
      customerName: orderB.customerName,
      customerAddress: orderB.customerAddress,
      customerLat: orderB.customerLat,
      customerLng: orderB.customerLng,
      distanceKm: orderB.distanceKm ?? compat.storeToBKm,
      status: orderB.status,
      assignmentStatus: orderB.assignmentStatus,
      assignedRiderId: orderB.assignedRiderId ? String(orderB.assignedRiderId) : null,
      routeBatchWindowEndsAt: orderB.routeBatchWindowEndsAt,
    },
  };
}
