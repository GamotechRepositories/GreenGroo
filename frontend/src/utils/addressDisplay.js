export function getAddressFullName(addr) {
  return addr?.fullName || addr?.name || "";
}

export function formatAddressLine(addr) {
  if (!addr) return "";

  const rawParts = [
    addr.shopNo,
    addr.shopName,
    addr.fullAddress,
    addr.area,
    addr.landmark && addr.landmark !== addr.area ? addr.landmark : "",
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);

  const seen = new Set();
  const dedupedParts = [];

  for (const part of rawParts) {
    const trimmed = String(part).trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    
    // Check if exact duplicate or already represented
    if (!seen.has(lower)) {
      seen.add(lower);
      dedupedParts.push(trimmed);
    }
  }

  return dedupedParts.join(", ");
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
    area: addr.area || "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    addressType: getAddressTypeTag(addr),
  };
}

export function sortAddressesByLatest(list = []) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    if (timeA && timeB && timeA !== timeB) return timeB - timeA;
    if (a._id && b._id) return String(b._id).localeCompare(String(a._id));
    return 0;
  });
}

export function getAddressTypeTag(addr, index = 0) {
  if (!addr) return "Home";
  const direct = (addr.addressType || addr.label || addr.type || "").trim();
  if (direct) {
    if (/^work$/i.test(direct)) return "Office";
    return direct.charAt(0).toUpperCase() + direct.slice(1);
  }
  const name = (addr.shopName || "").trim();
  if (/^(home|office|work|other)$/i.test(name)) {
    return name.toLowerCase() === "work" ? "Office" : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  if (index === 0) return "Home";
  if (index === 1) return "Office";
  return "Other";
}

