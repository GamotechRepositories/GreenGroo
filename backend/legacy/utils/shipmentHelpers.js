export function getDefaultManualTracking() {
  return {
    enabled: false,
    note: "",
    evidenceUrl: "",
    evidenceName: "",
    updatedAt: null,
  };
}

export function resolveManualTracking(existing) {
  if (!existing || typeof existing !== "object") {
    return getDefaultManualTracking();
  }

  const plain =
    typeof existing.toObject === "function" ? existing.toObject() : existing;

  return {
    enabled: Boolean(plain.enabled),
    note: String(plain.note || "").trim(),
    evidenceUrl: String(plain.evidenceUrl || "").trim(),
    evidenceName: String(plain.evidenceName || "").trim(),
    updatedAt: plain.updatedAt || null,
  };
}

export function getShipmentPlain(shipment) {
  if (!shipment) return {};
  return typeof shipment.toObject === "function" ? shipment.toObject() : { ...shipment };
}

export function mergeOrderShipment(order, updates = {}) {
  const existing = getShipmentPlain(order?.shipment);
  const { manualTracking: manualTrackingUpdate, ...restUpdates } = updates;

  return {
    ...existing,
    ...restUpdates,
    manualTracking: resolveManualTracking(
      manualTrackingUpdate !== undefined
        ? manualTrackingUpdate
        : existing.manualTracking
    ),
  };
}

/** Empty shipment so admin can create a new Envia label. */
export function getClearedShipment() {
  return {
    provider: "",
    carrier: "",
    service: "",
    shipmentId: "",
    trackingNumber: "",
    trackUrl: "",
    labelUrl: "",
    status: "",
    statusMessage: "",
    syncedAt: null,
    events: [],
    note: "",
    evidenceUrl: "",
    evidenceName: "",
    manualTracking: getDefaultManualTracking(),
  };
}

function text(value) {
  return String(value || "").trim();
}

function buildTrackingHaystack({ status = "", statusMessage = "", events = [] } = {}) {
  const eventParts = Array.isArray(events)
    ? events.flatMap((event) => [
        text(event?.status),
        text(event?.description),
        text(event?.location),
      ])
    : [];

  return [text(status), text(statusMessage), ...eventParts]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

/**
 * Map Envia (or linked) shipment tracking text → order.status.
 * Looks at status, statusMessage, and event history so we don't miss
 * carriers that only put the useful signal in the latest event.
 */
export function mapShipmentTrackingToOrderStatus({
  status = "",
  statusMessage = "",
  events = [],
  currentStatus,
} = {}) {
  const current = text(currentStatus) || "confirm";
  if (current === "cancelled") return current;

  const haystack = buildTrackingHaystack({ status, statusMessage, events });
  if (!haystack) return current;

  const isDelivered =
    /\bdelivered\b/.test(haystack) ||
    /delivery successful|successfully delivered|consignee received|package delivered|pod available/.test(
      haystack
    );

  if (isDelivered) return "delivered";

  const isReturned =
    /\brto\b/.test(haystack) ||
    /return to origin|returned to (sender|origin|shipper)|undelivered|delivery failed/.test(
      haystack
    );

  if (isReturned && current !== "delivered") {
    return "return";
  }

  const isShipping =
    /out for delivery|out_for_delivery|in transit|in_transit|\bshipped\b|\bpicked\b|pick ?up|dispatch|manifest|out for pick|left the facility|arrived at|reached (hub|facility)|in warehouse|with courier|ofd\b/.test(
      haystack
    );

  if (isShipping) {
    if (current === "delivered") return "delivered";
    if (["confirm", "processing", "shipping", "shipped"].includes(current)) {
      return "shipping";
    }
  }

  return current;
}

export function isOutForDeliveryTracking({
  status = "",
  statusMessage = "",
  events = [],
} = {}) {
  const haystack = buildTrackingHaystack({ status, statusMessage, events });
  return /out for delivery|out_for_delivery|\bofd\b/.test(haystack);
}
