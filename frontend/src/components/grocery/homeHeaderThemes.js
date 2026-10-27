/** Store themes for mobile home header — light solid colors (no gradients) */
export const STORE_KEYS = ["main", "festive", "mall"];

export const STORE_THEMES = {
  main: {
    key: "main",
    time: "10 minutes",
    label: "Preorder",
    deliveryBg: "bg-white",
    searchBg: "bg-white",
    categoryBg: "bg-white",
    bannerBg: "bg-white",
    contentBg: "bg-white",
    textColor: "text-emerald-950",
    subTextColor: "text-emerald-800/75",
    profileClass: "bg-[#0C831F] text-white border border-emerald-700/20",
    activeTabBg: "bg-[#0C831F]",
    activeTabBorder: "border-emerald-300",
    inactiveTabClass: "bg-white text-slate-900 shadow-xs border border-slate-200/90",
    searchBorder: "border-transparent",
    placeholder: 'Search for "Fruits", "Vegetables"...',
    categoryBorder: "border-emerald-900/10",
    categoryText: "text-emerald-950",
    categoryInactive: "text-emerald-900/65",
    categoryIndicator: "bg-[#0C831F]",
    accent: "#0C831F",
  },
  /** Ready2Cook — light yellow */
  festive: {
    key: "festive",
    time: "15 minutes",
    label: "Ready2Cook",
    deliveryBg: "bg-[#FFF8DB]",
    searchBg: "bg-[#FFF8DB]",
    categoryBg: "bg-[#FFF8DB]",
    bannerBg: "bg-white",
    contentBg: "bg-[#FFF8DB]",
    textColor: "text-amber-950",
    subTextColor: "text-amber-900/70",
    profileClass: "bg-[#CA8A04] text-white border border-amber-700/20",
    activeTabBg: "bg-[#EAB308]",
    activeTabBorder: "border-amber-300",
    inactiveTabClass: "bg-white text-slate-900 shadow-xs border border-slate-200/90",
    searchBorder: "border-transparent",
    placeholder: 'Search "Chopped", "Mixes", "Herbs"...',
    categoryBorder: "border-amber-900/10",
    categoryText: "text-[#713F12]",
    categoryInactive: "text-[#92400E]/70",
    categoryIndicator: "bg-[#CA8A04]",
    accent: "#EAB308",
  },
};

/** Instant Order uses the Pre-order look. */
STORE_THEMES.mall = { ...STORE_THEMES.main, key: "mall", label: "Instant" };

export function resolveStoreTheme(storeKey) {
  return STORE_THEMES[storeKey] || STORE_THEMES.main;
}
