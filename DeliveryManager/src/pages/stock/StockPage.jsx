import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function StockPage() {
  const { manager } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <PageShell title="Stock" subtitle={`${manager?.storeName || "Store"} inventory`}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          Store inventory ({inventory.length} products)
        </h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading stock…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="pb-2">SKU</th>
                <th className="pb-2">Product</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-2.5 text-xs text-gray-500">{row.sku}</td>
                  <td className="py-2.5 font-medium text-gray-900">{row.name}</td>
                  <td className="py-2.5 text-gray-600">{row.category}</td>
                  <td className="py-2.5">
                    <span
                      className={
                        row.stockCount === 0
                          ? "font-semibold text-red-600"
                          : row.isLowStock
                            ? "font-semibold text-orange-600"
                            : "text-gray-800"
                      }
                    >
                      {row.stockCount} {row.unit}
                    </span>
                  </td>
                  <td className="py-2.5">₹{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
