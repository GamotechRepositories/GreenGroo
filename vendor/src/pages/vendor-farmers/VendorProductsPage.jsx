import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ProductManagerLayout";
import { vendorApi } from "../../api/vendorApi";

function isPending(status) {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  return s === "pending approval" || s === "pending";
}

function statusClass(status) {
  if (status === "Active" || status === "Approved") return "bg-green-100 text-green-700";
  if (isPending(status)) return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

export default function VendorProductsPage() {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Approval");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts();
      const data = res.data || {};
      setFarmers(Array.isArray(data.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data.products) ? data.products : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
      setFarmers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = products.filter((p) => isPending(p.status)).length;

  const farmerName = useMemo(() => {
    const map = new Map(farmers.map((f) => [f.id, f.name]));
    return (farmerId) => map.get(farmerId) || "—";
  }, [farmers]);

  const filtered = products.filter((p) => {
    if (statusFilter === "Pending Approval" && !isPending(p.status)) return false;
    if (statusFilter && statusFilter !== "Pending Approval" && p.status !== statusFilter) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      String(p.name || p.productName || "").toLowerCase().includes(needle) ||
      String(p.productId || p.id || "").toLowerCase().includes(needle) ||
      String(farmerName(p.farmerId)).toLowerCase().includes(needle)
    );
  });

  const review = async (product, decision) => {
    const id = product.id || product.productId;
    let reason = "";
    if (decision === "rejected") {
      const typed = window.prompt("Reason for rejection (optional)");
      if (typed === null) return;
      reason = typed;
    }
    setBusyId(id);
    try {
      await vendorApi.reviewFarmerProduct(product.farmerId, id, decision, reason);
      setToast(decision === "approved" ? "Product approved" : "Product rejected");
      await load();
    } catch (err) {
      setToast(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId("");
      window.setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <PageShell title="Farmer Products" subtitle="Approve products published by farmers before they go live">
      {toast ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total products</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-800">Pending approval</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Farmers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{farmers.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product or farmer…"
          className="max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#217346]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#217346]"
        >
          <option value="">All Statuses</option>
          <option value="Pending Approval">Pending Approval ({pendingCount})</option>
          <option value="Active">Active</option>
          <option value="Rejected">Rejected</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F2F2F2] text-left">
              {["Product", "Product ID", "Farmer", "Qty", "Status", "Action"].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#6B7280]">
                  Loading products…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#6B7280]">
                  No products in this filter
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const id = p.id || p.productId;
                const qty = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0);
                return (
                  <tr key={id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5 font-semibold">{p.productName || p.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{p.productId || p.id || "—"}</td>
                    <td className="px-3 py-2.5">
                      <Link to={`/vendor/all-farmers/${p.farmerId}`} className="font-semibold text-[#217346] hover:underline">
                        {farmerName(p.farmerId)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      {qty} {p.unit || "Kg"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusClass(p.status)}`}>
                        {p.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {isPending(p.status) ? (
                        <div className="flex flex-nowrap items-center gap-1">
                          <button
                            type="button"
                            disabled={busyId === id}
                            onClick={() => review(p, "approved")}
                            className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === id}
                            onClick={() => review(p, "rejected")}
                            className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
