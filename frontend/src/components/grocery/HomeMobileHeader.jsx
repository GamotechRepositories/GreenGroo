import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { buildProductSearchUrl } from "../../utils/productSearch";

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

/** Delivery row + store pills — scrolls away */
export function HomeDeliveryBar() {
  const { location } = useLocation();
  const { user, openAuthModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  const setStore = (storeKey) => {
    const nextParams = new URLSearchParams(searchParams);
    if (storeKey === "main") {
      nextParams.delete("store");
    } else {
      nextParams.set("store", storeKey);
    }
    setSearchParams(nextParams);
  };

  const addressText = [location.label, location.address]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="bg-[#FFE5D0] pt-3.5 px-4 pb-0">
      {/* Top row: Delivery Speed + Address & Profile */}
      <div className="flex items-start justify-between gap-3">
        <Link to="/location" className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-slate-950">
            <span className="text-xl">⚡</span>
            <span className="text-xl font-black tracking-tight leading-none text-slate-950">
              6 minutes
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="truncate text-[11px] font-semibold text-slate-800 max-w-[240px]">
              {addressText || "Mumbai Central - Mumbai Central, Mum..."}
            </span>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-slate-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Link>

        {/* Profile Avatar Button */}
        {user ? (
          <Link
            to="/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition active:scale-95"
            aria-label="Profile"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition active:scale-95"
            aria-label="Login"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Store / Category Pills Row (Zepto Store Switcher with curved tab background line) */}
      <div className="mt-3 flex items-end gap-2.5 overflow-x-auto pb-0 hide-scrollbar">
        {/* 1st Tab: GreenGrocc Logo */}
        <button
          type="button"
          onClick={() => setStore("main")}
          className={`flex shrink-0 items-center justify-center transition-all ${
            currentStore === "main"
              ? "bg-[#FFF3E0] rounded-t-2xl px-5 pt-2.5 pb-2 shadow-sm border-t border-x border-orange-200/80 min-w-[110px]"
              : "bg-white rounded-2xl px-4 py-2 shadow-sm border border-orange-100/80 min-w-[100px]"
          }`}
        >
          <img
            src="/greengrocc-logo.png"
            alt="GreenGrocc"
            className="h-7 w-auto object-contain max-w-[120px]"
          />
        </button>

        {/* 2nd Tab: Festive Store */}
        <button
          type="button"
          onClick={() => setStore("festive")}
          className={`flex shrink-0 items-center gap-1.5 transition-all ${
            currentStore === "festive"
              ? "bg-[#FFF3E0] rounded-t-2xl px-5 pt-2.5 pb-2 shadow-sm border-t border-x border-orange-200/80 text-[#B91C1C]"
              : "bg-white rounded-2xl px-4 py-2 shadow-sm border border-orange-100/80 text-[#B91C1C]"
          }`}
        >
          <span className="text-sm">✨</span>
          <span className="font-serif tracking-tight font-extrabold text-xs">Festive Store</span>
        </button>

        {/* 3rd Tab: Fresh Produce */}
        <button
          type="button"
          onClick={() => setStore("fresh")}
          className={`flex shrink-0 items-center gap-1.5 transition-all ${
            currentStore === "fresh"
              ? "bg-[#FFF3E0] rounded-t-2xl px-5 pt-2.5 pb-2 shadow-sm border-t border-x border-orange-200/80 text-[#065F46]"
              : "bg-white rounded-2xl px-4 py-2 shadow-sm border border-orange-100/80 text-[#047857]"
          }`}
        >
          <span className="text-sm">🌿</span>
          <span className="font-sans font-black tracking-tight text-xs">Fresh Produce</span>
        </button>
      </div>
    </div>
  );
}

/** Search + Side Deal Chip */
export function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

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
    <div className="bg-[#FFF3E0] px-4 py-2">
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="flex h-11 items-center rounded-2xl border border-orange-200/80 bg-white px-3.5 shadow-sm">
            <SearchIcon className="mr-2.5 h-4 w-4 shrink-0 text-slate-700" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search for "Milk"'
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Side Deal Banner Card */}
        <Link
          to="/coupons"
          className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-orange-200/80 bg-white px-2.5 py-1.5 shadow-sm overflow-hidden"
        >
          <div className="text-right">
            <p className="text-[10px] font-black text-emerald-700 leading-tight">Hariyali Teej</p>
            <p className="text-[8px] font-bold text-slate-500">Deals &amp; Offers</p>
          </div>
          <span className="text-sm">🪔</span>
        </Link>
      </div>
    </div>
  );
}

/** Dual Promo Cards + Badges + Deal Strip (Zepto style) */
export function ZeptoPromoSection() {
  return (
    <div className="bg-[#FFF3E0] px-4 pt-2 pb-3">
      {/* Side by side 2 Promo Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Left Card: ₹0 FEES */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-orange-200/80 bg-white p-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#C2410C]">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4v14a2 2 0 002 2h12a2 2 0 002-2V6h-4zm-6-2h4v2h-4V4z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-black text-[#C2410C] leading-tight tracking-tight">₹0 FEES</p>
          </div>
        </div>

        {/* Right Card: EVERYDAY LOW PRICES */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-orange-200/80 bg-white p-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#C2410C]">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-black text-[#C2410C] leading-tight tracking-tight uppercase">
              EVERYDAY LOW PRICES
            </p>
          </div>
        </div>
      </div>

      {/* 3 Fee Checkmark Badges */}
      <div className="mt-3 flex items-center justify-between px-1 text-[10px] font-bold text-[#C2410C]">
        <div className="flex items-center gap-1">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-black">
            ✓
          </span>
          <span>₹0 Handling Fee</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-black">
            ✓
          </span>
          <span>₹0 Delivery Fee*</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-black">
            ✓
          </span>
          <span>₹0 Rain &amp; Surge Fee</span>
        </div>
      </div>

      {/* T&C Disclaimer */}
      <p className="mt-1 text-center text-[8px] font-medium text-slate-500">
        *T&amp;C Apply. Above specific minimum order value
      </p>

      {/* Yellow Special Prices Strip */}
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-[#FFF5BE] px-4 py-2 text-center shadow-sm">
        <span className="text-xs">🪙</span>
        <span className="text-[11px] font-black tracking-wide text-[#7C2D12] uppercase">
          SPECIAL PRICES FOR YOUR 1ST ORDER
        </span>
        <span className="text-xs">🪙</span>
      </div>
    </div>
  );
}

function HomeMobileHeader() {
  return (
    <div className="bg-[#FFF3E0] text-slate-900">
      <HomeDeliveryBar />
      <HomeSearchBar />
    </div>
  );
}

export default HomeMobileHeader;



