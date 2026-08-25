const STORAGE_KEY = "greengrocc_delivery_location";

export function readDeliveryLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deliveryLocationKey(location) {
  if (!location) return "";
  return [
    location.lat ?? location.latitude,
    location.lng ?? location.longitude,
    location.city,
    location.area,
    location.pincode,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join("|");
}

export function storeLocationParams(location = readDeliveryLocation()) {
  if (!location) return {};
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  const params = {};
  if (lat != null && lat !== "") params.lat = lat;
  if (lng != null && lng !== "") params.lng = lng;
  if (location.city) params.city = location.city;
  if (location.area) params.area = location.area;
  if (location.pincode) params.pincode = location.pincode;
  const address = String(location.address || "").trim();
  if (address && !/^select your delivery location$/i.test(address)) {
    params.address = address;
  }
  return params;
}

export { STORAGE_KEY as DELIVERY_LOCATION_KEY };
