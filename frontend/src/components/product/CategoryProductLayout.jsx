import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import DealProductCard from "./DealProductCard";
import SidebarCategoryImage from "./SidebarCategoryImage";
import CategoryHeaderSection from "./CategoryHeaderSection";
import ProductFiltersBar from "./ProductFiltersBar";
import ShopTopSlidingBanners from "./ShopTopSlidingBanners";
function buildCategoryUrl(categoryName, params = {}, storeParam = "") {
  const search = new URLSearchParams();
  search.set("categoryName", categoryName);
  if (storeParam) search.set("store", storeParam);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.brand) search.set("brand", params.brand);
  if (params.sort) search.set("sort", params.sort);
  return `/product?${search.toString()}`;
}

function useCategoryFilters(products, categoryName) {
  const [searchParams, setSearchParams] = useSearchParams();

  const subcategory = searchParams.get("subcategory")?.trim() || "";
  const selectedBrand = searchParams.get("brand")?.trim() || "";
  const sortBy = searchParams.get("sort")?.trim() || "newest";
  const maxPrice = searchParams.get("maxPrice")?.trim() || "";
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  const filteredProducts = products.filter((product) => {
    if (subcategory) {
      const target = subcategory.toLowerCase();
      const productSubs = Array.isArray(product.subcategories)
        ? product.subcategories
        : product.subcategory
          ? [product.subcategory]
          : [];
      const matchesSubcategory = productSubs.some(
        (sub) => sub?.toLowerCase() === target
      );
      if (!matchesSubcategory) return false;
    }
    if (selectedBrand && product.brandName?.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }

    const price = product.discountedPrice ?? product.price ?? 0;
    if (maxPrice && price > Number(maxPrice)) {
      return false;
    }

    if (onSale) {
      const originalPrice = product.price ?? price;
      if (!(originalPrice > price && price > 0)) {
        return false;
      }
    }

    if (inStock) {
      const stockAmt = product.storeStock ?? product.stock ?? 0;
      if (stockAmt <= 0 && product.inStock !== true) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") {
      return (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price);
    }
    if (sortBy === "price-desc") {
      return (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price);
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    return 0;
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "false") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("categoryName", categoryName);
    if (subcategory) next.set("subcategory", subcategory);
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = Boolean(
    selectedBrand || (sortBy && sortBy !== "newest") || maxPrice || onSale || inStock
  );

  return {
    subcategory,
    selectedBrand,
    sortBy,
    maxPrice,
    onSale,
    inStock,
    sortedProducts,
    updateParam,
    clearFilters,
    hasActiveFilters,
  };
}

function useAllProductsFilters(products) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedBrand = searchParams.get("brand")?.trim() || "";
  const sortBy = searchParams.get("sort")?.trim() || "newest";
  const maxPrice = searchParams.get("maxPrice")?.trim() || "";
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  const filteredProducts = products.filter((product) => {
    if (selectedBrand && product.brandName?.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }

    const price = product.discountedPrice ?? product.price ?? 0;
    if (maxPrice && price > Number(maxPrice)) {
      return false;
    }

    if (onSale) {
      const originalPrice = product.price ?? price;
      if (!(originalPrice > price && price > 0)) {
        return false;
      }
    }

    if (inStock) {
      const stockAmt = product.storeStock ?? product.stock ?? 0;
      if (stockAmt <= 0 && product.inStock !== true) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") {
      return (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price);
    }
    if (sortBy === "price-desc") {
      return (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price);
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    return 0;
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "false") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(
    selectedBrand || (sortBy && sortBy !== "newest") || maxPrice || onSale || inStock
  );

  return {
    selectedBrand,
    sortBy,
    maxPrice,
    onSale,
    inStock,
    sortedProducts,
    updateParam,
    clearFilters,
    hasActiveFilters,
  };
}

function CategoryFilterToolbar() {
  return null;
}

function AllProductsFilterToolbar() {
  return null;
}

function useLoadMoreOnVisible({ enabled, onLoadMore }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled || !onLoadMore) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return sentinelRef;
}

function ProductResultsGrid({
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}) {
  const loadMoreRef = useLoadMoreOnVisible({
    enabled: Boolean(hasNextPage && !isFetchingNextPage && !loading && onLoadMore),
    onLoadMore,
  });

  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-[260px] animate-pulse rounded-xl border border-border-light bg-white"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&>div]:h-full">
        {products.map((product) => (
          <DealProductCard
            key={product._id}
            product={product}
            onAdd={onAdd}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            cartQuantity={onGetCartQuantity ? onGetCartQuantity(product) : 0}
            layout="grid"
          />
        ))}
      </div>
      {hasNextPage ? <div ref={loadMoreRef} className="h-2 w-full" aria-hidden="true" /> : null}
      {isFetchingNextPage ? (
        <p className="py-4 text-center text-sm text-text-secondary">Loading more products...</p>
      ) : null}
    </>
  );
}

function CategoryListBox({ categories, activeCategory, variant = "desktop" }) {
  const [searchParams] = useSearchParams();
  const storeParam = searchParams.get("store")?.trim()?.toLowerCase() || "";
  const activeSubcategory = searchParams.get("subcategory")?.trim() || "";
  const allActive = !activeCategory;
  const allUrl = storeParam ? `/product?store=${storeParam}` : "/product";

  const activeCategoryDoc = categories.find(
    (cat) =>
      cat.categoryName?.toLowerCase() === String(activeCategory || "").toLowerCase() ||
      cat.slug?.toLowerCase() === String(activeCategory || "").toLowerCase()
  );
  const subcategories = Array.isArray(activeCategoryDoc?.subcategories)
    ? activeCategoryDoc.subcategories.filter(Boolean)
    : [];
  const showSubcategories = Boolean(activeCategory && subcategories.length > 0);
  const categoryHomeUrl = activeCategory
    ? buildCategoryUrl(activeCategoryDoc?.categoryName || activeCategory, {}, storeParam)
    : allUrl;

  if (variant === "mobile") {
    return (
      <aside className="flex h-full min-h-0 w-[84px] shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-slate-50/50">
        <nav
          className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain px-1.5 py-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {showSubcategories ? (
            <>
              <Link
                to={allUrl}
                className="group flex shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold text-slate-400 hover:bg-white hover:text-slate-600"
              >
                ← Cats
              </Link>
              <Link
                to={categoryHomeUrl}
                className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] transition-all duration-200 ${
                  !activeSubcategory
                    ? "bg-white shadow-sm ring-1 ring-emerald-100/50 font-bold text-emerald-700"
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                }`}
              >
                <div className={`transition-transform duration-200 ${!activeSubcategory ? "scale-110" : "group-hover:scale-105"}`}>
                  <SidebarCategoryImage
                    image={activeCategoryDoc?.categoryImage}
                    name={activeCategoryDoc?.categoryName || activeCategory}
                  />
                </div>
                <span className="text-center leading-[1.1] tracking-tight">All</span>
              </Link>
              {subcategories.map((sub) => {
                const isActive = activeSubcategory.toLowerCase() === String(sub).toLowerCase();
                return (
                  <Link
                    key={sub}
                    to={buildCategoryUrl(
                      activeCategoryDoc?.categoryName || activeCategory,
                      { subcategory: sub },
                      storeParam
                    )}
                    className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] transition-all duration-200 ${
                      isActive
                        ? "bg-white shadow-sm ring-1 ring-emerald-100/50 font-bold text-emerald-700"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                      <SidebarCategoryImage name={sub} />
                    </div>
                    <span className="line-clamp-2 w-full text-center leading-[1.1] tracking-tight">
                      {sub}
                    </span>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <Link
                to={allUrl}
                className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] transition-all duration-200 ${
                  allActive
                    ? "bg-white shadow-sm ring-1 ring-emerald-100/50 font-bold text-emerald-700"
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                }`}
              >
                <div className={`transition-transform duration-200 ${allActive ? "scale-110" : "group-hover:scale-105"}`}>
                  <SidebarCategoryImage showGrid name="All Products" />
                </div>
                <span className="text-center leading-[1.1] tracking-tight">All</span>
              </Link>
              {categories.map((cat) => {
                const isActive = activeCategory === cat.categoryName;
                return (
                  <Link
                    key={cat._id || cat.categoryName}
                    to={buildCategoryUrl(cat.categoryName, {}, storeParam)}
                    className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] transition-all duration-200 ${
                      isActive
                        ? "bg-white shadow-sm ring-1 ring-emerald-100/50 font-bold text-emerald-700"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                      <SidebarCategoryImage image={cat.categoryImage} name={cat.categoryName} />
                    </div>
                    <span className="line-clamp-2 w-full text-center leading-[1.1] tracking-tight">
                      {cat.categoryName}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-100 bg-slate-50/30">
      <div className="shrink-0 px-5 py-4 pb-2">
        <h2 className="text-[12px] font-bold tracking-widest text-slate-400 uppercase">
          {showSubcategories ? "Subcategories" : "Categories"}
        </h2>
        {showSubcategories ? (
          <Link
            to={allUrl}
            className="mt-2 inline-flex text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            ← All categories
          </Link>
        ) : null}
      </div>
      <nav className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {showSubcategories ? (
          <>
            <Link
              to={categoryHomeUrl}
              className={`group relative flex items-center gap-3.5 rounded-2xl px-2 py-2 transition-all duration-200 ${
                !activeSubcategory
                  ? "bg-white shadow-[0_2px_12px_-4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50"
                  : "hover:bg-slate-100/80"
              }`}
            >
              {!activeSubcategory && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
              )}
              <div className={`transition-transform duration-300 ${!activeSubcategory ? "scale-105" : "group-hover:scale-105"}`}>
                <SidebarCategoryImage
                  image={activeCategoryDoc?.categoryImage}
                  name={activeCategoryDoc?.categoryName || activeCategory}
                />
              </div>
              <span
                className={`text-[13px] leading-tight ${
                  !activeSubcategory
                    ? "font-bold text-emerald-700"
                    : "font-semibold text-slate-600 group-hover:text-slate-900"
                }`}
              >
                All {activeCategoryDoc?.categoryName || activeCategory}
              </span>
            </Link>
            {subcategories.map((sub) => {
              const isActive = activeSubcategory.toLowerCase() === String(sub).toLowerCase();
              return (
                <Link
                  key={sub}
                  to={buildCategoryUrl(
                    activeCategoryDoc?.categoryName || activeCategory,
                    { subcategory: sub },
                    storeParam
                  )}
                  className={`group relative flex items-center gap-3.5 rounded-2xl px-2 py-2 transition-all duration-200 ${
                    isActive
                      ? "bg-white shadow-[0_2px_12px_-4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50"
                      : "hover:bg-slate-100/80"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
                  )}
                  <div className={`transition-transform duration-300 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
                    <SidebarCategoryImage name={sub} />
                  </div>
                  <span
                    className={`text-[13px] leading-tight ${
                      isActive
                        ? "font-bold text-emerald-700"
                        : "font-semibold text-slate-600 group-hover:text-slate-900"
                    }`}
                  >
                    {sub}
                  </span>
                </Link>
              );
            })}
          </>
        ) : (
          <>
            <Link
              to={allUrl}
              className={`group relative flex items-center gap-3.5 rounded-2xl px-2 py-2 transition-all duration-200 ${
                allActive
                  ? "bg-white shadow-[0_2px_12px_-4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50"
                  : "hover:bg-slate-100/80"
              }`}
            >
              {allActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
              )}
              <div className={`transition-transform duration-300 ${allActive ? "scale-105" : "group-hover:scale-105 group-hover:rotate-2"}`}>
                <SidebarCategoryImage showGrid name="All Products" />
              </div>
              <span className={`text-[13px] leading-tight ${allActive ? "font-bold text-emerald-700" : "font-semibold text-slate-600 group-hover:text-slate-900"}`}>
                All Products
              </span>
            </Link>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.categoryName;
              return (
                <Link
                  key={cat._id || cat.categoryName}
                  to={buildCategoryUrl(cat.categoryName, {}, storeParam)}
                  className={`group relative flex items-center gap-3.5 rounded-2xl px-2 py-2 transition-all duration-200 ${
                    isActive
                      ? "bg-white shadow-[0_2px_12px_-4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50"
                      : "hover:bg-slate-100/80"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
                  )}
                  <div className={`transition-transform duration-300 ${isActive ? "scale-105" : "group-hover:scale-105 group-hover:rotate-2"}`}>
                    <SidebarCategoryImage image={cat.categoryImage} name={cat.categoryName} />
                  </div>
                  <span className={`text-[13px] leading-tight ${isActive ? "font-bold text-emerald-700" : "font-semibold text-slate-600 group-hover:text-slate-900"}`}>
                    {cat.categoryName}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}

function DesktopCategorySidebar({ categories, activeCategory }) {
  return <CategoryListBox categories={categories} activeCategory={activeCategory} variant="desktop" />;
}

function FilterSheet({ filters, showFilters, setShowFilters }) {
  return (
    <>
      <button
        onClick={() => setShowFilters(true)}
        className="fixed bottom-[90px] right-4 sm:right-8 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-slate-800 text-white shadow-xl hover:bg-slate-700 active:scale-95 transition-all"
        aria-label="Filters"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 9.75h12M9 15h6M10.5 20.25h3" />
        </svg>
      </button>

      {showFilters && (
        <>
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-[150px] sm:right-8 sm:w-[340px] z-[70] rounded-t-3xl sm:rounded-2xl bg-white p-5 pb-8 sm:pb-5 shadow-2xl animate-in sm:slide-in-from-bottom-4 slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-[16px]">Filters & Sorting</h3>
              <button onClick={() => setShowFilters(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProductFiltersBar
              showBrand={true}
              selectedBrand={filters.selectedBrand}
              onBrandChange={(value) => filters.updateParam("brand", value)}
              sortBy={filters.sortBy}
              onSortChange={(value) => filters.updateParam("sort", value)}
              maxPrice={filters.maxPrice}
              onMaxPriceChange={(value) => filters.updateParam("maxPrice", value)}
              onSale={filters.onSale}
              onOnSaleChange={(value) => filters.updateParam("onSale", value ? "true" : "false")}
              inStock={filters.inStock}
              onInStockChange={(value) => filters.updateParam("inStock", value ? "true" : "false")}
              onClear={filters.clearFilters}
              hasActiveFilters={filters.hasActiveFilters}
              className="px-0 py-0 flex-col !items-stretch [&>select]:w-full [&>select]:h-11 [&>select]:text-[14px] [&>button]:h-11 [&>button]:text-[14px] gap-4 bg-transparent"
            />
          </div>
        </>
      )}
    </>
  );
}

function CategoryProductMain({
  categories,
  activeCategory,
  categoryName,
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) {
  const filters = useCategoryFilters(products, categoryName);
  const activeCategoryDoc = categories.find(
    (cat) => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
  );
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-2 py-2 lg:px-3 lg:py-3 pb-24">
        <div className="mb-3">
          <ShopTopSlidingBanners />
          <CategoryHeaderSection
            category={activeCategoryDoc}
            categoryName={categoryName}
            subcategories={activeCategoryDoc?.subcategories || []}
            activeSubcategory={filters.subcategory}
          />
        </div>
        <ProductResultsGrid
          products={filters.sortedProducts}
          loading={loading}
          onAdd={onAdd}
          onGetCartQuantity={onGetCartQuantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          emptyMessage={emptyMessage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      </div>
      <FilterSheet filters={filters} showFilters={showFilters} setShowFilters={setShowFilters} />
    </div>
  );
}

function AllProductsMain({
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) {
  const filters = useAllProductsFilters(products);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-2 py-3 lg:px-3 lg:py-4 pb-24">
        <div className="mb-3">
          <ShopTopSlidingBanners />
        </div>
        <ProductResultsGrid
          products={filters.sortedProducts}
          loading={loading}
          onAdd={onAdd}
          onGetCartQuantity={onGetCartQuantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          emptyMessage={emptyMessage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      </div>
      <FilterSheet filters={filters} showFilters={showFilters} setShowFilters={setShowFilters} />
    </div>
  );
}

export {
  buildCategoryUrl,
  CategoryFilterToolbar,
  CategoryListBox,
  DesktopCategorySidebar,
  ProductResultsGrid,
};

function ProductPageTwoBoxLayout({ categories, activeCategory, children }) {
  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[260px_1fr] bg-white xl:grid-cols-[280px_1fr] items-start">
      <div className="sticky top-[120px] h-[calc(100vh-120px)] overflow-hidden">
        <CategoryListBox categories={categories} activeCategory={activeCategory} variant="desktop" />
      </div>
      <div className="flex flex-col bg-white min-w-0">{children}</div>
    </div>
  );
}

export default function CategoryProductLayout({
  categories,
  activeCategory,
  categoryName,
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) {
  return (
    <div className="hidden lg:block">
      <ProductPageTwoBoxLayout categories={categories} activeCategory={activeCategory}>
        <CategoryProductMain
          categories={categories}
          activeCategory={activeCategory}
          categoryName={categoryName}
          products={products}
          loading={loading}
          onAdd={onAdd}
          onGetCartQuantity={onGetCartQuantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          emptyMessage={emptyMessage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      </ProductPageTwoBoxLayout>
    </div>
  );
}

export function AllProductsLayout({
  categories,
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) {
  return (
    <>
      <div className="hidden lg:block">
        <ProductPageTwoBoxLayout categories={categories} activeCategory="">
          <AllProductsMain
            products={products}
            loading={loading}
            onAdd={onAdd}
            onGetCartQuantity={onGetCartQuantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            emptyMessage={emptyMessage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={onLoadMore}
          />
        </ProductPageTwoBoxLayout>
      </div>
      <div className="lg:hidden flex items-start">
        <div className="sticky top-[70px] h-[calc(100vh-70px)] shrink-0 overflow-hidden">
          <CategoryListBox categories={categories} activeCategory="" variant="mobile" />
        </div>
        <div className="flex-1 flex flex-col bg-white px-1 pb-1 pt-0 min-w-0">
          <AllProductsMain
            products={products}
            loading={loading}
            onAdd={onAdd}
            onGetCartQuantity={onGetCartQuantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            emptyMessage={emptyMessage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={onLoadMore}
          />
        </div>
      </div>
    </>
  );
}

export function MobileCategoryProductLayout({
  categories,
  categoryName,
  products,
  loading,
  onAdd,
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) {
  return (
    <div className="lg:hidden flex items-start">
      <div className="sticky top-[70px] h-[calc(100vh-70px)] shrink-0 overflow-hidden">
        <CategoryListBox categories={categories} activeCategory={categoryName} variant="mobile" />
      </div>
      <div className="flex-1 flex flex-col bg-white px-1 pb-1 pt-0 min-w-0">
        <CategoryProductMain
          categories={categories}
          categoryName={categoryName}
          products={products}
          loading={loading}
          onAdd={onAdd}
          onGetCartQuantity={onGetCartQuantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          emptyMessage={emptyMessage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      </div>
    </div>
  );
}
