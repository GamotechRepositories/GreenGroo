import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import DealProductCard from "./DealProductCard";
import SidebarCategoryImage from "./SidebarCategoryImage";
import CategoryHeaderSection from "./CategoryHeaderSection";
import ProductFiltersBar from "./ProductFiltersBar";
function buildCategoryUrl(categoryName, params = {}) {
  const search = new URLSearchParams();
  search.set("categoryName", categoryName);
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
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("categoryName", categoryName);
    if (subcategory) next.set("subcategory", subcategory);
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = Boolean(selectedBrand || (sortBy && sortBy !== "newest"));

  return {
    subcategory,
    selectedBrand,
    sortBy,
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

  const filteredProducts = products.filter((product) => {
    if (selectedBrand && product.brandName?.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
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
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(selectedBrand || (sortBy && sortBy !== "newest"));

  return {
    selectedBrand,
    sortBy,
    sortedProducts,
    updateParam,
    clearFilters,
    hasActiveFilters,
  };
}

function CategoryFilterToolbar(props) {
  return (
    <div className="shrink-0 border-b border-border-light">
      <ProductFiltersBar {...props} className="justify-start sm:justify-end" />
    </div>
  );
}

function AllProductsFilterToolbar(props) {
  return (
    <div className="shrink-0 border-b border-border-light">
      <ProductFiltersBar {...props} className="justify-start sm:justify-end" />
    </div>
  );
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
  const allActive = !activeCategory;

  if (variant === "mobile") {
    return (
      <aside className="flex h-full min-h-0 w-[82px] shrink-0 flex-col overflow-hidden border-r border-border-light bg-[#FAFAFA]">
        <nav
          className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain px-1.5 py-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Link
            to="/product"
            className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
              allActive
                ? "bg-primary/10 font-semibold text-primary"
                : "text-text-primary"
            }`}
          >
            <SidebarCategoryImage showGrid name="All Products" />
            <span className="text-center leading-tight">All</span>
          </Link>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.categoryName;
            return (
              <Link
                key={cat._id}
                to={buildCategoryUrl(cat.categoryName)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-text-primary"
                }`}
              >
                <SidebarCategoryImage image={cat.categoryImage} name={cat.categoryName} />
                <span className="line-clamp-2 w-full text-center leading-tight">
                  {cat.categoryName}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-light bg-white">
      <h2 className="shrink-0 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Categories
      </h2>
      <nav className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        <Link
          to="/product"
          className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition ${
            allActive
              ? "border-primary bg-primary/10 font-semibold text-primary"
              : "border-border-light font-medium text-text-primary hover:border-primary/40 hover:bg-mobile-surface"
          }`}
        >
          <SidebarCategoryImage showGrid name="All Products" />
          <span>All Products</span>
        </Link>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.categoryName;
          return (
            <Link
              key={cat._id}
              to={buildCategoryUrl(cat.categoryName)}
              className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition ${
                isActive
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border-light font-medium text-text-primary hover:border-primary/40 hover:bg-mobile-surface"
              }`}
            >
              <SidebarCategoryImage image={cat.categoryImage} name={cat.categoryName} />
              <span className="min-w-0 truncate">{cat.categoryName}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DesktopCategorySidebar({ categories, activeCategory }) {
  return <CategoryListBox categories={categories} activeCategory={activeCategory} variant="desktop" />;
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-0 pt-1 lg:px-3 lg:pt-2">
        <CategoryHeaderSection
          category={activeCategoryDoc}
          categoryName={categoryName}
          subcategories={activeCategoryDoc?.subcategories || []}
          activeSubcategory={filters.subcategory}
        />
      </div>
      <CategoryFilterToolbar
        selectedBrand={filters.selectedBrand}
        onBrandChange={(value) => filters.updateParam("brand", value)}
        sortBy={filters.sortBy}
        onSortChange={(value) => filters.updateParam("sort", value)}
        onClear={filters.clearFilters}
        hasActiveFilters={filters.hasActiveFilters}
      />
      <div className="hide-scrollbar flex-1 overflow-y-auto px-2 py-2 lg:px-3 lg:py-3">
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AllProductsFilterToolbar
        selectedBrand={filters.selectedBrand}
        onBrandChange={(value) => filters.updateParam("brand", value)}
        sortBy={filters.sortBy}
        onSortChange={(value) => filters.updateParam("sort", value)}
        onClear={filters.clearFilters}
        hasActiveFilters={filters.hasActiveFilters}
      />
      <div className="hide-scrollbar flex-1 overflow-y-auto px-2 py-3 lg:px-3 lg:py-4">
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
    <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] grid-cols-[260px_1fr] bg-white xl:grid-cols-[280px_1fr]">
      <div className="min-h-0 overflow-hidden">
        <CategoryListBox categories={categories} activeCategory={activeCategory} variant="desktop" />
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden bg-white">{children}</div>
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
    <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
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
      <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
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
      <div className="lg:hidden">
        <div className="flex h-[calc(100dvh-7rem)] min-h-[420px]">
          <CategoryListBox categories={categories} activeCategory="" variant="mobile" />
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="p-2.5">
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
    <div className="lg:hidden">
      <div className="flex h-[calc(100dvh-7rem)] min-h-[420px]">
        <CategoryListBox categories={categories} activeCategory={categoryName} variant="mobile" />
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="p-2.5">
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
      </div>
    </div>
  );
}
