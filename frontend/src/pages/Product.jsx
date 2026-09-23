import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import { useInfiniteProductsQuery } from "../hooks/queries/useProductsQuery";
import { useProductListParams } from "../hooks/useProductListParams";
import { useProductCartActions } from "../hooks/useProductCartActions";
import CategoryProductLayout, {
  AllProductsLayout,
  DesktopCategorySidebar,
  MobileCategoryProductLayout,
  ProductResultsGrid,
} from "../components/product/CategoryProductLayout";
import ProductFiltersBar, { PRODUCT_SORT_OPTIONS } from "../components/product/ProductFiltersBar";
import { addCategoryVisit } from "../utils/categoryVisits";
import { sectionToStoreKey, storeToSection } from "../utils/storeSection";

function FilterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4.5h18M6 9.75h12M9 15h6M10.5 20.25h3"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}

function MobileProductToolbar({
  title,
  backTo,
  onToggleSort,
  onToggleFilter,
  showActions = true,
  filterActive = false,
  sortActive = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2.5">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex min-w-0 shrink items-center gap-0.5 text-text-primary"
      >
        <svg
          className="h-[18px] w-[18px] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        {title ? (
          <span className="truncate text-[15px] font-bold leading-none">{title}</span>
        ) : null}
      </button>

      {showActions && (
        <>
          <button
            type="button"
            onClick={onToggleFilter}
            className={`ml-auto flex shrink-0 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              filterActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border-light text-text-primary"
            }`}
          >
            <FilterIcon />
            Filter
          </button>
          <button
            type="button"
            onClick={onToggleSort}
            className={`flex shrink-0 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              sortActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border-light text-text-primary"
            }`}
          >
            <SortIcon />
            Sort
          </button>
        </>
      )}
    </div>
  );
}

