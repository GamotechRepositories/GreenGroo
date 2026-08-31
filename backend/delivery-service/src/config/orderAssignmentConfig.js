/** Assignment radius from dark store to driver (meters). */
export const MIN_ASSIGNMENT_DISTANCE_M = Number(
  process.env.MIN_ASSIGNMENT_DISTANCE_M || 0
);
export const MAX_ASSIGNMENT_DISTANCE_M = Number(
  process.env.MAX_ASSIGNMENT_DISTANCE_M || 2000
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
