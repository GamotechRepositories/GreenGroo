import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  DUMMY_SHOP_CATEGORIES,
  getAllDummyProducts,
  getDummyCategoryProducts,
} from "../data/dummyCategoryProducts";
import { SUPER_MALL_CATEGORIES } from "../data/superMallCategories";
import { READY2COOK_SHOP_CATEGORIES } from "../components/home/FestiveStoreSection";
import { SUPERMALL_PRODUCTS } from "../sections/SuperMall/data/products";
import { READY2COOK_PRODUCTS } from "../sections/Ready2Cook/data/products";

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

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
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
    (brandParamKey === "brand" && selectedBrand) || (sortBy && sortBy !== "newest")
  );

  return {
    selectedBrand,
    sortBy,
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
      return true;
    });
  }, [products, filters.selectedBrand, brandParamKey]);

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
    <div className="min-h-screen bg-mobile-bg pb-6 lg:flex lg:h-[calc(100vh-108px)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
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

      <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] grid-cols-[240px_1fr] bg-mobile-bg xl:grid-cols-[260px_1fr]">
          <div className="min-h-0 overflow-hidden">
            <DesktopCategorySidebar categories={categories} activeCategory="" />
          </div>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto border-l border-border-light bg-white">
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const searchQuery = searchParams.get("q")?.trim() || "";
  const brandName = searchParams.get("brandName")?.trim() || "";
  const storeParam = searchParams.get("store")?.trim()?.toLowerCase() || "";

  const { getCartQuantity, handleIncrease, handleDecrease } = useProductCartActions();
  const productParams = useProductListParams(searchParams);

  const { data: apiCategories = [], isLoading: categoriesLoading } = useCategoriesQuery();
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

  // Section-aware category list for left scroll bar
  const categories = useMemo(() => {
    if (storeParam === "mall") {
      return SUPER_MALL_CATEGORIES.map((cat) => ({
        _id: cat.id,
        categoryName: cat.name,
        categoryImage: cat.image,
        slug: cat.slug,
      }));
    }

    if (storeParam === "festive") {
      return READY2COOK_SHOP_CATEGORIES.map((cat) => ({
        _id: cat.name,
        categoryName: cat.name,
        categoryImage: cat.image,
        slug: cat.name,
      }));
    }

    const byName = new Map(
      (apiCategories || [])
        .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
        .map((cat) => [String(cat.categoryName).toLowerCase(), cat])
    );

    return DUMMY_SHOP_CATEGORIES.map((shopCat) => {
      const apiCat = byName.get(shopCat.categoryName.toLowerCase());
      if (!apiCat) return shopCat;
      return {
        ...shopCat,
        _id: apiCat._id || shopCat._id,
        categoryImage: shopCat.categoryImage || apiCat.categoryImage,
        subcategories: apiCat.subcategories || [],
      };
    });
  }, [apiCategories, storeParam]);

  // Section-aware product list for right product grid
  const products = useMemo(() => {
    let baseList = [];
    if (apiProducts.length > 0) {
      baseList = apiProducts;
    } else if (storeParam === "mall") {
      baseList = SUPERMALL_PRODUCTS;
    } else if (storeParam === "festive") {
      baseList = READY2COOK_PRODUCTS;
    } else {
      baseList = categoryName ? getDummyCategoryProducts(categoryName) || [] : getAllDummyProducts();
    }

    if (categoryName && (storeParam === "mall" || storeParam === "festive")) {
      const target = categoryName.toLowerCase();
      return baseList.filter((p) => {
        const pCats = Array.isArray(p.categories)
          ? p.categories
          : p.categoryName
          ? [p.categoryName]
          : [];
        return pCats.some(
          (c) =>
            c?.toLowerCase() === target ||
            target.includes(c?.toLowerCase()) ||
            c?.toLowerCase().includes(target)
        );
      });
    }

    return baseList;
  }, [apiProducts, categoryName, storeParam]);

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
      <div className="h-[calc(100dvh-124px)] min-h-0 overflow-hidden bg-white lg:flex lg:h-[calc(100vh-108px)] lg:flex-col lg:pb-0">
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
    <div className="h-[calc(100dvh-124px)] min-h-0 overflow-hidden bg-white lg:flex lg:h-[calc(100vh-108px)] lg:flex-col lg:pb-0">
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
