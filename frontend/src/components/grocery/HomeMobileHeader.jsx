import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { buildProductSearchUrl } from "../../utils/productSearch";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import CategoryIcon from "./CategoryIcon";

function HomeMobileHeader() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { user, openAuthModal } = useAuth();
  const { data: apiCategories = [] } = useCategoriesQuery();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const filtered = apiCategories.filter(
      (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
    );
    if (!filtered.length) {
      return [
        { name: "All", slug: "" },
        { name: "Fruits", slug: "Fruits" },
        { name: "Vegetables", slug: "Vegetables" },
        { name: "Organic", slug: "Organic" },
        { name: "Dairy", slug: "Dairy" },
      ];
    }
    return [
      { name: "All", slug: "" },
      ...filtered.slice(0, 8).map((cat) => ({
        name: cat.categoryName,
        slug: cat.categoryName,
        image: cat.categoryImage,
      })),
    ];
  }, [apiCategories]);

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
    <div className="border-b border-border-light bg-white text-text-primary">
      {/* Top row — delivery + wallet + profile */}
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
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
            className="flex items-center gap-1.5 rounded-lg border border-border-light bg-mobile-surface px-2.5 py-1.5 text-xs font-bold text-text-primary"
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mobile-surface text-text-primary"
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mobile-surface text-text-primary"
              aria-label="Login"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-border-light bg-mobile-surface px-3 py-3 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search "fresh fruits"'
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button type="button" className="shrink-0 text-text-muted" aria-label="Voice search">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Category strip */}
      <div className="pb-3">
        <HorizontalScrollRow gapClassName="gap-1 px-4">
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.name;
            const to = cat.slug
              ? `/product?categoryName=${encodeURIComponent(cat.slug)}`
              : "/product";

            return (
              <Link
                key={cat.name}
                to={to}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex w-[72px] shrink-0 flex-col items-center gap-1.5 pb-2 pt-1 ${
                  isActive ? "border-b-2 border-[#07875f] text-[#07875f]" : "text-text-secondary"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-mobile-surface ${
                    isActive ? "text-[#07875f]" : "text-text-secondary"
                  }`}
                >
                  {cat.image ? (
                    <img src={cat.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CategoryIcon name={cat.name} index={index} className="h-6 w-6" />
                  )}
                </div>
                <span className="line-clamp-1 text-center text-[10px] font-semibold">{cat.name}</span>
                {cat.name === "Organic" ? (
                  <span className="-mt-1 rounded bg-[#07875f] px-1 text-[8px] font-bold text-white">New</span>
                ) : null}
              </Link>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </div>
  );
}

export default HomeMobileHeader;
