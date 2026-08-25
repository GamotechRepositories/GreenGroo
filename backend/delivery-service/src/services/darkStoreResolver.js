import DeliveryManager from "../models/DeliveryManager.js";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const norm = (value) => String(value || "").trim().toLowerCase();

const citySlug = (value) =>
  norm(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function addressHaystack(address = {}) {
  return [
    address.area,
    address.landmark,
    address.fullAddress,
    address.shopName,
    address.shopNo,
  ]
    .map(norm)
    .filter(Boolean)
    .join(" ");
}

function matchesCity(manager, city) {
  if (!city) return false;
  const wanted = norm(city);
  const slug = citySlug(city);
  return (
    norm(manager.city) === wanted ||
    (manager.cityId && citySlug(manager.cityId) === slug)
  );
}

function matchesArea(manager, address) {
  const area = norm(manager.area);
  if (!area) return false;
  const explicit = norm(address.area);
  if (explicit && (explicit === area || explicit.includes(area) || area.includes(explicit))) {
    return true;
  }
  const haystack = addressHaystack(address);
  return Boolean(haystack) && haystack.includes(area);
}

/**
 * Pick the dark store that should fulfil this customer address.
 * Never sends an order to another city when a city is known.
 */
export async function resolveDarkStoreForAddress(address = {}) {
  const city = String(address.city || "").trim();
  const lat = toNumber(address.location?.lat ?? address.lat ?? address.customerLat);
  const lng = toNumber(address.location?.lng ?? address.lng ?? address.customerLng);

  const active = await DeliveryManager.find({ isActive: true });
  if (!active.length) {
    return { manager: null, reason: "no_active_stores" };
  }

  let candidates = active;
  let reason = "fallback_any_store";

  if (city) {
    const inCity = active.filter((m) => matchesCity(m, city));
    if (!inCity.length) {
      return { manager: null, reason: "no_store_in_city", city };
    }
    candidates = inCity;
    reason = "city";
  }

  const inArea = candidates.filter((m) => matchesArea(m, address));
  if (inArea.length) {
    candidates = inArea;
    reason = city ? "city_area" : "area";
  }

  if (lat != null && lng != null && candidates.length) {
    candidates = [...candidates].sort((a, b) => {
      const da = haversineKm(lat, lng, a.latitude ?? 0, a.longitude ?? 0);
      const db = haversineKm(lat, lng, b.latitude ?? 0, b.longitude ?? 0);
      return da - db;
    });
    reason = `${reason}_nearest`;
  }

  const manager = candidates[0] || null;
  const distanceKm =
    manager && lat != null && lng != null
      ? haversineKm(lat, lng, manager.latitude ?? 0, manager.longitude ?? 0)
      : null;

  return { manager, reason, city, distanceKm };
}
