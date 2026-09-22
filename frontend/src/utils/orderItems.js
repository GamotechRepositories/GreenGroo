/** Dedupe recent purchased products from order history (newest first). */
export function extractRecentOrderItems(orders, maxItems = 12) {
  const eligible = (orders || [])
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        order.status !== "attempted" &&
        order.status !== "return"
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const seen = new Set();
  const items = [];

  for (const order of eligible) {
    for (const item of order.items || []) {
      const productId = item.product?._id || item.product;
      if (!productId || seen.has(String(productId))) continue;
      seen.add(String(productId));
      items.push({
        ...item,
        productId: String(productId),
        image:
          item.image ||
          item.productImage ||
          item.product?.productImages?.[0] ||
          "",
      });
      if (items.length >= maxItems) return items;
    }
  }

  return items;
}

export function extractPurchasedProductIds(orders, maxItems = 12) {
  return extractRecentOrderItems(orders, maxItems).map((item) => item.productId);
}
