/** Returns a 6-digit numeric order id for display */
export function getOrderNumber(order) {
  const num = order?.orderNumber ?? "";
  if (/^\d{6}$/.test(num)) return num;

  const digits = String(num).replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(-6);

  const fromId = String(order?._id ?? "").replace(/\D/g, "");
  return (fromId.slice(-6) || "000000").padStart(6, "0");
}
