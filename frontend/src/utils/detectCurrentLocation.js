import { reverseGeocodeLocation } from "../api/api";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

const STATE_PIN_PREFIXES = {
  maharashtra: [40, 41, 42, 43, 44],
  "andhra pradesh": [50, 51, 52, 53],
  telangana: [50, 51, 52, 53],
  karnataka: [56, 57, 58, 59],
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

export function locationFromNominatim(data, coords = {}) {
  const addr = data?.address || {};
  const state = String(addr.state || "").trim();
  const city = extractCity(addr);
  const area = extractArea(addr);
  let pincode = parsePincode(addr.postcode);
  if (pincode && !pincodeValidForState(pincode, state)) {
    pincode = "";
  }

  const label = [area, city].filter(Boolean).join(", ") || "Current location";
  const address = [area, city, state, pincode].filter(Boolean).join(", ");

  return {
    lat: coords.lat,
    lng: coords.lng,
    city,
    state,
    area,
    pincode,
    address,
    label,
  };
}

export function formatDeliveryLine(location) {
  if (!location) return "";
  if (location.area || location.city) {
    return [location.area, location.city, location.pincode].filter(Boolean).join(", ");
  }
  return location.address || "Current location";
}

function geoErrorMessage(error) {
  if (error?.code === 1) {
    return "Allow location access to see nearby store inventory";
  }
  if (error?.code === 2) {
    return "Could not determine your position. Try again outdoors or near a window.";
  }
  if (error?.code === 3) {
    return "Location request timed out. Try again.";
  }
  return error?.message || "Could not detect current location";
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
  return { lat, lng, label: "Current location" };
}

export async function detectCurrentLocation() {
  const position = await getPosition().catch((error) => {
    throw new Error(geoErrorMessage(error));
  });

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  try {
    const { data } = await reverseGeocodeLocation(lat, lng);
    if (data?.success && data.data) {
      const d = data.data;
      return {
        lat: d.lat ?? lat,
        lng: d.lng ?? lng,
        city: d.city || "",
        state: d.state || "",
        area: d.area || "",
        pincode: d.pincode || "",
        address: d.address || "",
        label: d.label || "Current location",
      };
    }
  } catch {
    // fall back to direct Nominatim
  }

  return clientReverseGeocode(lat, lng);
}
