/**
 * Local/catalog mock products that live only in the client cart
 * (not persisted via /api/cart).
 */
export function isMongoObjectId(id) {
  return /^[a-f\d]{24}$/i.test(String(id || ""));
}

export function isLocalProductId(id) {
  const value = String(id || "");
  if (!value) return false;

  if (
    value.startsWith("deal-") ||
    value.startsWith("dummy-") ||
    value.startsWith("shop-") ||
    value.startsWith("rtc-") ||
    value.startsWith("sm-") ||
    value.startsWith("local-")
  ) {
    return true;
  }

  // Any non-Mongo id is treated as a local catalog item
  return !isMongoObjectId(value);
}
