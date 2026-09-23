import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { buildProductSearchUrl } from "../../utils/productSearch";
import { resolveStoreTheme } from "./homeHeaderThemes";
import { useSectionsQuery } from "../../hooks/queries/useSectionsQuery";
import { LOGO_URL } from "../layout/Header";
import {
  sectionToStoreKey,
  storeToSection,
  buildStoreProductUrl,
} from "../../utils/storeSection";

export { sectionToStoreKey, storeToSection, buildStoreProductUrl };

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ProfileButton({ theme }) {
  const { user, openAuthModal } = useAuth();
  const className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme.profileClass} shadow-sm transition active:scale-95`;

  const icon = (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
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

function storeTabLabel(storeKey) {
  if (storeKey === "festive") return "Ready2Cook";
  if (storeKey === "mall") return "InstantOrder";
  return "PreOrder";
}

/**
 * Compact store pills — brand color when active, soft tint when idle.
 */
function StoreTab({ storeKey, isCurrentActive, onSelect, children }) {
  let idleClass = "bg-white/70 text-emerald-900/75";
  let activeClass = "bg-white text-[#0C831F] shadow-[0_1px_4px_rgba(12,131,31,0.18)] ring-1 ring-white";

  if (storeKey === "festive") {
    idleClass = "bg-[#FDE68A]/70 text-[#92400E]/85";
    activeClass =
      "bg-[#FACC15] text-[#422006] shadow-[0_1px_4px_rgba(202,138,4,0.28)] ring-1 ring-white";
  } else if (storeKey === "mall") {
    idleClass = "bg-[#93C5FD]/65 text-[#1E3A8A]/90";
    activeClass =
      "bg-[#3B82F6] text-white shadow-[0_1px_4px_rgba(37,99,235,0.3)] ring-1 ring-white";
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(storeKey)}
      className={`relative flex h-8 min-w-0 flex-1 items-center justify-center rounded-full px-2 text-center transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
        isCurrentActive ? `${activeClass} font-bold` : `${idleClass} font-semibold`
      }`}
    >
      {children}
    </button>
  );
}

/** Logo + profile + compact store tabs */
export function HomeDeliveryBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sections = [] } = useSectionsQuery();

  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const theme = resolveStoreTheme(currentStore);

  const setStore = (storeKey) => {
    const nextParams = new URLSearchParams(searchParams);
    const key = sectionToStoreKey(storeKey);
    if (key === "main") nextParams.delete("store");
    else nextParams.set("store", key);
    nextParams.delete("categoryName");
    setSearchParams(nextParams);
  };

  const displaySections = sections;

  return (
    <div className={`${theme.deliveryBg} px-3 pb-0 pt-1 transition-colors duration-300`}>
      <div className="flex items-center justify-between gap-2">
        <Link to="/" className="min-w-0 shrink leading-none">
          <img
            src={LOGO_URL}
            alt="GreenGroo"
            className="h-12 w-auto max-w-[200px] object-contain object-left"
          />
        </Link>
        <ProfileButton theme={theme} />
      </div>

      <div className="mt-2.5 flex w-full items-center gap-2">
        {displaySections.map((sec) => {
          const storeKey = sectionToStoreKey(sec.slug || sec.storeType);
          const isCurrentActive = currentStore === storeKey;
          const label = String(sec.sectionName || "").trim() || storeTabLabel(storeKey);

          return (
            <StoreTab
              key={sec._id || sec.slug || storeKey}
              storeKey={storeKey}
              isCurrentActive={isCurrentActive}
              onSelect={setStore}
            >
              <span className="truncate px-0.5 text-[11px] tracking-tight">{label}</span>
            </StoreTab>
          );
        })}
      </div>
    </div>
  );
}

/** Search + promo chip */
export function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
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
    <div className={`${theme.searchBg || theme.contentBg} px-3 pb-1.5 pt-2.5 transition-colors duration-300`}>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="flex h-9 items-center rounded-full border border-black/5 bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <SearchIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={theme.placeholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </form>

        <Link
          to="/coupons"
          className="flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-full border border-emerald-200/70 bg-white px-2.5 pl-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition active:scale-95"
        >
          <span className="text-[10px] font-black leading-tight text-[#047857]">
            Offers
            <span className="ml-0.5 text-amber-500">🎁</span>
          </span>
          <span className="flex h-6 min-w-[28px] items-center justify-center rounded-full bg-[#0C831F] px-1.5 text-[10px] font-black text-amber-300">
            50%
          </span>
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
      iconBg: "bg-amber-100 text-amber-900",
      title: "READY 2 COOK",
      subtitle: "Pre-washed & cut",
    },
    card2: {
      icon: "⏱️",
      iconBg: "bg-yellow-100 text-yellow-900",
      title: "10 MIN PREP",
      subtitle: "Save cooking time",
    },
    badges: ["100% Pre-washed", "Zero Preservatives", "Farm Fresh Daily"],
  },
  mall: {
    card1: {
      icon: "⚡",
      iconBg: "bg-blue-100 text-blue-900",
      title: "INSTANT",
      subtitle: "Delivered in minutes",
    },
    card2: {
      icon: "🛒",
      iconBg: "bg-sky-100 text-sky-900",
      title: "ESSENTIALS",
      subtitle: "Pantry & snacks",
    },
    badges: ["Fast delivery", "Everyday prices", "Trusted brands"],
  },
};

export function ZeptoPromoSection() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const theme = resolveStoreTheme(currentStore);
  const promo = STORE_PROMO_DATA[currentStore] || STORE_PROMO_DATA.main;

  return (
    <div className={`${theme.contentBg} px-4 pb-2.5 pt-1.5 transition-colors duration-300`}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white p-2.5 shadow-xs transition hover:scale-[1.01]">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${promo.card1.iconBg}`}
          >
            {promo.card1.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black leading-tight text-slate-900 sm:text-sm">{promo.card1.title}</p>
            <p className="mt-0.5 text-[10px] font-bold leading-none text-emerald-700">{promo.card1.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white p-2.5 shadow-xs transition hover:scale-[1.01]">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${promo.card2.iconBg}`}
          >
            {promo.card2.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black leading-tight text-slate-900 sm:text-sm">{promo.card2.title}</p>
            <p className="mt-0.5 text-[10px] font-bold leading-none text-amber-800">{promo.card2.subtitle}</p>
          </div>
        </div>
      </div>

      <div className={`mt-2 flex items-center justify-between px-1 text-[10px] font-bold ${theme.textColor}`}>
        {promo.badges.map((label) => (
          <div key={label} className="flex items-center gap-1">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-white">
              ✓
            </span>
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
