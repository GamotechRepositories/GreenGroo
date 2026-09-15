export function createProductPath(crop = {}) {
  const q = new URLSearchParams({
    crop: crop.cropName || "",
    variety: crop.variety || "",
    harvestDate: crop.expectedHarvestDate || "",
    farmLocation: crop.farmLocation || "",
    unit: crop.unit || "Kg",
    cropId: crop.cropId || crop.id || "",
  });
  return `/farmer/products/add?${q.toString()}`;
}

export function formatCropDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const CROP_CODES = {
  tomato: "TOM",
  onion: "ONI",
  potato: "POT",
  carrot: "CAR",
  cucumber: "CUC",
  spinach: "SPI",
  palak: "SPI",
  cabbage: "CAB",
  cauliflower: "CAU",
  brinjal: "BRI",
  eggplant: "BRI",
  chilli: "CHI",
  chili: "CHI",
  capsicum: "CAP",
  beans: "BEA",
  okra: "OKR",
  bhindi: "OKR",
  garlic: "GAR",
  ginger: "GIN",
  lemon: "LEM",
  mango: "MAN",
  banana: "BAN",
};

export const CROP_CATEGORY_OPTIONS = [
  { label: "Vegetables (भाजीपाला)", value: "Vegetables", code: "VEG" },
  { label: "Fruits (फळे)", value: "Fruits", code: "FRT" },
  { label: "Oilseeds / Oil (तेलबिया / ऑइल)", value: "Oilseeds", code: "OIL" },
  { label: "Grains & Cereals (धान्य)", value: "Grains", code: "GRN" },
  { label: "Pulses (कडधान्य / डाळी)", value: "Pulses", code: "PLS" },
  { label: "Spices (मसाले)", value: "Spices", code: "SPC" },
  { label: "Flowers (फुले)", value: "Flowers", code: "FLW" },
  { label: "Cash Crops (नगदी पिके / कापूस / ऊस)", value: "Cash Crops", code: "CSH" },
  { label: "Other (इतर)", value: "Other", code: "OTH" },
];

const CROP_CATEGORIES = {
  mango: "FRT",
  banana: "FRT",
  apple: "FRT",
  orange: "FRT",
  grapes: "FRT",
  lemon: "FRT",
  wheat: "GRN",
  rice: "GRN",
  bajra: "GRN",
  jowar: "GRN",
  soybean: "OIL",
  mustard: "OIL",
  sunflower: "OIL",
  groundnut: "OIL",
  cotton: "CSH",
  sugarcane: "CSH",
};

export function cropCodeFromName(name = "") {
  const key = String(name).trim().toLowerCase();
  if (!key) return "";
  if (CROP_CODES[key]) return CROP_CODES[key];
  const hit = Object.keys(CROP_CODES).find((n) => key.includes(n));
  if (hit) return CROP_CODES[hit];
  return String(name)
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

export function varietyCodeFromName(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return "XXX";
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "XXX";
  return cleaned.slice(0, 3).toUpperCase().padEnd(3, "X");
}

export function cropCategoryFromName(name = "", category = "") {
  if (category) {
    const catUpper = String(category).trim().toUpperCase();
    if (["VEG", "FRT", "OIL", "GRN", "PLS", "SPC", "FLW", "CSH", "OTH"].includes(catUpper)) {
      return catUpper;
    }
    const found = CROP_CATEGORY_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === String(category).toLowerCase() || opt.code === catUpper
    );
    if (found) return found.code;
    const n = String(category).toLowerCase();
    if (n.includes("veg")) return "VEG";
    if (n.includes("fruit")) return "FRT";
    if (n.includes("oil") || n.includes("soybean") || n.includes("mustard")) return "OIL";
    if (n.includes("grain") || n.includes("cereal") || n.includes("wheat") || n.includes("rice")) return "GRN";
    if (n.includes("pulse") || n.includes("dal")) return "PLS";
    if (n.includes("spice")) return "SPC";
    if (n.includes("flower")) return "FLW";
    if (n.includes("cash") || n.includes("cotton") || n.includes("sugar")) return "CSH";
  }
  const key = String(name).trim().toLowerCase();
  const hit = Object.keys(CROP_CATEGORIES).find((n) => key.includes(n));
  if (hit) return CROP_CATEGORIES[hit];
  if (/(oil|soybean|mustard|sunflower|groundnut|sesame)/.test(key)) return "OIL";
  if (/(mango|banana|apple|fruit|orange|grapes|pomegranate|papaya|guava)/.test(key)) return "FRT";
  if (/(wheat|rice|grain|bajra|jowar|maize)/.test(key)) return "GRN";
  if (/(dal|pulse|tur|moong|urad|gram|chana)/.test(key)) return "PLS";
  if (/(chilli|turmeric|spice|cumin|ginger|garlic)/.test(key)) return "SPC";
  if (/(flower|rose|marigold|jasmine)/.test(key)) return "FLW";
  if (/(cotton|sugarcane|tobacco|cash)/.test(key)) return "CSH";
  return "VEG";
}

