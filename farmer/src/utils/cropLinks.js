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
