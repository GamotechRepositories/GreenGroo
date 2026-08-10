import { useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBrandsQuery } from "../../hooks/queries/useBrandsQuery";
import { PRODUCT_SORT_OPTIONS } from "../product/ProductFiltersBar";
import ShareWebsiteButton from "../layout/ShareWebsiteButton";

const PAGE_LINKS = [
  { to: "/wishlist", label: "Wishlist" },
  { to: "/about", label: "About" },
  { to: "/support", label: "Support" },
  { to: "/contact", label: "Contact" },
  { to: "/orders", label: "My Orders" },
  { to: "/profile", label: "Profile" },
];

function categoryUrl(name, params = {}) {
  const search = new URLSearchParams();
  if (name) search.set("categoryName", name);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.brand) search.set("brand", params.brand);
  if (params.sort) search.set("sort", params.sort);
  const qs = search.toString();
  return qs ? `/product?${qs}` : "/product";
}

function MobileDrawerFilters({ categories }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: brandDocs = [], isLoading: loadingBrands } = useBrandsQuery();

  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const subcategory = searchParams.get("subcategory")?.trim() || "";
  const selectedBrand = searchParams.get("brand")?.trim() || "";
  const sortBy = searchParams.get("sort")?.trim() || "newest";

  const activeCategory = categories.find(
    (cat) => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
  );
  const subcategories = activeCategory?.subcategories || [];
  const pills = ["All", ...subcategories];

  const preservedFilters = { brand: selectedBrand, sort: sortBy };
  const brands = brandDocs.map((brand) => brand.brandName).filter(Boolean);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (categoryName) next.set("categoryName", categoryName);
    if (subcategory) next.set("subcategory", subcategory);
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = Boolean(selectedBrand || (sortBy && sortBy !== "newest"));

  return (
    <div className="mb-4 border-b border-border-light pb-4">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Filters
      </p>

      {categoryName && subcategories.length > 0 ? (
        <div className="mb-3 px-2">
          <p className="mb-1.5 text-[10px] lowercase text-text-secondary">subcategory</p>
          <div className="flex flex-wrap gap-1.5">
            {pills.map((pill) => {
              const isAll = pill === "All";
              const isActive = isAll ? !subcategory : subcategory === pill;
              const to = isAll
                ? categoryUrl(categoryName, preservedFilters)
                : categoryUrl(categoryName, { ...preservedFilters, subcategory: pill });

              return (
                <Link
                  key={pill}
                  to={to}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-border-light bg-white text-text-primary"
                  }`}
                >
                  {pill}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 px-2">
        <div>
          <label className="mb-1 block text-[10px] lowercase text-text-secondary">brand name</label>
          <select
            value={selectedBrand}
            onChange={(e) => updateParam("brand", e.target.value)}
            disabled={loadingBrands}
            className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-primary"
          >
            <option value="">all brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] lowercase text-text-secondary">sort</label>
          <select
            value={sortBy}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-primary"
          >
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-lg border border-border-light py-2 text-xs font-semibold text-text-secondary"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MobileMenuDrawer({ open, onClose, categories }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal, logout } = useAuth();
  const isProductPage = pathname === "/product";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleGuestLink = (e, requiresAuth) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      onClose();
      openAuthModal("login");
    } else {
      onClose();
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[min(300px,88vw)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light px-4 py-4">
          <div className="min-w-0">
            {user ? (
              <>
                <p className="truncate text-base font-bold text-text-primary">{user.name}</p>
                <p className="truncate text-xs text-text-secondary">{user.email || user.phone}</p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal("login");
                }}
                className="text-left text-base font-bold text-primary"
              >
                Login / Register
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-mobile-surface"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="hide-scrollbar flex-1 overflow-y-auto px-3 py-3">
          {isProductPage ? (
            <MobileDrawerFilters categories={categories} />
          ) : null}

          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Pages
          </p>
          <ul className="mb-4 space-y-0.5">
            {PAGE_LINKS.map((item) => {
              const needsAuth =
                item.to === "/orders" || item.to === "/profile";
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={(e) => handleGuestLink(e, needsAuth)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-mobile-surface"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Categories
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                to="/product"
                onClick={onClose}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-mobile-surface"
              >
                All Products
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat._id}>
                <Link
                  to={categoryUrl(cat.categoryName)}
                  onClick={onClose}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-mobile-surface"
                >
                  {cat.categoryName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border-light p-3">
          <ShareWebsiteButton className="w-full justify-center" />
        </div>

        {user ? (
          <div className="border-t border-border-light p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default MobileMenuDrawer;
