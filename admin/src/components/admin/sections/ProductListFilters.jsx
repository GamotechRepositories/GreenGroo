import { adminFilterInputClass } from "../adminStyles";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newly added" },
  { value: "name", label: "Sort by Name" },
  { value: "sku", label: "Sort by SKU" },
  { value: "price", label: "Sort by Price" },
  { value: "stock", label: "Sort by availability" },
  { value: "status", label: "Sort by status" },
  { value: "brand", label: "Sort by Brand" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "low_stock", label: "Low stock" },
];

function ProductListFilters({
  categories,
  totalCount,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts = null,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirToggle,
}) {
  const formatStatusLabel = (opt) => {
    if (!statusCounts || statusCounts[opt.value] == null) {
      return opt.label;
    }
    return `${opt.label} (${statusCounts[opt.value]})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <select
          id="product-category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`${adminFilterInputClass} min-w-0 flex-1`}
          aria-label="Filter by category"
        >
          <option value="all">All categories ({totalCount})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className={`${adminFilterInputClass} min-w-0 flex-1`}
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {formatStatusLabel(opt)}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className={`${adminFilterInputClass} min-w-0 flex-1`}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onSortDirToggle}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50"
          title={sortDir === "asc" ? "Ascending" : "Descending"}
          aria-label={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {sortDir === "asc" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search products by name, brand, or SKU..."
        className={`${adminFilterInputClass} w-full`}
      />
    </div>
  );
}

export default ProductListFilters;
