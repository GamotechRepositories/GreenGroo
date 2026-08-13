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

  let activeBgClass = theme.activeTabBg;
  if (isActive) {
    if (storeKey === "festive") activeBgClass = "bg-[#6D0000]";
    else if (storeKey === "mall") activeBgClass = "bg-[#3C22B4]";
    else if (storeKey === "cafe") activeBgClass = "bg-[#FFE3B3]";
    else if (storeKey === "main") activeBgClass = "bg-[#DCFCE7]";
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(storeKey)}
      className={`flex shrink-0 items-center justify-center transition-all duration-200 cursor-pointer ${
        isActive
          ? `${activeBgClass} h-12 min-w-[96px] rounded-t-[18px] rounded-b-none px-3.5 shadow-none border-t border-x border-transparent`
          : "bg-white h-11 min-w-[92px] rounded-[16px] px-3 shadow-sm border border-transparent mb-0.5 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
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
    <div className={`${theme.deliveryBg} px-4 pb-0 pt-3 transition-colors duration-300`}>
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

      <div className="mt-2.5 flex items-end gap-2 overflow-x-auto pb-0 hide-scrollbar">
        {/* GreenGrocc tab */}
        <StoreTab storeKey="main" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <img
            src="/greengrocc-logo.png"
            alt="GreenGrocc"
            className="h-6 w-auto max-w-[88px] object-contain"
          />
        </StoreTab>

        {/* Rakhi Store tab */}
        <StoreTab storeKey="festive" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <div className="text-center leading-none">
            <span className={`font-serif text-[15px] font-black tracking-tight ${
              currentStore === "festive" ? "text-[#FFF5E6]" : "text-[#A00C0C]"
            }`}>
              Rakhi
            </span>
            <span className={`mt-0.5 block text-[8px] font-bold tracking-wider uppercase ${
              currentStore === "festive" ? "text-red-200 opacity-90" : "text-[#A00C0C]/80"
            }`}>
              — Store —
            </span>
          </div>
        </StoreTab>

        {/* Super Mall tab */}
        <StoreTab storeKey="mall" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <div className="text-left leading-none">
            <span className={`block text-[13px] font-black ${
              currentStore === "mall" ? "text-white" : "text-slate-900"
            }`}>
              Super
            </span>
            <span className={`text-[13px] font-black ${
              currentStore === "mall" ? "text-white" : "text-[#2563EB]"
            }`}>
              Mall.
            </span>
          </div>
        </StoreTab>

        {/* Cafe tab */}
        <StoreTab storeKey="cafe" currentStore={currentStore} theme={theme} onSelect={setStore}>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[14px] font-black lowercase tracking-tight text-[#7C3AED]">
              cafe
            </span>
            <span className="mt-0.5 rounded-full bg-[#F97316] px-1.5 py-0.5 text-[8px] font-black leading-none text-white shadow-sm">
              From ₹39
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
    <div className={`${theme.contentBg} px-4 py-2 transition-colors duration-300`}>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="flex h-11 items-center rounded-[16px] bg-white px-3.5 shadow-sm border border-transparent">
            <SearchIcon className="mr-2.5 h-4 w-4 shrink-0 text-slate-700" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={theme.placeholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </form>

        <Link
          to="/coupons"
          className="flex h-11 shrink-0 items-center justify-between gap-1.5 overflow-hidden rounded-[14px] bg-white px-2 py-1 shadow-sm border border-gray-100 transition hover:bg-gray-50 max-w-[130px]"
        >
          <div className="leading-tight text-left">
            <p className="text-[10px] font-black text-[#047857]">Hariyali</p>
            <p className="text-[10px] font-black text-[#047857]">Teej</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 p-0.5 overflow-hidden">
            <img src="/festive-store-logo.png" onError={(e) => { e.currentTarget.style.display='none'; }} alt="" className="h-7 w-7 object-contain" />
          </div>
        </Link>
      </div>
    </div>
  );
}

/** Dual promo cards + fee badges */
export function ZeptoPromoSection() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);
  const accent = currentStore === "festive" ? "text-[#910C0C]" : currentStore === "mall" ? "text-[#5B21B6]" : "text-[#C2410C]";
  const iconBg = currentStore === "festive" ? "bg-red-100 text-[#910C0C]" : currentStore === "mall" ? "bg-violet-100 text-[#5B21B6]" : "bg-orange-100 text-[#C2410C]";

  return (
    <div className={`${theme.contentBg} px-4 pb-3 pt-1 transition-colors duration-300`}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white p-3 shadow-sm">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4v14a2 2 0 002 2h12a2 2 0 002-2V6h-4zm-6-2h4v2h-4V4z" />
            </svg>
          </div>
          <p className={`text-base font-black leading-tight tracking-tight ${accent}`}>₹0 FEES</p>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white p-3 shadow-sm">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
            </svg>
          </div>
          <p className={`text-[11px] font-black uppercase leading-tight tracking-tight ${accent}`}>Everyday Low Prices</p>
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between px-1 text-[10px] font-bold ${theme.textColor}`}>
        {["₹0 Handling Fee", "₹0 Delivery Fee*", "₹0 Rain & Surge Fee"].map((label) => (
          <div key={label} className="flex items-center gap-1">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-white">✓</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <p className={`mt-1 text-center text-[8px] font-medium ${currentStore === "main" || currentStore === "cafe" ? "text-slate-500" : "text-white/80"}`}>
        *T&amp;C Apply. Above specific minimum order value
      </p>

      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-[#FFF5BE] px-4 py-2 text-center shadow-sm">
        <span className="text-xs">🪙</span>
        <span className="text-[11px] font-black uppercase tracking-wide text-[#7C2D12]">Special Prices For Your 1st Order</span>
        <span className="text-xs">🪙</span>
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
