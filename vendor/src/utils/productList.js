export function isPendingProduct(status) {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  return s === "pending approval" || s === "pending";
}

export function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

export function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

export function productImageOf(item = {}) {
  return item.image || item.media?.mainPhoto || "";
}

export function productGroupKey(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id.toUpperCase();
  return `${productNameOf(item).trim().toLowerCase()}|${String(item.variety || "").trim().toLowerCase()}`;
}

export function productQty(product) {
  const gradesSum = (product.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product.availableQuantity ?? product.stock ?? 0);
}

export function formatProductId(product = {}) {
  const raw = String(product.productId || product.id || "").trim();
  if (isBusinessProductId(raw)) return raw;
  return "";
}

export function productFarmersPath(product) {
  const key = productGroupKey(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId =
    [product.productId, product.id].find((v) => isBusinessProductId(v)) || product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/vendor/products/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

export function statusPriority(status) {
  if (isPendingProduct(status)) return 0;
  if (status === "Rejected") return 1;
  if (status === "Draft" || status === "Paused") return 2;
  return 3;
}

export function groupByProduct(items) {
  const map = new Map();
  for (const p of items) {
    const key = productGroupKey(p);
    const qty = productQty(p);
    const existing = map.get(key);
    const image = productImageOf(p);
    if (!existing) {
      map.set(key, {
        ...p,
        image,
        groupKey: key,
        listings: [p],
        totalQty: qty,
      });
      continue;
    }
    existing.listings.push(p);
    existing.totalQty += qty;
    if (statusPriority(p.status) < statusPriority(existing.status)) {
      existing.status = p.status;
    }
    if (!existing.image && image) existing.image = image;
  }
  return Array.from(map.values());
}

export function matchesViewedProduct(product, { productId, productName, productKey }) {
  const idNeedle = String(productId || "").trim();
  const nameNeedle = String(productName || "").trim().toLowerCase();
  const keyNeedle = decodeURIComponent(String(productKey || "")).trim();
  const pid = String(product.productId || product.id || "").trim();
  const pname = productNameOf(product).trim().toLowerCase();
  const varietyKey = `${pname}|${String(product.variety || "").trim().toLowerCase()}`;

  if (idNeedle && isBusinessProductId(idNeedle)) {
    return pid.toUpperCase() === idNeedle.toUpperCase();
  }
  if (keyNeedle && isBusinessProductId(keyNeedle)) {
    return pid.toUpperCase() === keyNeedle.toUpperCase();
  }
  if (keyNeedle.includes("|") && varietyKey === keyNeedle.toLowerCase()) return true;
  if (nameNeedle && pname === nameNeedle) return true;
  if (keyNeedle && (pid.toLowerCase() === keyNeedle.toLowerCase() || pname === keyNeedle.toLowerCase())) return true;
  return false;
}

export function productStatusClass(status) {
  if (status === "Active" || status === "Approved") return "bg-green-100 text-green-700";
  if (isPendingProduct(status)) return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}
