import DeliveryManager from "../delivery-manager/models/DeliveryManager.js";

/**
 * storeId === DeliveryManager._id (no separate Store collection yet).
 */
export async function resolveStoreIdForRider(rider) {
  if (!rider?.area) return null;

  const manager = await DeliveryManager.findOne({
    isActive: true,
    $or: [
      { cityId: rider.cityId, area: rider.area },
      { city: rider.city, area: rider.area },
    ],
  })
    .select("_id")
    .sort({ createdAt: 1 });

  return manager?._id?.toString() || null;
}

export async function resolveManagerForStoreId(storeId) {
  if (!storeId) return null;
  return DeliveryManager.findById(storeId);
}

export const areaMatchForManager = (manager) => ({
  $or: [
    { cityId: manager.cityId, area: manager.area },
    { city: manager.city, area: manager.area },
  ],
});
