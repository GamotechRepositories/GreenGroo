import { geocodeAddressString } from "../../../legacy/services/reverseGeocodeService.js";
import { haversineKm } from "./darkStoreResolver.js";

/**
 * Ensure StoreOrder customerLat/Lng match the written delivery address.
 * Fixes orders that stored browsing GPS or hardcoded demo coordinates.
 */
export async function refreshStoreOrderCustomerCoords(order) {
  if (!order?.customerAddress) return order;

  const geocoded = await geocodeAddressString(order.customerAddress);
  if (!geocoded) return order;

  const hasStored =
    order.customerLat != null &&
    order.customerLng != null &&
    Number.isFinite(Number(order.customerLat)) &&
    Number.isFinite(Number(order.customerLng));

  if (!hasStored) {
    order.customerLat = geocoded.lat;
    order.customerLng = geocoded.lng;
    await order.save();
    return order;
  }

  const driftKm = haversineKm(
    Number(order.customerLat),
    Number(order.customerLng),
    geocoded.lat,
    geocoded.lng
  );

  if (driftKm > 0.3) {
    order.customerLat = geocoded.lat;
    order.customerLng = geocoded.lng;
    await order.save();
  }

  return order;
}
