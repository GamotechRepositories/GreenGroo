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
  showBrand = true,
  showSort = true,
  onClear,
  hasActiveFilters = false,
  className = "",
}) {
  const { data: brands = [], isLoading: brandsLoading } = useBrandsQuery();
  const brandNames = brands.map((brand) => brand.brandName).filter(Boolean);

  return (
    <div className={`flex flex-nowrap items-center gap-1.5 bg-white px-2 py-1.5 sm:gap-2 sm:px-3 ${className}`}>
      {showBrand ? (
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange?.(e.target.value)}
          disabled={brandsLoading}
          aria-label="Brand name"
          className="h-8 min-w-0 flex-1 rounded-md border border-border-light bg-white px-1.5 text-[11px] text-text-primary sm:h-8 sm:max-w-[140px] sm:flex-none sm:px-2 sm:text-xs"
        >
          <option value="">all brands</option>
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
          className="h-8 min-w-0 flex-1 rounded-md border border-border-light bg-white px-1.5 text-[11px] text-text-primary sm:h-8 sm:max-w-[160px] sm:flex-none sm:px-2 sm:text-xs"
        >
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {hasActiveFilters && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="h-8 shrink-0 rounded-md border border-border-light px-2 text-[10px] font-semibold text-text-secondary sm:px-2.5 sm:text-xs"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export default ProductFiltersBar;
