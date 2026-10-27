/** Storefront sections, in display order; keys match the catalog product's `section`. */
export const CATALOG_SECTIONS = [
  { key: "preorder", name: "Pre-order" },
  { key: "ready2cook", name: "Ready2Cook" },
  { key: "instantorder", name: "Instant Order" },
];

export const catalogSectionName = (key) => CATALOG_SECTIONS.find((s) => s.key === key)?.name || key || "Other";

export const catalogSectionRank = (key) => {
  const index = CATALOG_SECTIONS.findIndex((s) => s.key === key);
  return index < 0 ? CATALOG_SECTIONS.length : index;
};

/** Consecutive products with the same section, as `[{ section, items }]`. */
export function groupBySection(products) {
  return products.reduce((acc, p) => {
    const last = acc[acc.length - 1];
    if (last && last.section === p.section) last.items.push(p);
    else acc.push({ section: p.section, items: [p] });
    return acc;
  }, []);
}
