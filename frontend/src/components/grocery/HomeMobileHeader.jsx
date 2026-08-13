import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { buildProductSearchUrl } from "../../utils/productSearch";
import { resolveStoreTheme } from "./homeHeaderThemes";

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function LightningIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function ProfileButton({ theme }) {
  const { user, openAuthModal } = useAuth();
  const className = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.profileClass} shadow-sm transition active:scale-95`;

  const icon = (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  if (user) {
    return (
      <Link to="/profile" className={className} aria-label="Profile">
        {icon}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => openAuthModal("login")} className={className} aria-label="Login">
      {icon}
    </button>
  );
}

function StoreTab({ storeKey, currentStore, theme, onSelect, children }) {
  const isActive = storeKey === currentStore;
  const activeBgClass = theme.activeTabBg;

  let activeBgHex = "#C6F6D5";
  if (storeKey === "festive") activeBgHex = "#FFE0B2";
  else if (storeKey === "mall") activeBgHex = "#3C22B4";
  else if (storeKey === "main") activeBgHex = "#C6F6D5";

  return (
    <div className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => onSelect(storeKey)}
        className={`relative w-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isActive
            ? `${activeBgClass} h-[60px] rounded-t-[20px] rounded-b-none px-2 z-10`
            : "bg-white h-[54px] rounded-[18px] px-3 border border-black/10 mb-1 hover:bg-gray-50 z-0"
        }`}
      >
        {children}
      </button>

      {isActive && (
        <>
          {/* Bottom-left concave fillet curve */}
          <span
            className="absolute -left-[10px] bottom-0 h-[10px] w-[10px] z-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 0 0, transparent 10px, ${activeBgHex} 10.5px)`,
            }}
          />
          {/* Bottom-right concave fillet curve */}
          <span
            className="absolute -right-[10px] bottom-0 h-[10px] w-[10px] z-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 100% 0, transparent 10px, ${activeBgHex} 10.5px)`,
            }}
          />
        </>
      )}
    </div>
  );
}

