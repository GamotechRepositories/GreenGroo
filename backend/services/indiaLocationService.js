import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pincodeData = require("india-pincode-lookup/pincodes.json");

let locationIndex = null;

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function buildLocationIndex() {
  const stateDisplay = new Map();
  const stateDistricts = new Map();
  const districtPincodes = new Map();

  for (const entry of pincodeData) {
    const stateKey = normalizeKey(entry.stateName);
    const districtKey = normalizeKey(entry.districtName);
    const pincode = String(entry.pincode || "").padStart(6, "0");

    if (!stateKey || !districtKey || !/^\d{6}$/.test(pincode)) continue;

    if (!stateDisplay.has(stateKey)) {
      stateDisplay.set(stateKey, toTitleCase(entry.stateName));
    }

    if (!stateDistricts.has(stateKey)) {
      stateDistricts.set(stateKey, new Map());
    }
    const districts = stateDistricts.get(stateKey);
    if (!districts.has(districtKey)) {
      districts.set(districtKey, toTitleCase(entry.districtName));
    }

    const districtId = `${stateKey}|${districtKey}`;
    if (!districtPincodes.has(districtId)) {
      districtPincodes.set(districtId, new Set());
    }
    districtPincodes.get(districtId).add(pincode);
  }

  const states = [...stateDisplay.values()].sort((a, b) => a.localeCompare(b));

  return {
    states,
    stateDisplay,
    stateDistricts,
    districtPincodes,
  };
}

function getLocationIndex() {
  if (!locationIndex) {
    locationIndex = buildLocationIndex();
  }
  return locationIndex;
}

function resolveStateKey(stateName) {
  const query = normalizeKey(stateName);
  const index = getLocationIndex();

  for (const [key, display] of index.stateDisplay.entries()) {
    if (key === query || normalizeKey(display) === query) {
      return key;
    }
  }

  return null;
}

function resolveDistrictKey(stateKey, cityName) {
  const query = normalizeKey(cityName);
  const districts = getLocationIndex().stateDistricts.get(stateKey);
  if (!districts) return null;

  for (const [key, display] of districts.entries()) {
    if (key === query || normalizeKey(display) === query) {
      return key;
    }
  }

  return null;
}

export function searchStates(query = "", limit = 30) {
  const index = getLocationIndex();
  const normalizedQuery = normalizeKey(query);

  return index.states
    .filter((state) => !normalizedQuery || normalizeKey(state).includes(normalizedQuery))
    .slice(0, limit);
}

export function searchCities(stateName, query = "", limit = 40) {
  const stateKey = resolveStateKey(stateName);
  if (!stateKey) return [];

  const districts = getLocationIndex().stateDistricts.get(stateKey);
  if (!districts) return [];

  const normalizedQuery = normalizeKey(query);

  return [...districts.values()]
    .filter((city) => !normalizedQuery || normalizeKey(city).includes(normalizedQuery))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit);
}

export function searchPincodes(stateName, cityName, query = "", limit = 200) {
  const stateKey = resolveStateKey(stateName);
  if (!stateKey) return [];

  const districtKey = resolveDistrictKey(stateKey, cityName);
  if (!districtKey) return [];

  const districtId = `${stateKey}|${districtKey}`;
  const pincodes = getLocationIndex().districtPincodes.get(districtId);
  if (!pincodes) return [];

  const normalizedQuery = String(query || "").trim();
  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 250);

  return [...pincodes]
    .filter((pincode) => !normalizedQuery || pincode.startsWith(normalizedQuery))
    .sort((a, b) => Number(a) - Number(b))
    .slice(0, safeLimit);
}

export function lookupPincode(pincode) {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return { error: "Pincode must be 6 digits" };
  }

  const matches = pincodeData.filter((entry) => String(entry.pincode).padStart(6, "0") === pin);
  if (!matches.length) {
    return { error: "Pincode not found" };
  }

  const first = matches[0];
  return {
    pincode: pin,
    city: toTitleCase(first.districtName),
    state: toTitleCase(first.stateName),
    officeName: first.officeName || "",
  };
}
