import mongoose from "mongoose";

export function isLocalProductId(id) {
  const value = String(id || "").trim();
  if (!value) return true;
  return (
    value.startsWith("deal-") ||
    value.startsWith("dummy-") ||
    value.startsWith("shop-") ||
    value.startsWith("cat-") ||
    value.startsWith("prod-") ||
    value.startsWith("item-") ||
    !mongoose.Types.ObjectId.isValid(value)
  );
}
