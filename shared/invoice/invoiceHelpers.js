/** Returns a 6-digit numeric order id for display */
export function getOrderNumber(order) {
  const num = order?.orderNumber ?? "";
  if (/^\d{6}$/.test(num)) return num;

  const digits = String(num).replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(-6);

  const fromId = String(order?._id ?? "").replace(/\D/g, "");
  return (fromId.slice(-6) || "000000").padStart(6, "0");
}

export function getInvoiceFilename(order) {
  return `Invoice_${getOrderNumber(order)}.pdf`;
}

export function getAddressFullName(addr) {
  return addr?.fullName || addr?.name || "";
}

export function formatCustomerAddress(addr) {
  if (!addr) return "—";

  const lines = [
    addr.fullAddress,
    addr.landmark,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);

  return lines.join(", ") || "—";
}
