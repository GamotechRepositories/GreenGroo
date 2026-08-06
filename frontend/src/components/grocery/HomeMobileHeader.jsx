import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { buildProductSearchUrl } from "../../utils/productSearch";

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ListIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function BookmarkIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

/** Delivery row — scrolls away */
export function HomeDeliveryBar() {
  const { location } = useLocation();
  const { user, openAuthModal } = useAuth();

  return (
    <div className="flex items-start justify-between gap-3 bg-white px-4 pb-2 pt-3">
      <Link to="/location" className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-text-primary">Delivery in 15 mins</p>
        <div className="mt-0.5 flex items-center gap-0.5">
          <p className="truncate text-xs font-medium text-text-secondary">
            {location.label.toUpperCase()} — {location.address}
          </p>
          <svg className="h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-xs font-bold text-text-primary"
          aria-label="Wallet balance"
        >
          <svg className="h-4 w-4 text-[#07875f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
          </svg>
          ₹0
        </button>

        {user ? (
          <Link
            to="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-text-primary shadow-sm"
            aria-label="Profile"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-text-primary shadow-sm"
            aria-label="Login"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/** Search + bookmark — part of sticky block */
export function HomeSearchBar() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
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
    <div className="flex items-center gap-2.5 bg-white px-4 pb-3 pt-1">
      <form onSubmit={handleSearch} className="min-w-0 flex-1">
        <div className="flex h-11 items-center rounded-full border border-[#d7dbe3] bg-white pl-4 pr-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for fruits, vegetables..."
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-[#9aa0a6] focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[#5c6670]"
            aria-label="Search"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-[#d7dbe3]" aria-hidden="true" />
          <Link
            to="/orders"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openAuthModal("login");
              }
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[#5c6670]"
            aria-label="Orders"
          >
            <ListIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </form>

      <Link
        to="/wishlist"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-white text-[#1a1a1a]"
        aria-label="Wishlist"
      >
        <BookmarkIcon />
      </Link>
    </div>
  );
}

function HomeMobileHeader() {
  return (
    <div className="bg-white text-text-primary">
      <HomeDeliveryBar />
      <HomeSearchBar />
    </div>
  );
}

export default HomeMobileHeader;
