import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLocation as useDeliveryLocation } from "../../context/LocationContext";
import { useSectionsQuery } from "../../hooks/queries/useSectionsQuery";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { sectionToStoreKey } from "../grocery/HomeMobileHeader";
import DesktopSearchBar from "./DesktopSearchBar";
import CategoryNavbar from "../layout/CategoryNavbar";

export const UPPER_BAR_H = 56;
export const MAIN_BAR_H = 46;
export const CATEGORY_TAB_H = 36;

function sectionLabel(sec) {
  const name = String(sec?.sectionName || "").trim();
  if (name) return name;
  const slug = (sec.slug || "").toLowerCase();
  if (slug === "greengrocc" || slug === "preorder" || slug === "main") return "PreOrder";
  if (slug === "ready2cook") return "Ready2Cook";
  if (slug === "supermall" || slug === "instantorder" || slug === "instant") return "InstantOrder";
  return "Section";
}

function sectionStoreKey(sec) {
  return sectionToStoreKey(sec?.slug || sec?.storeType);
}

function CartIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function MapPinIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

const upperProfileBtnClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.97]";

function TopNav() {
  const { user, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const { location, hasLocation } = useDeliveryLocation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: sections = [] } = useSectionsQuery();
  const chromeHidden = useScrollDirection();
  const [scrolled, setScrolled] = useState(false);

  const isProductListing = pathname === "/product";
  const showNavCategories = !isProductListing;

  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const displaySections = sections;

  const addressLine = hasLocation
    ? [location.area || location.label, location.city, location.pincode].filter(Boolean).join(", ") ||
      location.address ||
      "Delivery location"
    : "Select your delivery location";

  const setStore = (storeKey) => {
    const nextParams = new URLSearchParams(searchParams);
    if (storeKey === "main" || storeKey === "greengrocc") {
      nextParams.delete("store");
    } else {
      nextParams.set("store", storeKey);
    }
    nextParams.delete("categoryName");
    const search = nextParams.toString();
    navigate({ pathname: "/", search: search ? `?${search}` : "" });
  };

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const cartLabel = `My Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`;
  const compactChrome = chromeHidden && scrolled;
  const lowerHeight = compactChrome
    ? showNavCategories
      ? CATEGORY_TAB_H
      : 0
    : MAIN_BAR_H;
  const navOffset = UPPER_BAR_H + lowerHeight;

  useEffect(() => {
    document.documentElement.style.setProperty("--gg-nav-offset", `${navOffset}px`);
    return () => {
      document.documentElement.style.removeProperty("--gg-nav-offset");
    };
  }, [navOffset]);

  return (
    <header className="relative z-50 hidden lg:block">
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* One fixed shell — upper + main/categories fused, no gap */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Upper bar (Main Navbar) */}
        <div className="bg-white">
          <div
            className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 xl:px-8"
            style={{ height: UPPER_BAR_H }}
          >
            {/* Left corner: Logo (clean and properly sized) */}
            <div className="relative z-10 flex shrink-0 items-center">
              <Link to="/" className="flex shrink-0 items-center hover:opacity-90 transition-opacity">
                <img
                  src={LOGO_URL}
                  alt="GreenGrocc"
                  className="h-8 xl:h-9 max-h-9 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Exact Center: PreOrder, Ready2Cook, InstantOrder */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <nav
                className="pointer-events-auto flex items-center gap-1 rounded-full bg-gray-100/90 p-1"
                aria-label="Store sections"
              >
                {displaySections.map((sec) => {
                  const storeKey = sectionStoreKey(sec);
                  const label = sectionLabel(sec);
                  const isActive =
                    currentStore === storeKey ||
                    (currentStore === "main" && storeKey === "main") ||
                    (currentStore === "festive" && storeKey === "festive") ||
                    (currentStore === "mall" && storeKey === "mall");

                  return (
                    <button
                      key={sec._id || sec.slug || storeKey}
                      type="button"
                      onClick={() => setStore(storeKey)}
                      className={`relative shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold tracking-tight transition-all duration-200 ${
                        isActive
                          ? "bg-[#0C831F] text-white shadow-[0_1px_3px_rgba(12,131,31,0.35)]"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right corner: Search Bar + Cart Icon + Address Icon + Profile Icon */}
            <div className="relative z-10 flex shrink-0 items-center gap-2.5">
              <DesktopSearchBar />

              {/* 1. Cart Icon Only */}
              <Link
                to="/cart"
                data-cart-target="desktop"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-700 shadow-xs transition-all hover:border-[#0C831F]/40 hover:bg-[#0C831F]/5 hover:text-[#0C831F] active:scale-[0.96]"
                aria-label={cartLabel}
                title={cartLabel}
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0C831F] px-1 text-[9px] font-extrabold tabular-nums text-white shadow-xs">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>

              {/* 2. Address Icon (at the right of Cart) */}
              <Link
                to="/location"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-700 shadow-xs transition-all hover:border-[#0C831F]/40 hover:bg-[#0C831F]/5 hover:text-[#0C831F] active:scale-[0.96]"
                aria-label="Delivery location"
                title={`Delivery location: ${addressLine}`}
              >
                <MapPinIcon className="h-5 w-5" />
              </Link>

              {/* 3. Profile Icon (at right of Address icon) */}
              {user ? (
                <Link
                  to="/profile"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-700 shadow-xs transition-all hover:border-[#0C831F]/40 hover:bg-[#0C831F]/5 hover:text-[#0C831F] active:scale-[0.96]"
                  aria-label={`Profile (${user.name || "Account"})`}
                  title={`Account: ${user.name || "Profile"}`}
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-700 shadow-xs transition-all hover:border-[#0C831F]/40 hover:bg-[#0C831F]/5 hover:text-[#0C831F] active:scale-[0.96]"
                  aria-label="Login / Sign Up"
                  title="Login / Sign Up"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Attached lower chrome (Subnavbar) */}
        <div
          className={`relative transition-[height] duration-300 ease-out ${
            compactChrome ? "pointer-events-none" : ""
          }`}
          style={{ height: lowerHeight }}
        >
          {/* Expanded: full main bar, flat bottom, fused to upper (no black line) */}
          <div
            className={`absolute inset-x-0 top-0 bg-white transition-all duration-300 ease-out ${
              compactChrome
                ? "pointer-events-none invisible h-0 overflow-hidden opacity-0"
                : "h-full overflow-visible rounded-b-none opacity-100"
            }`}
          >
            <div
              className="mx-auto flex h-full max-w-[1400px] items-center justify-center px-5 xl:px-8"
              style={{ height: MAIN_BAR_H }}
            >
              {/* Exact Center of subnavbar: Categories */}
              {showNavCategories ? (
                <CategoryNavbar compact className="min-w-0 max-w-[880px] w-full" />
              ) : null}
            </div>
          </div>

          {/* Compact: clean category pill fused under upper — no side ears */}
          {showNavCategories ? (
            <div
              className={`absolute inset-x-0 top-0 flex justify-center transition-all duration-300 ease-out ${
                compactChrome
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <div
                className="relative flex w-fit max-w-[min(960px,94vw)] items-center rounded-b-2xl bg-white px-2.5 pb-1.5 pt-1"
                style={{ minHeight: CATEGORY_TAB_H }}
              >
                <CategoryNavbar compact />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Spacer always reserves full chrome height so content doesn't jump */}
      <div style={{ height: UPPER_BAR_H + MAIN_BAR_H }} aria-hidden="true" />
    </header>
  );
}

export default TopNav;
