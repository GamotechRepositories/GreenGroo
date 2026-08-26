import { SERVICE_LOCATIONS, STATES, citiesForState } from "../constants/locations.js";

export function normalizePlace(value, { stripPhase = false } = {}) {
  let s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/hinjawadi/g, "hinjewadi");
  if (stripPhase) s = s.replace(/phase\s*\d+/g, "");
  return s.replace(/[^a-z0-9]+/g, " ").trim();
}

export function placesEqual(a, b) {
  const na = normalizePlace(a);
  const nb = normalizePlace(b);
  return Boolean(na && nb && na === nb);
}

export function areaMatches(stored, query) {
  // Keep phase numbers so Hinjewadi Phase 1 / 2 / 3 stay distinct.
  return placesEqual(stored, query);
}

export function snapToServiceLocation({ state, city, area } = {}) {
  const matchedState =
    STATES.find((s) => placesEqual(s, state)) ||
    STATES.find((s) => {
      const ns = normalizePlace(s);
      const nq = normalizePlace(state);
      return ns && nq && (ns.includes(nq) || nq.includes(ns));
    }) ||
    "";

  const pool = matchedState ? citiesForState(matchedState) : SERVICE_LOCATIONS;

  let matchedCity =
    pool.find((c) => placesEqual(c.name, city)) ||
    pool.find((c) =>
      c.areas.some((a) => placesEqual(a, city) || placesEqual(a, area))
    );

  if (!matchedCity) {
    matchedCity = SERVICE_LOCATIONS.find(
      (c) =>
        placesEqual(c.name, city) ||
        c.areas.some((a) => placesEqual(a, city) || placesEqual(a, area))
    );
  }

  if (!matchedCity) {
    return {
      state: matchedState || state || "",
      city: "",
      cityId: "",
      area: "",
    };
  }

  const areas = matchedCity.areas || [];
  const exact = areas.filter((a) => placesEqual(a, area) || placesEqual(a, city));
  let matchedArea = "";
  if (exact.length === 1) {
    matchedArea = exact[0];
  } else if (exact.length === 0) {
    const loose = areas.filter((a) => areaMatches(a, area) || areaMatches(a, city));
    if (loose.length === 1) matchedArea = loose[0];
  }

  return {
    state: matchedCity.state,
    city: matchedCity.name,
    cityId: matchedCity.id,
    area: matchedArea,
  };
}
