import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { buildProductSearchUrl } from "../../utils/productSearch";
import CategoryIcon from "./CategoryIcon";

/** Local category images for the home header strip */
const CATEGORY_IMAGES = {
  fruits: "/fruits.png",
  fruit: "/fruits.png",
  vegetables: "/vegetables.png",
  vegetable: "/vegetables.png",
  veggies: "/vegetables.png",
  organic: "/organic.png",
  dairy: "/dairy.png",
  milk: "/dairy.png",
};

function getCategoryImage(name, apiImage) {
  const key = String(name || "").trim().toLowerCase();
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  if (key.includes("fruit")) return "/fruits.png";
  if (key.includes("vegetable") || key.includes("veggie")) return "/vegetables.png";
  if (key.includes("organic")) return "/organic.png";
  if (key.includes("dairy") || key.includes("milk")) return "/dairy.png";
  return apiImage || null;
}

function isFruitsCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "fruits" || key === "fruit" || key.includes("fruit");
}

function isVegetablesCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "vegetables" || key === "vegetable" || key.includes("vegetable") || key.includes("veggie");
}

function isOrganicCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "organic" || key.includes("organic");
}

function isDairyCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "dairy" || key === "milk" || key.includes("dairy") || key.includes("milk");
}

function applyLocalCategoryImages(categories) {
  return categories.map((cat) => {
    if (isFruitsCategory(cat.name)) return { ...cat, image: "/fruits.png" };
    if (isVegetablesCategory(cat.name)) return { ...cat, image: "/vegetables.png" };
    if (isOrganicCategory(cat.name)) return { ...cat, image: "/organic.png" };
    if (isDairyCategory(cat.name)) return { ...cat, image: "/dairy.png" };
    return cat;
  });
}

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

function BasketFilledIcon({ className = "h-7 w-7" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.25 6.75h13.5l-.9 9.45a2.25 2.25 0 01-2.24 2.05H8.39a2.25 2.25 0 01-2.24-2.05L5.25 6.75z" />
      <path d="M8.25 6.75V5.25a3.75 3.75 0 017.5 0v1.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="9.5" cy="14" r="0.9" fill="white" />
      <circle cx="14.5" cy="14" r="0.9" fill="white" />
    </svg>
  );
}

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

    const defaults = [
      { name: "All", slug: "" },
      { name: "Fruits", slug: "Fruits", image: "/fruits.png" },
      { name: "Vegetables", slug: "Vegetables", image: "/vegetables.png" },
      { name: "Organic", slug: "Organic", image: "/organic.png" },
      { name: "Dairy", slug: "Dairy", image: "/dairy.png" },
    ];

    if (!filtered.length) return defaults;

    const fromApi = filtered.slice(0, 8).map((cat) => ({
      name: cat.categoryName,
      slug: cat.categoryName,
      image: getCategoryImage(cat.categoryName, cat.categoryImage),
    }));

    const hasFruits = fromApi.some((cat) => isFruitsCategory(cat.name));
    const hasVegetables = fromApi.some((cat) => isVegetablesCategory(cat.name));
    const hasOrganic = fromApi.some((cat) => isOrganicCategory(cat.name));
    const hasDairy = fromApi.some((cat) => isDairyCategory(cat.name));
    const list = [{ name: "All", slug: "" }, ...fromApi];

    if (!hasFruits) {
      list.splice(1, 0, { name: "Fruits", slug: "Fruits", image: "/fruits.png" });
    }
    if (!hasVegetables) {
      const insertAt = list.findIndex((cat) => isFruitsCategory(cat.name)) + 1 || 2;
      list.splice(insertAt, 0, {
        name: "Vegetables",
        slug: "Vegetables",
        image: "/vegetables.png",
      });
    }
    if (!hasOrganic) {
      const vegIndex = list.findIndex((cat) => isVegetablesCategory(cat.name));
      const insertAt = vegIndex >= 0 ? vegIndex + 1 : list.length;
      list.splice(insertAt, 0, {
        name: "Organic",
        slug: "Organic",
        image: "/organic.png",
      });
    }
    if (!hasDairy) {
      const organicIndex = list.findIndex((cat) => isOrganicCategory(cat.name));
      const insertAt = organicIndex >= 0 ? organicIndex + 1 : list.length;
      list.splice(insertAt, 0, {
        name: "Dairy",
        slug: "Dairy",
        image: "/dairy.png",
      });
    }

    return applyLocalCategoryImages(list);
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
    <div className="bg-[#f4f7fb] text-text-primary">
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

      {/* Search bar — capsule + bookmark (reference style) */}
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-1">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="flex h-11 items-center rounded-full border border-[#d7dbe3] bg-white pl-4 pr-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8edf5] text-[#4a5560]"
          aria-label="Wishlist"
        >
          <BookmarkIcon />
        </Link>
      </div>

      {/* Category tabs — equal horizontal spacing */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#c8cdd5]" />

        <div className="flex w-full items-end px-3">
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.name;
            const to = cat.slug
              ? `/product?categoryName=${encodeURIComponent(cat.slug)}`
              : "/product";
            const isAll = cat.name === "All";

            return (
              <Link
                key={cat.name}
                to={to}
                onClick={() => setActiveCategory(cat.name)}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 pb-1.5 pt-0.5 transition ${
                  isActive ? "text-text-primary" : "text-[#6b7280]"
                }`}
              >
                {isActive ? (
                  <span
                    className="pointer-events-none absolute inset-x-0 bottom-0 top-0 rounded-t-lg border-x border-t border-[#1a1a1a] bg-[#f4f7fb]"
                    aria-hidden="true"
                  />
                ) : null}

                {isActive ? (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-px bg-[#f4f7fb]" aria-hidden="true" />
                ) : null}

                <div className="relative z-[1] flex h-6 w-6 items-center justify-center">
                  {isAll && isActive ? (
                    <BasketFilledIcon className="h-5 w-5" />
                  ) : cat.image ? (
                    <img
                      src={cat.image}
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <CategoryIcon name={cat.name} index={index} className="h-[18px] w-[18px]" />
                  )}
                </div>
                <span
                  className={`relative z-[1] line-clamp-1 text-center text-[10px] leading-tight ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomeMobileHeader;
