import { haversineKm } from "./darkStoreResolver.js";

const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";
const REQUEST_TIMEOUT_MS = 5000;
/** Reuse a route while the rider is still near the origin it was computed from. */
const CACHE_TTL_MS = 30_000;
const REUSE_RADIUS_KM = 0.075;
const MAX_CACHE_ENTRIES = 500;
/** Used when Google is not configured or fails: straight line × road factor at city speed. */
const FALLBACK_ROAD_FACTOR = 1.3;
const FALLBACK_SPEED_KMPH = 22;

const cache = new Map();

export function toPoint(value) {
  if (!value) return null;
  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.longitude);
  if (value.lat == null && value.latitude == null) return null;
  if (value.lng == null && value.longitude == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

export function formatEta(seconds) {
  const minutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** Google encoded-polyline format, so the app decodes Google and fallback routes the same way. */
export function encodePolyline(points = []) {
  let lastLat = 0;
  let lastLng = 0;
  let out = "";
  const encodeValue = (value) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let chunk = "";
    while (v >= 0x20) {
      chunk += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return chunk + String.fromCharCode(v + 63);
  };
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    out += encodeValue(lat - lastLat) + encodeValue(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}

function estimateRoute(origin, destination) {
  const km = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * FALLBACK_ROAD_FACTOR;
  const seconds = Math.max(60, Math.round((km / FALLBACK_SPEED_KMPH) * 3600));
  return {
    polyline: encodePolyline([origin, destination]),
    distanceMeters: Math.round(km * 1000),
    etaSeconds: seconds,
    etaText: formatEta(seconds),
    source: "estimate",
  };
}

async function fetchGoogleRoute(origin, destination, apiKey) {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
    departure_time: "now",
    key: apiKey,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${DIRECTIONS_URL}?${params}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.length) {
      throw new Error(`${data.status || "NO_ROUTE"} ${data.error_message || ""}`.trim());
    }
    const route = data.routes[0];
    const leg = route.legs?.[0] || {};
    const seconds = Number(leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0);
    return {
      polyline: route.overview_polyline?.points || encodePolyline([origin, destination]),
      distanceMeters: Number(leg.distance?.value || 0),
      etaSeconds: seconds,
      etaText: formatEta(seconds),
      source: "google",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Route polyline + ETA from origin to destination. Google Directions when
 * GOOGLE_MAPS_API_KEY is set, otherwise (or on failure) a distance-based estimate.
 * Cached per `cacheKey` for 30 s as long as the origin moved less than 75 m.
 */
export async function getRouteAndEta({ cacheKey = "", origin, destination }) {
  const from = toPoint(origin);
  const to = toPoint(destination);
  if (!from || !to) return null;

  const cached = cacheKey ? cache.get(cacheKey) : null;
  if (
    cached &&
    Date.now() - cached.at < CACHE_TTL_MS &&
    haversineKm(cached.origin.lat, cached.origin.lng, from.lat, from.lng) < REUSE_RADIUS_KM &&
    cached.destination.lat === to.lat &&
    cached.destination.lng === to.lng
  ) {
    return cached.result;
  }

  let result = null;
  const apiKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim();
  if (apiKey) {
    try {
      result = await fetchGoogleRoute(from, to, apiKey);
    } catch (err) {
      console.warn("[directions] Google Directions failed, using estimate:", err.message);
    }
  }
  if (!result) result = estimateRoute(from, to);

  if (cacheKey) {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, { at: Date.now(), origin: from, destination: to, result });
  }
  return result;
}

export function clearRouteCache(cacheKey) {
  if (cacheKey) cache.delete(cacheKey);
}
