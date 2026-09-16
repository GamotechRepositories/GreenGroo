import { useBrandsQuery } from "../../hooks/queries/useBrandsQuery";

export const DEFAULT_PRODUCT_SORT = "newest";

export const PRODUCT_SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export function ProductFiltersBar({
  selectedBrand = "",
  onBrandChange,
  sortBy = "",
  onSortChange,
  maxPrice = "",
  onMaxPriceChange,
  onSale = false,
  onOnSaleChange,
  inStock = false,
  onInStockChange,
  showBrand = true,
  showSort = true,
  onClear,
  hasActiveFilters = false,
  className = "",
}) {
  const { data: brands = [], isLoading: brandsLoading } = useBrandsQuery();
  const brandNames = brands.map((brand) => brand.brandName).filter(Boolean);

  return (
    <div className={`flex flex-wrap items-center gap-2 bg-white px-2 py-2 sm:gap-3 sm:px-3 ${className}`}>
      {showBrand ? (
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange?.(e.target.value)}
          disabled={brandsLoading}
          aria-label="Brand name"
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 sm:h-9 sm:max-w-[150px] sm:flex-none sm:text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Brands</option>
          {brandNames.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      ) : null}

      {showSort ? (
        <select
          value={sortBy || DEFAULT_PRODUCT_SORT}
          onChange={(e) => onSortChange?.(e.target.value)}
          aria-label="Sort products"
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 sm:h-9 sm:max-w-[160px] sm:flex-none sm:text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {onMaxPriceChange ? (
        <select
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          aria-label="Max Price"
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 sm:h-9 sm:max-w-[140px] sm:flex-none sm:text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          <option value="">Any Price</option>
          <option value="50">Under ₹50</option>
          <option value="100">Under ₹100</option>
          <option value="500">Under ₹500</option>
          <option value="1000">Under ₹1000</option>
        </select>
      ) : null}

      {(onOnSaleChange || onInStockChange) && (
        <div className="flex items-center gap-4 px-1 py-1">
          {onOnSaleChange && (
            <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onSale}
                onChange={(e) => onOnSaleChange(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              On Sale
            </label>
          )}
          {onInStockChange && (
            <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => onInStockChange(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              In Stock Only
            </label>
          )}
        </div>
      )}

      {hasActiveFilters && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="h-9 shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 text-[11px] font-bold text-red-600 hover:bg-red-100 sm:text-xs transition-colors"
        >
          Clear All
        </button>
      ) : null}
    </div>
  );
}

export default ProductFiltersBar;
