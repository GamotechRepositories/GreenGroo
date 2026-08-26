const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

function locationFromNominatim(data, coords = {}) {
  const addr = data?.address || {};
  const city = addr.city || addr.town || addr.village || addr.county || "";
  const state = addr.state || "";
  const area =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.city_district ||
    addr.village ||
    addr.hamlet ||
    "";
  const pincode = String(addr.postcode || "")
    .replace(/\D/g, "")
    .slice(0, 6);
  const address = data?.display_name || "";
  const label = [area, city].filter(Boolean).join(", ") || address || "Current location";

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
      maximumAge: 30_000,
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

export async function detectCurrentLocation() {
  const position = await getPosition().catch((error) => {
    throw new Error(geoErrorMessage(error));
  });

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const coords = { lat, lng };

  try {
    const params = new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lng),
      zoom: "18",
      addressdetails: "1",
    });
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return { ...coords, latitude: lat, longitude: lng, label: "Current location" };
    }
    const data = await response.json();
    return locationFromNominatim(data, coords);
  } catch {
    return {
      latitude: lat,
      longitude: lng,
      label: "Current location",
    };
  }
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
    const pincode = String(addr.postcode || "").replace(/\D/g, "").slice(0, 6);
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
