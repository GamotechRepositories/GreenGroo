import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../../config/contact";
import { buildProductSearchUrl } from "../../utils/productSearch";

export const LOGO_URL =
  "https://res.cloudinary.com/dsafvwkrf/image/upload/v1780561447/Bulkmobilemart_logo_2-removebg-preview_wcso0k.png";

function SearchIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SearchBar({ className = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(buildProductSearchUrl(trimmed));
  };

  return (
    <form
      className={`flex items-stretch bg-gray-100 border border-gray-300 rounded-md overflow-hidden h-8 md:h-9 ${className}`}
      onSubmit={handleSubmit}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for smartphones, tablets, accessories..."
        className="flex-1 bg-transparent text-gray-700 text-xs px-3 placeholder:text-gray-400 focus:outline-none min-w-0"
      />
      <button
        type="submit"
        aria-label="Search"
        className="w-9 shrink-0 flex items-center justify-center border-l border-gray-300 text-accent hover:bg-gray-200 transition"
      >
        <SearchIcon />
      </button>
    </form>
  );
}

function UtilityIcons({ user, onLoginClick }) {
  const { cartCount } = useCart();

  const handleCartClick = (e) => {
    if (!user) {
      e.preventDefault();
      onLoginClick();
    }
  };
  return (
    <div className="flex items-center shrink-0 justify-end">
      <div className="hidden xl:flex items-center gap-2 pr-4 mr-4 border-r border-gray-200 text-gray-800">
        <svg className="w-4 h-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <div className="text-[11px] leading-snug">
          <a href={CONTACT_PHONE_TEL} className="font-semibold hover:text-accent transition whitespace-nowrap">
            {CONTACT_PHONE_DISPLAY}
          </a>
          <p className="text-gray-500">Mon - Sat: 10:00 AM - 7:00 PM</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onLoginClick}
        className="flex flex-col items-center justify-center gap-1 px-3 lg:px-4 text-gray-700 hover:text-accent transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <span className="text-[10px] font-medium whitespace-nowrap">
          {user ? user.name.split(" ")[0] : "Login / Sign Up"}
        </span>
      </button>

      <div className="w-px h-9 bg-gray-200 mx-1 lg:mx-2" aria-hidden="true" />

      <Link
        to="/cart"
        onClick={handleCartClick}
        className="flex flex-col items-center justify-center gap-1 px-3 lg:px-4 text-gray-700 hover:text-accent transition"
      >
        <span className="relative inline-flex">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {user && (
            <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] px-0.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white leading-none">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </span>
        <span className="text-[10px] font-medium">My Cart</span>
      </Link>
    </div>
  );
}

function Header({ user, onLoginClick, onMenuToggle, menuOpen }) {
  return (
    <div className="bg-light-bg border-b border-gray-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
        {/* Mobile: logo + menu */}
        <div className="flex md:hidden items-center justify-between gap-3 min-w-0">
          <Link to="/" className="flex items-center shrink-0 min-w-0 max-w-[75%]">
            <img
              src={LOGO_URL}
              alt="BulkMobileMart.in - Smart Choice, Best Price"
              className="h-9 w-auto max-w-full object-contain object-left hover:opacity-90 transition"
            />
          </Link>
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-accent hover:text-accent transition shrink-0"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Desktop: logo | search | utilities */}
        <div className="hidden md:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 lg:gap-8">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={LOGO_URL}
              alt="BulkMobileMart.in - Smart Choice, Best Price"
              className="h-10 lg:h-12 w-auto object-contain object-left hover:opacity-90 transition"
            />
          </Link>

          <div className="flex justify-center min-w-0 px-2 lg:px-6">
            <SearchBar className="w-full max-w-md lg:max-w-xl" />
          </div>

          <UtilityIcons user={user} onLoginClick={onLoginClick} />
        </div>
      </div>

      <div className="md:hidden px-4 pb-3 bg-light-bg">
        <SearchBar className="w-full" />
      </div>
    </div>
  );
}

export default Header;