/** Delivery row + store tabs — scrolls away */
export function HomeDeliveryBar() {
  const { location } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  const setStore = (storeKey) => {
    const nextParams = new URLSearchParams(searchParams);
    if (storeKey === "main") {
      nextParams.delete("store");
    } else {
      nextParams.set("store", storeKey);
    }
    setSearchParams(nextParams);
  };

  const addressText = [location.label, location.address].filter(Boolean).join(" - ");

  return (
    <div className={`${theme.deliveryBg} px-4 pb-0 pt-3.5 transition-colors duration-300`}>
      <div className="flex items-center justify-between gap-3">
        <Link to="/location" className="min-w-0 flex-1">
          <div className={`flex items-center gap-1.5 ${theme.textColor}`}>
            <LightningIcon className="h-5 w-5 shrink-0" />
            <span className="text-[19px] font-black leading-none tracking-tight">
              {theme.time || "15 minutes"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className={`max-w-[230px] sm:max-w-[320px] truncate text-[11px] font-semibold leading-tight ${theme.subTextColor}`}>
              {addressText || "Hinjawadi Phase II - Gera, 3, Hinjawadi P..."}
            </span>
            <svg className={`h-3 w-3 shrink-0 ${theme.subTextColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Link>
        <ProfileButton theme={theme} />
      </div>

      <div className="mt-3 flex items-end gap-2.5 w-full pb-0">
        {/* GreenGrocc tab */}
        <StoreTab storeKey="main" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <img
            src="/greengrocc-logo.png"
            alt="GreenGrocc"
            className="h-10 w-auto max-w-[135px] object-contain mx-auto"
          />
        </StoreTab>

        {/* Ready2Cook tab */}
        <StoreTab storeKey="festive" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <div className="text-center leading-none">
            <span className={`text-[15px] sm:text-[16px] font-black tracking-tight ${
              currentStore === "festive" ? "text-[#7C2D12]" : "text-[#EA580C]"
            }`}>
              Ready2Cook
            </span>
          </div>
        </StoreTab>

        {/* Super Mall tab */}
        <StoreTab storeKey="mall" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <div className="text-left leading-[1.1]">
            <span className={`block text-[14px] sm:text-[15px] font-black ${
              currentStore === "mall" ? "text-white" : "text-slate-900"
            }`}>
              Super
            </span>
            <span className={`block text-[14px] sm:text-[15px] font-black ${
              currentStore === "mall" ? "text-white" : "text-[#2563EB]"
            }`}>
              Mall.
            </span>
          </div>
        </StoreTab>
      </div>
    </div>
  );
}

/** Search + promo chip */
export function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate("/product");
      return;
    }
    navigate(buildProductSearchUrl(trimmed));
  };

  return (
    <div className={`${theme.contentBg} px-4 py-2.5 transition-colors duration-300`}>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="flex h-12 items-center rounded-[18px] bg-white px-4 shadow-sm border border-transparent">
            <SearchIcon className="mr-2.5 h-4 w-4 shrink-0 text-slate-700" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={theme.placeholder}
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </form>

        <Link
          to="/coupons"
          className="flex h-12 shrink-0 items-center justify-between gap-1.5 overflow-hidden rounded-[16px] bg-white px-2.5 py-1 shadow-sm border border-gray-100 transition hover:bg-gray-50 max-w-[140px]"
        >
          <div className="leading-tight text-left">
            <p className="text-[11px] font-black text-[#047857]">Hariyali</p>
            <p className="text-[11px] font-black text-[#047857]">Teej</p>
          </div>
          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-amber-50 p-0.5 overflow-hidden">
            <img src="/festive-store-logo.png" onError={(e) => { e.currentTarget.style.display='none'; }} alt="" className="h-7 w-7 object-contain" />
          </div>
        </Link>
      </div>
    </div>
  );
}

const STORE_PROMO_DATA = {
  main: {
    card1: {
      icon: "⚡",
      iconBg: "bg-emerald-100 text-emerald-800",
      title: "₹0 FEES",
      subtitle: "Free Delivery",
    },
    card2: {
      icon: "🏷️",
      iconBg: "bg-amber-100 text-amber-900",
      title: "Everyday Low Prices",
      subtitle: "Best Savings",
    },
    badges: ["₹0 Handling Fee", "₹0 Delivery Fee*", "₹0 Rain & Surge Fee"],
  },
  festive: {
    card1: {
      icon: "🍳",
      iconBg: "bg-orange-100 text-orange-900",
      title: "READY 2 COOK",
      subtitle: "Pre-Washed & Cut",
    },
    card2: {
      icon: "⏱️",
      iconBg: "bg-amber-100 text-amber-900",
      title: "10 MIN PREP",
      subtitle: "Save Cooking Time",
    },
    badges: ["100% Pre-Washed", "Zero Preservatives", "Farm Fresh Daily"],
  },
  mall: {
    card1: {
      icon: "🛍️",
      iconBg: "bg-violet-100 text-violet-900",
      title: "SUPER MALL",
      subtitle: "Top Brand Offers",
    },
    card2: {
      icon: "⚡",
      iconBg: "bg-purple-100 text-purple-900",
      title: "EXPRESS DELIVERY",
      subtitle: "Fastest Shipping",
    },
    badges: ["100% Genuine", "Easy Returns", "Best Brand Deals"],
  },
};

export function ZeptoPromoSection() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);
  const promo = STORE_PROMO_DATA[currentStore] || STORE_PROMO_DATA.main;

  return (
    <div className={`${theme.contentBg} px-4 pb-2.5 pt-1.5 transition-colors duration-300`}>
      <div className="grid grid-cols-2 gap-2.5">
        {/* Banner 1 */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white p-2.5 shadow-xs transition hover:scale-[1.01]">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${promo.card1.iconBg}`}>
            {promo.card1.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {promo.card1.title}
            </p>
            <p className="text-[10px] font-bold text-emerald-700 leading-none mt-0.5">
              {promo.card1.subtitle}
            </p>
          </div>
        </div>

        {/* Banner 2 */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white p-2.5 shadow-xs transition hover:scale-[1.01]">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${promo.card2.iconBg}`}>
            {promo.card2.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {promo.card2.title}
            </p>
            <p className="text-[10px] font-bold text-amber-800 leading-none mt-0.5">
              {promo.card2.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className={`mt-2 flex items-center justify-between px-1 text-[10px] font-bold ${theme.textColor}`}>
        {promo.badges.map((label) => (
          <div key={label} className="flex items-center gap-1">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-white">✓</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeMobileHeader() {
  return (
    <div>
      <HomeDeliveryBar />
      <HomeSearchBar />
    </div>
  );
}

export default HomeMobileHeader;
