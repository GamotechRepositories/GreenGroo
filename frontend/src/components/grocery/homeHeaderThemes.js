/** Zepto-style store themes for mobile home header matching reference screenshots */
export const STORE_KEYS = ["main", "festive", "mall"];

export const STORE_THEMES = {
  main: {
    key: "main",
    time: "10 minutes",
    deliveryBg: "bg-[#F4FBF7]",
    contentBg: "bg-[#C6F6D5]",
    textColor: "text-emerald-950",
    subTextColor: "text-emerald-900",
    profileClass: "bg-[#0C831F] text-white border-0",
    activeTabBg: "bg-[#C6F6D5]",
    activeTabBorder: "border-emerald-400/70",
    inactiveTabClass: "bg-white text-slate-900 shadow-xs border border-slate-200/90",
    searchBorder: "border-transparent",
    placeholder: 'Search for "Fruits", "Vegetables"...',
    categoryBorder: "border-emerald-900/15",
    categoryText: "text-emerald-950",
    categoryInactive: "text-emerald-900/70",
    categoryIndicator: "bg-[#0C831F]",
  },
  festive: {
    key: "festive",
    time: "15 minutes",
    deliveryBg: "bg-[#FFF9F2]",
    contentBg: "bg-[#FFE0B2]",
    textColor: "text-[#7C2D12]",
    subTextColor: "text-[#9A3412]",
    profileClass: "bg-[#EA580C] text-white border-0",
    activeTabBg: "bg-[#FFE0B2]",
    activeTabBorder: "border-orange-300/80",
    inactiveTabClass: "bg-white text-slate-900 shadow-xs border border-slate-200/90",
    searchBorder: "border-transparent",
    placeholder: 'Search for "Ready2Cook"',
    categoryBorder: "border-orange-900/15",
    categoryText: "text-[#7C2D12]",
    categoryInactive: "text-[#9A3412]/70",
    categoryIndicator: "bg-[#EA580C]",
  },
  mall: {
    key: "mall",
    time: "15 minutes",
    deliveryBg: "bg-black",
    contentBg: "bg-[#3C22B4]",
    textColor: "text-white",
    subTextColor: "text-slate-200",
    profileClass: "bg-black border border-white/40 text-white",
    activeTabBg: "bg-[#3C22B4]",
    activeTabBorder: "border-violet-400/40",
    inactiveTabClass: "bg-white text-slate-900 shadow-sm border border-transparent",
    searchBorder: "border-transparent",
    placeholder: 'Search for "Ready2Cook"',
    categoryBorder: "border-white/20",
    categoryText: "text-white",
    categoryInactive: "text-white/75",
    categoryIndicator: "bg-amber-300",
  },
};

export function resolveStoreTheme(storeKey) {
  return STORE_THEMES[storeKey] || STORE_THEMES.main;
}
