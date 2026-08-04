export function getAddressFullName(addr) {
  return addr?.fullName || addr?.name || "";
}

export function formatAddressLine(addr) {
  if (!addr) return "";

  const parts = [
    addr.shopName,
    addr.shopNo ? `Shop ${addr.shopNo}` : "",
    addr.fullAddress,
    addr.landmark,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);

  return parts.join(", ");
}
