import { Link } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLocation } from "../../context/LocationContext";
import { useNearestStore } from "../../hooks/useNearestStore";
import UserAccountDropdown from "../account/UserAccountDropdown";
import DesktopSearchBar from "./DesktopSearchBar";

function TopNav() {
  const { user, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const { location, hasLocation } = useLocation();
  const { data: nearest } = useNearestStore();

  const addressLine = hasLocation
    ? [location.area || location.label, location.city, location.pincode].filter(Boolean).join(", ")
    : "Select your delivery location";
  const storeName = nearest?.store?.storeName;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden border-b border-gray-100 bg-white lg:block">
      <div className="mx-auto flex h-[76px] max-w-[1400px] items-center gap-4 px-5 xl:gap-6 xl:px-8">
        {/* Logo */}
        <Link to="/" className="flex h-full shrink-0 items-center pr-4 xl:pr-5 transition-transform hover:scale-[1.02]">
          <img
            src={LOGO_URL}
            alt="GreenGrocc"
            className="h-16 w-auto object-contain xl:h-[72px]"
          />
        </Link>

        <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden="true" />

        {/* Delivery location */}
        <Link
          to="/location"
          className="group flex min-w-0 max-w-[220px] shrink-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 xl:max-w-[260px]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors group-hover:bg-[#0C831F]/10 group-hover:text-[#0C831F]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="text-[14px] font-bold leading-tight text-gray-900">
              Delivery in 15 mins
            </p>
            <span className="mt-0.5 flex min-w-0 items-center gap-1">
              <span className="truncate text-[12px] font-medium text-gray-500 group-hover:text-gray-700">
                {addressLine}
              </span>
              <svg
                className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform group-hover:translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </Link>

        {/* Search */}
        <DesktopSearchBar className="mx-2 min-w-0 flex-1" />

        {/* Login / Account */}
        <div className="flex shrink-0 items-center gap-4 xl:gap-5">
          {user ? (
            <UserAccountDropdown user={user} />
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="text-[15px] font-semibold text-gray-600 transition-colors hover:text-gray-900"
            >
              Login
            </button>
          )}

          {/* My Cart */}
          <Link
            to="/cart"
            data-cart-target="desktop"
            className="inline-flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-r from-[#0C831F] to-[#0A6C19] px-4 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            aria-label={`My Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <div className="relative flex items-center justify-center">
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-[#0C831F] shadow-sm ring-2 ring-[#0A6C19]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col items-start leading-none ml-1">
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">My Cart</span>
              <span className="text-[14px] font-bold tracking-wide mt-0.5">
                {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''}` : "Empty"}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
