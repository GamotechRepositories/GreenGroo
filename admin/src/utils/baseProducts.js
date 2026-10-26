/** Catalog products customers can buy — dark-store copies (ownerManagerId) and test records are excluded. */
export function isRealAvailableProduct(product) {
  if (product.ownerManagerId) return false;
  if (product.isActive === false || product.inStock === false) return false;
  if (!(Number(product.stock) > 0)) return false;
  return !/\btest\b/i.test(String(product.name || ''));
}

export function groupRealProductsByBase(products = []) {
  const map = new Map();
  products.forEach((product) => {
    const key = String(product.baseProductId || '').trim();
    if (!key || !isRealAvailableProduct(product)) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  });
  map.forEach((list) => list.sort((a, b) => String(a.name).localeCompare(String(b.name))));
  return map;
}

export function apiErrorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
