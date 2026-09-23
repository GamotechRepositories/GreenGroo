/**
 * Canonical store keys used in URL `?store=` params.
 * Maps any section slug / storeType / alias → main | festive | mall.
 */
export function sectionToStoreKey(slugOrStore) {
  const key = String(slugOrStore || "")
    .toLowerCase()
    .trim();
  if (!key || key === "main" || key === "greengrocc" || key === "preorder") {
    return "main";
  }
  if (key === "festive" || key === "ready2cook" || key === "ready-2-cook") {
    return "festive";
  }
  if (
    key === "mall" ||
    key === "supermall" ||
    key === "instant" ||
    key === "instantorder" ||
    key === "instantorders"
  ) {
    return "mall";
  }
  return key;
}

/**
 * Maps a UI store key (or raw slug) to the categories API `section` query value.
 * Backend accepts greengrocc/preorder and supermall/instantorder as aliases.
 */
export function storeToSection(storeOrSlug) {
  const store = sectionToStoreKey(storeOrSlug);
  if (store === "festive") return "ready2cook";
  if (store === "mall") return "supermall";
  return "greengrocc";
}

/** Build `/product?...` URL preserving section context. */
export function buildStoreProductUrl({
  categoryName = "",
  store = "",
  extraParams = {},
} = {}) {
  const params = new URLSearchParams();
  const storeKey = sectionToStoreKey(store);
  if (categoryName && categoryName !== "All") {
    params.set("categoryName", categoryName);
  }
  if (storeKey && storeKey !== "main") {
    params.set("store", storeKey);
  }
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value != null && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `/product?${qs}` : "/product";
}
