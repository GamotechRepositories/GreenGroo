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

export function cropCategoryFromName(name = "") {
  const key = String(name).trim().toLowerCase();
  const hit = Object.keys(CROP_CATEGORIES).find((n) => key.includes(n));
  return hit ? CROP_CATEGORIES[hit] : "VEG";
}

/** Always show GGC-CRP-VEG-TOM-00001 (category + crop code + serial). */
export function formatCropBusinessId(crop = {}) {
  const raw = String(crop.cropId || crop.id || "").trim();
  const parts = raw.split("-").filter(Boolean);
  const fromId =
    parts[0] === "GGC" && parts[1] === "CRP" && parts.length >= 5 && !/^\d+$/.test(parts[3])
      ? String(parts[3]).toUpperCase()
      : "";
  const code = cropCodeFromName(crop.cropName || crop.cropCode) || fromId || "XXX";
  const category = String(crop.category || cropCategoryFromName(crop.cropName) || "VEG").toUpperCase();

  if (parts[0] === "GGC" && parts[1] === "CRP") {
    const last = parts[parts.length - 1];
    const serial = /^\d+$/.test(last) ? last.padStart(5, "0") : "00001";
    const cat = (parts[2] && !/^\d+$/.test(parts[2]) ? parts[2] : category).toUpperCase();
    return `GGC-CRP-${cat}-${code}-${serial}`;
  }

  return raw || `GGC-CRP-${category}-${code}-00001`;
}
