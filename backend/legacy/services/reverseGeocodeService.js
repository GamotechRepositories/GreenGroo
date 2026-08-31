import axios from "axios";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

/** First two PIN digits allowed per Indian state (India Post circles). */
const STATE_PIN_PREFIXES = {
  maharashtra: [40, 41, 42, 43, 44],
  "andhra pradesh": [50, 51, 52, 53],
  telangana: [50, 51, 52, 53],
  karnataka: [56, 57, 58, 59],
  "tamil nadu": [60, 61, 62, 63, 64],
  kerala: [67, 68, 69],
  delhi: [11],
  gujarat: [36, 37, 38, 39],
  rajasthan: [30, 31, 32, 33, 34],
  "uttar pradesh": [20, 21, 22, 23, 24, 25, 26, 27, 28],
  "west bengal": [70, 71, 72, 73, 74],
  punjab: [14, 15, 16],
  haryana: [12, 13],
  goa: [40, 403],
  "madhya pradesh": [45, 46, 47, 48],
  chhattisgarh: [49],
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

function pinPrefix(pincode) {
  return parseInt(String(pincode).slice(0, 2), 10);
}

function pincodeValidForState(pincode, state) {
  const pin = parsePincode(pincode);
  if (!pin) return false;
  const prefix = pinPrefix(pin);
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

  const admin =
    addr.county ||
    addr.state_district ||
    addr.city_district ||
    "";

  const fromAdmin = String(admin)
    .replace(/\s+(city|district|subdistrict|taluka|sub-district)\b/gi, "")
    .trim();
  if (fromAdmin && fromAdmin.length > 2) {
    return fromAdmin.split(/\s+/)[0];
  }

  return String(addr.village || "").trim();
}

function extractArea(addr = {}, addresstype = "") {
  const urban = [
    addr.suburb,
    addr.neighbourhood,
    addr.quarter,
    addr.city_district,
    addr.residential,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (urban.length) return urban[0];

  if (addresstype === "suburb" && addr.suburb) {
    return String(addr.suburb).trim();
  }

  return String(addr.village || addr.hamlet || "").trim();
}

function buildLabel(area, city, state) {
  const parts = [area, city].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return state || "Current location";
}

function buildAddressLine(area, city, state, pincode) {
  return [area, city, state, pincode].filter(Boolean).join(", ");
}

export function parseNominatimResult(data, coords = {}) {
  const addr = data?.address || {};
  const state = String(addr.state || "").trim();
  const city = extractCity(addr);
  const area = extractArea(addr, data?.addresstype || "");
  const pincode = parsePincode(addr.postcode);
  const label = buildLabel(area, city, state);
  const address =
    buildAddressLine(area, city, state, pincode) ||
    String(data?.display_name || "").trim();

  return {
    lat: coords.lat,
    lng: coords.lng,
    city,
    state,
    area,
    pincode,
    address,
    label,
    pincodeValid: pincode ? pincodeValidForState(pincode, state) : false,
    source: "nominatim",
    zoom: coords.zoom,
  };
}

async function fetchNominatim(lat, lng, zoom) {
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
    zoom: String(zoom),
    addressdetails: "1",
    "accept-language": "en",
  });

  const { data } = await axios.get(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GreenGroo/1.0 (delivery location lookup)",
    },
    timeout: 12000,
  });

  return data;
}

/**
 * Reverse-geocode GPS coordinates with India-aware pincode validation.
 * Tries coarser zoom first (suburb level) — street-level often returns wrong PIN.
 */
export async function reverseGeocodeCoords(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return { error: "Invalid coordinates" };
  }

  const zoomLevels = [14, 16, 18];
  const candidates = [];
  let fallback = null;

  for (const zoom of zoomLevels) {
    try {
      const data = await fetchNominatim(latNum, lngNum, zoom);
      if (!data?.address) continue;

      const parsed = parseNominatimResult(data, { lat: latNum, lng: lngNum, zoom });
      candidates.push(parsed);

      if (parsed.pincode && parsed.pincodeValid) {
        return parsed;
      }
      if (!fallback) fallback = parsed;
    } catch {
      // try next zoom
    }
  }

  if (candidates.length) {
    const withPin = candidates.find((c) => c.pincode && c.pincodeValid);
    if (withPin) return withPin;

    const anyPin = candidates.find((c) => c.pincode);
    if (anyPin) {
      return { ...anyPin, pincode: "", pincodeValid: false };
    }
  }

  if (fallback) {
    return { ...fallback, pincode: fallback.pincodeValid ? fallback.pincode : "" };
  }

  return {
    lat: latNum,
    lng: lngNum,
    city: "",
    state: "",
    area: "",
    pincode: "",
    address: "",
    label: "Current location",
    pincodeValid: false,
    source: "coords_only",
  };
}
