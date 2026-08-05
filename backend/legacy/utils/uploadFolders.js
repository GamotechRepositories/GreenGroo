export const UPLOAD_FOLDERS = {
  HERO_BANNERS: "hero-banners",
  OFFER_BANNERS: "offer-banners",
  CATEGORIES: "categories",
  PRODUCTS: "products",
  BRANDS: "brands",
  PAYMENT_PROOFS: "payment-proofs",
  SUPPORT: "support",
  SHIPMENT_EVIDENCE: "shipment-evidence",
};

/** @deprecated Use UPLOAD_FOLDERS.PAYMENT_PROOFS */
export const LEGACY_PAYMENT_FOLDER = "payments";

const FOLDER_ALIASES = {
  [LEGACY_PAYMENT_FOLDER]: UPLOAD_FOLDERS.PAYMENT_PROOFS,
};

export const ALLOWED_UPLOAD_FOLDERS = new Set(Object.values(UPLOAD_FOLDERS));

export const ADMIN_UPLOAD_FOLDERS = new Set([
  UPLOAD_FOLDERS.HERO_BANNERS,
  UPLOAD_FOLDERS.OFFER_BANNERS,
  UPLOAD_FOLDERS.CATEGORIES,
  UPLOAD_FOLDERS.PRODUCTS,
  UPLOAD_FOLDERS.BRANDS,
  UPLOAD_FOLDERS.SHIPMENT_EVIDENCE,
]);

export const USER_UPLOAD_FOLDERS = new Set([UPLOAD_FOLDERS.PAYMENT_PROOFS]);

export const PUBLIC_UPLOAD_FOLDERS = new Set([UPLOAD_FOLDERS.SUPPORT]);

export function normalizeUploadFolder(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (ALLOWED_UPLOAD_FOLDERS.has(raw)) {
    return raw;
  }

  return FOLDER_ALIASES[raw] || "";
}

export function buildS3ObjectKey(folder, fileName) {
  return `${folder}/${fileName}`;
}
