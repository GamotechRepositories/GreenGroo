const ORDER_FILTERS = [
  { id: "all", label: "All orders" },
  { id: "active", label: "In progress" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "return", label: "Return" },
];

function OrdersDesktopHeader({
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onClearSearch,
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">My Orders</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track wholesale orders, download invoices, and reorder quickly
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by order ID or product name"
            className="w-full rounded-lg border border-border-light bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]"
          />
          {search ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-mobile-surface"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDER_FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange(item.id)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-[#2874F0] bg-[#2874F0]/10 text-[#2874F0]"
                    : "border-border-light bg-white text-text-secondary hover:border-[#2874F0]/40"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { OrdersDesktopHeader, ORDER_FILTERS };
