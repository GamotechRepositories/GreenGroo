import { getApiBaseUrl } from "../config/apiBase.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

const STATE_PIN_PREFIXES = {
  maharashtra: [40, 41, 42, 43, 44],
  "andhra pradesh": [50, 51, 52, 53],
  telangana: [50, 51, 52, 53],
};

function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parsePincode(raw) {
  const pin = String(raw || "").replace(/\D/g, "").slice(0, 6);
  return /^\d{6}$/.test(pin) ? pin : "";
}

function pincodeValidForState(pincode, state) {
  const pin = parsePincode(pincode);
  if (!pin) return false;
  const prefix = parseInt(pin.slice(0, 2), 10);
  const stateKey = norm(state);
  for (const [key, prefixes] of Object.entries(STATE_PIN_PREFIXES)) {
    if (stateKey.includes(key) || key.includes(stateKey)) {
      return prefixes.includes(prefix);
    }
  }
  return true;
}

function extractCity(addr = {}) {
  if (addr.city) return String(addr.city).trim();
  if (addr.town) return String(addr.town).trim();
  const admin = addr.county || addr.state_district || "";
  const cleaned = String(admin)
    .replace(/\s+(city|district|subdistrict|taluka|sub-district)\b/gi, "")
    .trim();
  if (cleaned.length > 2) return cleaned.split(/\s+/)[0];
  return String(addr.village || "").trim();
}

function extractArea(addr = {}) {
  const urban = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return urban[0] || String(addr.village || addr.hamlet || "").trim();
}

function locationFromNominatim(data, coords = {}) {
  const addr = data?.address || {};
  const state = String(addr.state || "").trim();
  const city = extractCity(addr);
  const area = extractArea(addr);
  let pincode = parsePincode(addr.postcode);
  if (pincode && !pincodeValidForState(pincode, state)) pincode = "";

  const label = [area, city].filter(Boolean).join(", ") || "Current location";
  const address = [area, city, state, pincode].filter(Boolean).join(", ");

  return {
    latitude: coords.lat,
    longitude: coords.lng,
    city,
    state,
    area,
    pincode,
    address,
    label,
  };
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 18000,
      maximumAge: 0,
    });
  });
}

function geoErrorMessage(error) {
  if (error?.code === 1) {
    return "Allow location access so this dark store can receive nearby orders";
  }
  if (error?.code === 2) {
    return "Could not determine your position. Try again near the store.";
  }
  if (error?.code === 3) {
    return "Location request timed out. Try again.";
  }
  return error?.message || "Could not detect current location";
}

async function reverseViaBackend(lat, lng) {
  const base = getApiBaseUrl();
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const response = await fetch(`${base}/api/location/reverse?${params}`);
  if (!response.ok) return null;
  const json = await response.json();
  if (!json?.success || !json.data) return null;
  const d = json.data;
  return {
    latitude: d.lat ?? lat,
    longitude: d.lng ?? lng,
    city: d.city || "",
    state: d.state || "",
    area: d.area || "",
    pincode: d.pincode || "",
    address: d.address || "",
    label: d.label || "Current location",
  };
}

async function clientReverseGeocode(lat, lng) {
  for (const zoom of [14, 16, 18]) {
    try {
      const params = new URLSearchParams({
        format: "json",
        lat: String(lat),
        lon: String(lng),
        zoom: String(zoom),
        addressdetails: "1",
        "accept-language": "en",
      });
      const response = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;
      const data = await response.json();
      const parsed = locationFromNominatim(data, { lat, lng });
      if (parsed.pincode) return parsed;
    } catch {
      // try next zoom
    }
  }
  return { latitude: lat, longitude: lng, label: "Current location" };
}

export async function detectCurrentLocation() {
  const position = await getPosition().catch((error) => {
    throw new Error(geoErrorMessage(error));
  });

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  try {
    const fromBackend = await reverseViaBackend(lat, lng);
    if (fromBackend) return fromBackend;
  } catch {
    // fall back
  }

  return clientReverseGeocode(lat, lng);
}

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

export async function geocodePlace({ area, city, state } = {}) {
  const q = [area, city, state, "India"].filter(Boolean).join(", ");
  if (!q.trim()) return null;
  try {
    const params = new URLSearchParams({
      format: "json",
      q,
      addressdetails: "1",
      limit: "1",
      countrycodes: "in",
    });
    const response = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
      headers: { Accept: "application/json", "Accept-Language": "en" },
    });
    if (!response.ok) return null;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    const addr = row.address || {};
    let pincode = parsePincode(addr.postcode);
    const st = String(addr.state || state || "").trim();
    if (pincode && !pincodeValidForState(pincode, st)) pincode = "";
    return {
      latitude: Number(row.lat),
      longitude: Number(row.lon),
      pincode,
      address: row.display_name || q,
    };
  } catch {
    return null;
  }
}
