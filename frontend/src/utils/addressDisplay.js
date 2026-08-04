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

export function formatAddressDetails(addr) {
  if (!addr) return [];

  return [
    getAddressFullName(addr) && `Name: ${getAddressFullName(addr)}`,
    addr.number && `Phone: +91 ${addr.number}`,
    addr.email && `Email: ${addr.email}`,
    addr.shopName && `Shop: ${addr.shopName}`,
    addr.shopNo && `Shop No.: ${addr.shopNo}`,
    addr.fullAddress && `Address: ${addr.fullAddress}`,
    addr.landmark && `Landmark: ${addr.landmark}`,
    [addr.city, addr.state, addr.pincode].filter(Boolean).length > 0 &&
      `City: ${[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}`,
  ].filter(Boolean);
}

export function mapAddressToForm(addr = {}) {
  return {
    fullName: addr.fullName || addr.name || "",
    number: addr.number || addr.phone || "",
    email: addr.email || "",
    shopNo: addr.shopNo || "",
    shopName: addr.shopName || "",
    fullAddress: addr.fullAddress || addr.streetArea || "",
    landmark: addr.landmark || "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
  };
}
