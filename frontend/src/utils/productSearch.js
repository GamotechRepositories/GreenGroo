export function buildProductSearchUrl(query = "", categoryName = "") {
  const params = new URLSearchParams();
  const q = query.trim();
  const category = categoryName.trim();

  if (q) params.set("q", q);
  if (category) params.set("categoryName", category);

  const qs = params.toString();
  return qs ? `/product?${qs}` : "/product";
}
