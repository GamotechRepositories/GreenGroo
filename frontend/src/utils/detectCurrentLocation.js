const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export function locationFromNominatim(data, coords = {}) {
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
  const pincode = String(addr.postcode || "").replace(/\D/g, "").slice(0, 6);
  const address = data?.display_name || "";
  const label = [area, city].filter(Boolean).join(", ") || address || "Current location";

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
  return (
    location.address ||
    [location.area, location.city, location.pincode].filter(Boolean).join(", ") ||
    "Current location"
  );
}

export async function detectCurrentLocation() {
  const position = await new Promise((resolve, reject) => {
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

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

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
      return { lat, lng, label: "Current location" };
    }
    const data = await response.json();
    return locationFromNominatim(data, { lat, lng });
  } catch {
    return { lat, lng, label: "Current location" };
  }
}
