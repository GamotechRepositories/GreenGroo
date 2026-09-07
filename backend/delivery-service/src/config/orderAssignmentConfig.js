/** Assignment radius from dark store to driver (meters). */
export const MIN_ASSIGNMENT_DISTANCE_M = Number(
  process.env.MIN_ASSIGNMENT_DISTANCE_M || 0
);
/** Default 15 km — must stay aligned with go-online same-area radius so online drivers can receive offers. */
export const MAX_ASSIGNMENT_DISTANCE_M = Number(
  process.env.MAX_ASSIGNMENT_DISTANCE_M || 15000
);

/** Driver must respond within this window (seconds). Backend is source of truth. */
export const OFFER_TIMEOUT_SECONDS = Number(process.env.OFFER_TIMEOUT_SECONDS || 20);

/** Reject stale GPS older than this (ms). */
export const LOCATION_FRESHNESS_MS = Number(
  process.env.LOCATION_FRESHNESS_MS || 10 * 60 * 1000
);

/** Pickup verification token TTL (ms). */
export const PICKUP_TOKEN_TTL_MS = Number(
  process.env.PICKUP_TOKEN_TTL_MS || 4 * 60 * 60 * 1000
);
