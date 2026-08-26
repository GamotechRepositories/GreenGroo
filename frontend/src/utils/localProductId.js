export function isLocalProductId(id) {
  const value = String(id || "");
  return (
    value.startsWith("deal-") ||
    value.startsWith("dummy-") ||
    value.startsWith("shop-")
  );
}
