export const DEFAULT_ENVIA_PICKUP_ORIGIN = {
  name: "Ashok Modi",
  company: "BulkMobileMart",
  email: "bulkmobilemart@gmail.com",
  phone: "7400222232",
  addressLine1: "SHOP NO. 2155, 2ND FLOOR, Nathani Heights",
  addressLine2: "Commercial Arcade",
  landmark: "Opp. Mumbai Central Railway Station",
  streetNumber: "2155",
  city: "Mumbai",
  state: "Maharashtra",
  country: "IN",
  postalCode: "400008",
  isDefault: true,
};

function safeTrim(value) {
  return String(value ?? "").trim();
}

export function normalizeCountryCode(country) {
  const normalized = safeTrim(country);
  if (!normalized) return "IN";
  if (normalized.toLowerCase() === "india") return "IN";
  return normalized.toUpperCase().slice(0, 3);
}

export function buildEnviaOriginStreet(origin = {}) {
  const legacyStreet = safeTrim(origin.street);
  const line1 = safeTrim(origin.addressLine1);

  if (!line1 && legacyStreet) {
    return legacyStreet;
  }

  const parts = [
    line1,
    safeTrim(origin.addressLine2),
    safeTrim(origin.landmark) ? `Landmark: ${safeTrim(origin.landmark)}` : "",
  ].filter(Boolean);

  return parts.join(", ") || legacyStreet;
}

export function extractEnviaStreetNumber(origin = {}) {
  const explicit = safeTrim(origin.streetNumber);
  if (explicit) return explicit;

  const match = safeTrim(origin.addressLine1 || origin.street).match(/shop\s*no\.?\s*(\d+)/i);
  return match ? match[1] : "1";
}

export function normalizeEnviaOriginFields(origin = {}) {
  const street = buildEnviaOriginStreet(origin);

  return {
    name: safeTrim(origin.name),
    company: safeTrim(origin.company) || "BulkMobileMart",
    email: safeTrim(origin.email),
    phone: safeTrim(origin.phone),
    addressLine1: safeTrim(origin.addressLine1),
    addressLine2: safeTrim(origin.addressLine2),
    landmark: safeTrim(origin.landmark),
    streetNumber: extractEnviaStreetNumber(origin),
    street,
    city: safeTrim(origin.city),
    state: safeTrim(origin.state),
    country: normalizeCountryCode(origin.country),
    postalCode: safeTrim(origin.postalCode || origin.pincode),
    isDefault: origin.isDefault !== false,
  };
}

export function hasConfiguredEnviaOrigin(origin = {}) {
  return Boolean(
    safeTrim(origin.name) ||
      safeTrim(origin.addressLine1) ||
      safeTrim(origin.street) ||
      safeTrim(origin.postalCode || origin.pincode)
  );
}

export function mergeEnviaOriginDefaults(origin = {}) {
  if (!hasConfiguredEnviaOrigin(origin)) {
    return normalizeEnviaOriginFields({ ...DEFAULT_ENVIA_PICKUP_ORIGIN, ...origin });
  }
  return normalizeEnviaOriginFields(origin);
}
