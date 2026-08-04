const STORAGE_KEY = "order_delivery_ratings";

export function getDeliveryRatings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getDeliveryRating(orderId) {
  if (!orderId) return null;
  const rating = getDeliveryRatings()[orderId];
  return typeof rating === "number" && rating > 0 ? rating : null;
}

export function setDeliveryRating(orderId, rating) {
  if (!orderId) return;
  const next = { ...getDeliveryRatings(), [orderId]: Math.min(5, Math.max(1, rating)) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