function useListingFilters({ brandParamKey = "brand" } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBrand =
    searchParams.get(brandParamKey)?.trim() || searchParams.get("brand")?.trim() || "";
  const sortBy = searchParams.get("sort")?.trim() || "newest";
  const maxPrice = searchParams.get("maxPrice")?.trim() || "";
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "false") next.set(key, value);
    else next.delete(key);
    if (key === brandParamKey && brandParamKey !== "brand") {
      next.delete("brand");
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = (preserveKeys = []) => {
    const next = new URLSearchParams();
    preserveKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = Boolean(
    (brandParamKey === "brand" && selectedBrand) || (sortBy && sortBy !== "newest") || maxPrice || onSale || inStock
  );

  return {
    selectedBrand,
    sortBy,
    maxPrice,
    onSale,
    inStock,
    updateParam,
    clearFilters,
    hasActiveFilters,
    brandParamKey,
  };
}

function FilteredProductsView({
  products,
  categories,
  loading,
  pageTitle,
  emptyMessage,
  backTo = "/",
  onGetCartQuantity,
  onIncrease,
  onDecrease,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  brandParamKey = "brandName",
  preserveKeys = [],
  showBrandFilter = true,
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const filters = useListingFilters({ brandParamKey });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (
        brandParamKey === "brand" &&
        filters.selectedBrand &&
        product.brandName?.toLowerCase() !== filters.selectedBrand.toLowerCase()
      ) {
        return false;
      }
      
      const price = product.discountedPrice ?? product.price ?? 0;
      if (filters.maxPrice && price > Number(filters.maxPrice)) {
        return false;
      }

      if (filters.onSale) {
        const originalPrice = product.price ?? price;
        if (!(originalPrice > price && price > 0)) {
          return false;
        }
      }

      if (filters.inStock) {
        const stockAmt = product.storeStock ?? product.stock ?? 0;
        if (stockAmt <= 0 && product.inStock !== true) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters.selectedBrand, brandParamKey, filters.maxPrice, filters.onSale, filters.inStock]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const sortBy = filters.sortBy;
    if (sortBy === "price-asc") {
      list.sort((a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
    return list;
  }, [filteredProducts, filters.sortBy]);

  const filterActive = Boolean(
    showBrandFilter && brandParamKey === "brand" && filters.selectedBrand
  );
  const sortActive = Boolean(filters.sortBy && filters.sortBy !== "newest");

  const handleSortChange = (id) => {
    filters.updateParam("sort", id);
    setShowSort(false);
  };

  return (
    <div className="min-h-screen bg-mobile-bg pb-6 lg:pb-0">
      <div className="lg:hidden">
        <MobileProductToolbar
          title={pageTitle}
          backTo={backTo}
          onToggleSort={() => {
            setShowSort((prev) => !prev);
            setShowFilter(false);
          }}
          onToggleFilter={() => {
            setShowFilter((prev) => !prev);
            setShowSort(false);
          }}
          filterActive={filterActive || showFilter}
          sortActive={sortActive || showSort}
        />
        {showFilter && (
          <div className="border-b border-border-light">
            <ProductFiltersBar
              showBrand={showBrandFilter}
              showSort={false}
              selectedBrand={filters.selectedBrand}
              onBrandChange={(value) => filters.updateParam(brandParamKey, value)}
              maxPrice={filters.maxPrice}
              onMaxPriceChange={(value) => filters.updateParam("maxPrice", value)}
              onSale={filters.onSale}
              onOnSaleChange={(value) => filters.updateParam("onSale", value ? "true" : "false")}
              inStock={filters.inStock}
              onInStockChange={(value) => filters.updateParam("inStock", value ? "true" : "false")}
              onClear={() => filters.clearFilters(preserveKeys)}
              hasActiveFilters={filterActive}
            />
          </div>
        )}
        {showSort && (
          <div className="border-b border-border-light bg-white px-4 py-1.5">
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSortChange(option.id)}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                  filters.sortBy === option.id
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="bg-mobile-bg px-3 py-3">
          <ProductResultsGrid
            products={sortedProducts}
            loading={loading}
            onAdd={onIncrease}
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

      <div className="hidden lg:block">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[232px_1fr] items-start bg-white xl:grid-cols-[248px_1fr]">
          <div
            className="sticky z-30 overflow-hidden rounded-br-2xl border-r border-gray-100 bg-white transition-[top,height] duration-300 ease-out"
            style={{
              top: "var(--gg-nav-offset, 96px)",
              height: "calc(100vh - var(--gg-nav-offset, 96px))",
            }}
          >
            <DesktopCategorySidebar categories={categories} activeCategory="" />
          </div>
          <div className="min-h-0 flex-1 bg-white">
            <div className="border-b border-border-light px-3 py-4 lg:px-6 lg:py-5">
              <h1 className="mb-3 text-xl font-bold text-text-primary">{pageTitle}</h1>
              <ProductFiltersBar
                showBrand={showBrandFilter}
                selectedBrand={filters.selectedBrand}
                onBrandChange={(value) => filters.updateParam(brandParamKey, value)}
                sortBy={filters.sortBy}
                onSortChange={(value) => filters.updateParam("sort", value)}
                onClear={() => filters.clearFilters(preserveKeys)}
                hasActiveFilters={filters.hasActiveFilters}
                className="px-0"
              />
            </div>
            <div className="px-3 py-4 lg:px-6 lg:py-5">
              <ProductResultsGrid
                products={sortedProducts}
                loading={loading}
                onAdd={onIncrease}
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
    </div>
  );
}

function SearchResultsView(props) {
  const { searchQuery, ...rest } = props;

  return (
    <FilteredProductsView
      {...rest}
      pageTitle={`Results for "${searchQuery}"`}
      emptyMessage={`No products found for "${searchQuery}".`}
      backTo="/product"
      brandParamKey="brand"
      preserveKeys={["q"]}
      showBrandFilter
    />
  );
}

function Product() {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const searchQuery = searchParams.get("q")?.trim() || "";
  const brandName = searchParams.get("brandName")?.trim() || "";
  const storeParam = searchParams.get("store")?.trim()?.toLowerCase() || "";
  const storeKey = sectionToStoreKey(storeParam);
  const targetSection = storeParam ? storeToSection(storeKey) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (categoryName) addCategoryVisit(categoryName);
  }, [categoryName, searchQuery, brandName, storeParam]);

  const { getCartQuantity, handleIncrease, handleDecrease } = useProductCartActions();
  const productParams = useProductListParams(searchParams);

  const { data: apiCategories = [], isLoading: categoriesLoading } = useCategoriesQuery(
    targetSection ? { section: targetSection } : {}
  );
  const {
    data,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProductsQuery(productParams);

  const apiProducts = useMemo(
    () => data?.pages.flatMap((page) => page.products) ?? [],
    [data]
  );

  // Section-aware category list from Product Management (API only)
  const categories = useMemo(
    () =>
      (apiCategories || [])
        .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
        .map((cat) => ({
          _id: cat._id,
          categoryName: cat.categoryName,
          categoryImage: cat.categoryImage,
          // Always route by categoryName so filters match product.categories
          slug: cat.categoryName,
        })),
    [apiCategories]
  );

  // Product list for right product grid
  const products = useMemo(() => {
    let baseList = apiProducts;

    if (categoryName) {
      const target = categoryName.toLowerCase();
      return baseList.filter((p) => {
        const pCats = [
          ...(Array.isArray(p.categories) ? p.categories : []),
          p.categoryName,
          p.storeCategory,
        ].filter(Boolean);
        return pCats.some(
          (c) =>
            c?.toLowerCase() === target ||
            target.includes(c?.toLowerCase()) ||
            c?.toLowerCase().includes(target)
        );
      });
    }

    return baseList;
  }, [apiProducts, categoryName]);

  const loading =
    categoriesLoading ||
    (productsLoading && apiProducts.length === 0 && products.length === 0);
  const infiniteScrollProps = {
    hasNextPage: apiProducts.length > 0 ? Boolean(hasNextPage) : false,
    isFetchingNextPage: apiProducts.length > 0 ? isFetchingNextPage : false,
    onLoadMore: apiProducts.length > 0 ? fetchNextPage : undefined,
  };

  if (brandName && !categoryName && !searchQuery) {
    return (
      <FilteredProductsView
        products={products}
        categories={categories}
        loading={loading}
        pageTitle={brandName}
        emptyMessage={`No products found for brand "${brandName}".`}
        backTo="/"
        onGetCartQuantity={getCartQuantity}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        brandParamKey="brandName"
        preserveKeys={["brandName", "store"]}
        showBrandFilter
        {...infiniteScrollProps}
      />
    );
  }

  if (searchQuery && !categoryName) {
    return (
      <SearchResultsView
        products={products}
        categories={categories}
        loading={loading}
        searchQuery={searchQuery}
        onGetCartQuantity={getCartQuantity}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        {...infiniteScrollProps}
      />
    );
  }

  if (categoryName) {
    return (
      <div className="bg-white lg:pb-0">
        <MobileCategoryProductLayout
          categories={categories}
          categoryName={categoryName}
          products={products}
          loading={loading}
          onAdd={handleIncrease}
          onGetCartQuantity={getCartQuantity}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          emptyMessage="No products found in this category yet."
          {...infiniteScrollProps}
        />

        <CategoryProductLayout
          categories={categories}
          activeCategory={categoryName}
          categoryName={categoryName}
          products={products}
          loading={loading}
          onAdd={handleIncrease}
          onGetCartQuantity={getCartQuantity}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          emptyMessage="No products found in this category yet."
          {...infiniteScrollProps}
        />
      </div>
    );
  }

  return (
    <div className="bg-white lg:pb-0">
      <AllProductsLayout
        categories={categories}
        products={products}
        loading={loading || categoriesLoading}
        onAdd={handleIncrease}
        onGetCartQuantity={getCartQuantity}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        emptyMessage="No products available yet."
        {...infiniteScrollProps}
      />
    </div>
  );
}

export default Product;
