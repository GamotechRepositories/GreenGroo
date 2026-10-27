/**
 * Maps a category name to its banner key (admin → Banners → Category banners).
 * Keys must match `CATEGORIES` in admin/src/pages/Banners.jsx.
 */
export function categoryBannerKey(categoryName) {
  const name = String(categoryName || "").toLowerCase();
  if (name.includes("dry") && name.includes("fruit")) return "dryfruits";
  if (name.includes("fruit")) return "fruits";
  if (name.includes("dairy")) return "dairy";
  if (name.includes("vegetable")) return "vegetables";
  if (name.includes("beverage")) return "beverages";
  if (name.includes("oil")) return "oils";
  if (name.includes("spice")) return "spices";
  if (name.includes("pulse")) return "pulses";
  if (name.includes("grain")) return "grains";
  if (name.includes("organic")) return "organic";
  return "";
}
