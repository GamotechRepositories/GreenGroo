import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

export default function StockPage() {
  const { manager } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await managerApi.inventory();
      setInventory(res.data.inventory || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = Array.from(new Set(inventory.map((i) => i.category).filter(Boolean)));

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell
      title="Store Stock & Inventory Management"
      subtitle={`Real-time item availability & catalog pricing for ${manager?.storeName || "Dark Store"}`}
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Action Header & Search */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Catalog Inventory ({filteredInventory.length} Products)
            </h2>
            <p className="text-xs text-slate-500">Live inventory levels linked to customer ordering app</p>
          </div>

          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Refresh Inventory
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-2 text-xs text-slate-400">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : filteredInventory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <h3 className="text-base font-bold text-slate-800">No Matching Stock Items</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or category filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-black text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-2 px-4">SKU Code</th>
                <th className="py-2 px-4">Product Name</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4">Stock Level</th>
                <th className="py-2 px-4 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((row) => {
                const isZero = row.stockCount === 0;
                const isLow = row.isLowStock;

                return (
                  <tr key={row.id || row.sku} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 font-semibold text-[11px]">
                      {row.sku}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                        {row.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isZero ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Out of Stock (0 {row.unit})
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          Low Stock ({row.stockCount} {row.unit})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {row.stockCount} {row.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      ₹{row.price}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
