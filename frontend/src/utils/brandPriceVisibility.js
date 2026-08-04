export function brandRequiresLoginForPrice(brands = [], brandName = "") {
  const name = String(brandName || "").trim().toLowerCase();
  if (!name) return false;

  return brands.some(
    (brand) =>
      brand?.priceRequiresLogin &&
      String(brand.brandName || "").trim().toLowerCase() === name
  );
}