/**
 * Prefer stored cropId. If old format without variety, inject variety for display.
 * Same crop+variety always resolves to the same shape once DB is normalized.
 */
export function formatCropBusinessId(crop = {}) {
  const raw = String(crop.cropId || crop.id || "").trim();
  const parts = raw.split("-").filter(Boolean);
  const code = cropCodeFromName(crop.cropName || crop.cropCode) || "XXX";
  const category = String(crop.categoryCode || cropCategoryFromName(crop.cropName, crop.category) || "VEG").toUpperCase();
  const variety = varietyCodeFromName(crop.variety);

  if (parts[0] === "GGC" && parts[1] === "CRP") {
    const last = parts[parts.length - 1];
    const serial = /^\d+$/.test(last) ? last.padStart(5, "0") : "00001";
    const cat = (parts[2] && !/^\d+$/.test(parts[2]) ? parts[2] : category).toUpperCase();
    // Already has variety: GGC-CRP-CAT-CROP-VAR-SERIAL
    if (parts.length >= 6 && !/^\d+$/.test(parts[3]) && !/^\d+$/.test(parts[4])) {
      const cropPart = code !== "XXX" ? code : String(parts[3]).toUpperCase();
      const varPart = crop.variety ? variety : String(parts[4]).toUpperCase();
      return `GGC-CRP-${cat}-${cropPart}-${varPart}-${serial}`;
    }
    // Old: GGC-CRP-CAT-CROP-SERIAL → insert variety
    if (parts.length >= 5 && !/^\d+$/.test(parts[3])) {
      const cropPart = code !== "XXX" ? code : String(parts[3]).toUpperCase();
      return `GGC-CRP-${cat}-${cropPart}-${variety}-${serial}`;
    }
    return `GGC-CRP-${cat}-${code}-${variety}-${serial}`;
  }

  return raw || `GGC-CRP-${category}-${code}-${variety}-00001`;
}

/**
 * Always show GGC-ART-{CAT}-{CROP}-{VAR}-{SERIAL}
 * Variety comes from product.variety (or cropId / productId segments).
 */
export function formatProductBusinessId(product = {}) {
  const code =
    cropCodeFromName(product.cropName || product.productName || product.name) || "XXX";
  const category = String(
    product.categoryCode || cropCategoryFromName(product.cropName || product.productName || product.name) || "VEG"
  ).toUpperCase();
  const variety = varietyCodeFromName(product.variety);

  const cropRaw = String(product.cropId || "").trim();
  const raw = String(product.productId || product.id || cropRaw || "").trim();
  const normalized = raw.toUpperCase().startsWith("GGC-CRP-")
    ? raw.replace(/^GGC-CRP-/i, "GGC-ART-")
    : raw;
  const parts = normalized.split("-").filter(Boolean);

  if (parts[0] === "GGC" && parts[1] === "ART") {
    const last = parts[parts.length - 1];
    const serial = /^\d+$/.test(last) ? last.padStart(5, "0") : "00001";

    // Grade-based ERP article: GGC-ART-TOM-A-00001 — leave as-is
    if (parts.length >= 5 && /^[ABC]$/.test(String(parts[3] || "").toUpperCase())) {
      return normalized;
    }

    const cat = (parts[2] && !/^\d+$/.test(parts[2]) ? parts[2] : category).toUpperCase();

    // Already has variety: GGC-ART-CAT-CROP-VAR-SERIAL
    if (parts.length >= 6 && !/^\d+$/.test(parts[3]) && !/^\d+$/.test(parts[4]) && !/^[ABC]$/.test(parts[3])) {
      const cropPart = code !== "XXX" ? code : String(parts[3]).toUpperCase();
      // Prefer live product.variety so Hybrid etc. always shows in ID
      const varPart = product.variety ? variety : String(parts[4] || "XXX").toUpperCase();
      return `GGC-ART-${cat}-${cropPart}-${varPart}-${serial}`;
    }

    // Old: GGC-ART-CAT-CROP-SERIAL → insert variety
    if (parts.length >= 5 && !/^\d+$/.test(parts[3]) && !/^[ABC]$/.test(parts[3])) {
      const cropPart = code !== "XXX" ? code : String(parts[3]).toUpperCase();
      return `GGC-ART-${cat}-${cropPart}-${variety}-${serial}`;
    }

    return `GGC-ART-${cat}-${code}-${variety}-${serial}`;
  }

  return `GGC-ART-${category}-${code}-${variety}-00001`;
}
