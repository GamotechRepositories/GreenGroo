function cleanName(name) {
  return String(name || "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sharedTitle(items) {
  if (items.length === 1) return items[0].name || "Product";
  const parts = items.map((item) => cleanName(item.name).split(" ").filter(Boolean));
  const suffix = [];
  const shortest = Math.min(...parts.map((words) => words.length));
  for (let index = 1; index <= shortest; index += 1) {
    const word = parts[0][parts[0].length - index];
    const matches = parts.every(
      (words) => words[words.length - index]?.toLowerCase() === word?.toLowerCase()
    );
    if (!matches) break;
    suffix.unshift(word);
  }
  return suffix.join(" ") || items[0].name || "Product";
}

export function productImage(product) {
  return product?.productImages?.[0] || product?.image || "";
}

function percentOff(item) {
  const price = Number(item?.price) || 0;
  const sale = Number(item?.discountedPrice) || 0;
  const computed = price > 0 && sale > 0 && sale < price ? Math.round(((price - sale) / price) * 100) : 0;
  return Math.max(Number(item?.discountedPercent) || 0, computed);
}

export function productDiscount(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return Math.max(percentOff(product), ...variants.map(percentOff), 0);
}

export function baseGroupKey(product) {
  const baseName = String(product?.baseProductName || "").trim();
  if (baseName) {
    return `base:${String(product.baseProductId || baseName).trim().toLowerCase()}`;
  }
  const group = String(product?.varietyGroupId || "").trim();
  if (group) return `group:${group}`;
  return `product:${product?._id || ""}`;
}

/** Category → base products. Each group is one base product and the products under it. */
export function groupBaseProducts(products = []) {
  const groups = new Map();
  products.forEach((product) => {
    const key = baseGroupKey(product);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  return [...groups.values()]
    .map((items) => {
      const lead = items.find((item) => item.hotSelling) || items[0];
      const baseName = items.map((item) => String(item.baseProductName || "").trim()).find(Boolean);
      const baseImage = items.map((item) => String(item.baseProductImage || "").trim()).find(Boolean);
      return {
        id: baseGroupKey(lead),
        title: baseName || sharedTitle(items),
        count: items.length,
        countLabel: `${items.length} ${items.length === 1 ? "Product" : "Products"}`,
        image: baseImage || items.map(productImage).find(Boolean) || "",
        marked: items.some((item) => item.hotSelling || item.badge),
        discount: Math.max(0, ...items.map(productDiscount)),
        items,
      };
    })
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}
