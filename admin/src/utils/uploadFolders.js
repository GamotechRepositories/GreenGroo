export const UPLOAD_FOLDERS = {
  HERO_BANNERS: "hero-banners",
  OFFER_BANNERS: "offer-banners",
  CATEGORIES: "categories",
  PRODUCTS: "products",
  BRANDS: "brands",
  SHIPMENT_EVIDENCE: "shipment-evidence",
};

export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_BYTES_BY_FOLDER = {
  [UPLOAD_FOLDERS.HERO_BANNERS]: 15 * 1024 * 1024,
  [UPLOAD_FOLDERS.OFFER_BANNERS]: 15 * 1024 * 1024,
};

export function getMaxUploadBytes(folder) {
  return MAX_UPLOAD_BYTES_BY_FOLDER[folder] || DEFAULT_MAX_UPLOAD_BYTES;
}

export function formatMaxUploadMb(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export const UPLOAD_FOLDER_LABELS = {
  [UPLOAD_FOLDERS.HERO_BANNERS]: "Hero banners",
  [UPLOAD_FOLDERS.OFFER_BANNERS]: "Offer banners",
  [UPLOAD_FOLDERS.CATEGORIES]: "Categories",
  [UPLOAD_FOLDERS.PRODUCTS]: "Products",
  [UPLOAD_FOLDERS.BRANDS]: "Brands",
  [UPLOAD_FOLDERS.SHIPMENT_EVIDENCE]: "Shipment evidence",
};
