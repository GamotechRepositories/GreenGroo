import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerAllProducts, reviewManagerFarmerProduct } from "../../api/farmerApi";
import { isPendingProductApproval } from "../../utils/productActions";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

function orderCreatePath(product) {
  const params = new URLSearchParams({
    farmerId: product.farmerId || "",
    productId: product.id || product.productId || "",
  });
  return `/farmer/manager/orders/create?${params.toString()}`;
}

const ACTION_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 disabled:opacity-40";
const APPROVE_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-green-100 px-2 text-[10px] font-semibold text-green-700 whitespace-nowrap hover:bg-green-200 disabled:opacity-40";
const REJECT_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-red-100 px-2 text-[10px] font-semibold text-red-700 whitespace-nowrap hover:bg-red-200 disabled:opacity-40";

export default function ManagerProductsPage() {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllProducts();
      setFarmers(Array.isArray(data?.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch {
      setFarmers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const farmerName = (farmerId) => farmers.find((f) => f.id === farmerId || f.farmerId === farmerId)?.name || "—";

  const totalStockKg = products.reduce((sum, p) => {
    const gradesSum = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
    return sum + (gradesSum || Number(p.stock || 0));
  }, 0);
  const pendingCount = products.filter((p) => isPendingProductApproval(p.status)).length;
  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filtered = products.filter((p) => {
    if (selectedFarmerId && p.farmerId !== selectedFarmerId) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedStatus === "Pending Approval" && !isPendingProductApproval(p.status)) return false;
    if (selectedStatus && selectedStatus !== "Pending Approval" && p.status !== selectedStatus) return false;
    if (!q) return true;
    const query = q.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.productName?.toLowerCase().includes(query) ||
      p.variety?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      String(p.productId || p.id || "").toLowerCase().includes(query) ||
      farmerName(p.farmerId).toLowerCase().includes(query)
    );
  });

  const handleReview = async (product, decision) => {
    const id = product.id || product.productId;
    let reason = "";
    if (decision === "rejected") {
      const typed = window.prompt("Reason for rejection (optional)");
      if (typed === null) return;
      reason = typed;
    }
    setBusyId(id);
    try {
      await reviewManagerFarmerProduct(product.farmerId, id, decision, reason);
      toast.success(decision === "approved" ? "Product approved" : "Product rejected");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to review product");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>All Products</h1>
          <p className={EXCEL_PAGE_SUB}>Approve farmer products before they go live</p>
        </div>
        <Link to="/farmer/manager/farmers/add" className={`${EXCEL_BTN_PRIMARY} inline-block px-3 py-1.5 text-xs`}>
          + Add Farmer
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Products", value: products.length, color: "text-[#217346]" },
          { label: "Total Produce Stock", value: `${totalStockKg.toLocaleString("en-IN")} Kg`, color: "text-emerald-700" },
          { label: "Pending Approval", value: pendingCount, color: "text-amber-600" },
          { label: "Categories", value: allCategories.length || "—", color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`${EXCEL_PANEL} p-3`}>
            <p className="text-[11px] text-[#6B7280]">{s.label}</p>
            <p className={`mt-0.5 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product, ID, or farmer…"
          className={`${EXCEL_INPUT} max-w-xs`}
        />
        <select
          value={selectedFarmerId}
          onChange={(e) => setSelectedFarmerId(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[200px]`}
        >
          <option value="">All Farmers ({farmers.length})</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {allCategories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${EXCEL_INPUT} max-w-[160px]`}
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[180px]`}
        >
          <option value="">All Statuses</option>
          <option value="Pending Approval">Pending Approval ({pendingCount})</option>
          <option value="Active">Active</option>
          <option value="Rejected">Rejected</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>
          {products.length === 0 ? "No products yet." : "No matching products found"}
        </div>
      ) : (
        <div className={`${EXCEL_PANEL} overflow-x-auto`}>
          <table className="w-full min-w-[980px] text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                {["Product", "Variety", "Product ID", "Farmer", "Category", "Qty", "Harvest", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                ))}
                <th className="sticky right-0 z-20 whitespace-nowrap border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const id = p.id || p.productId;
                const totalQty = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0);
                const name = p.productName || p.name;
                return (
                  <tr key={id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {p.image ? (
                          <img src={p.image} alt={name} className="h-7 w-7 rounded border border-[#D4D4D4] object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                            {String(name || "P").charAt(0)}
                          </div>
                        )}
                        <Link to={orderCreatePath(p)} className="font-semibold text-[#217346] hover:underline">
                          {name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{p.variety || "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{formatProductBusinessId(p)}</td>
                    <td className="px-3 py-2.5">
                      <Link to={`/farmer/manager/farmers/${p.farmerId}`} className="font-semibold text-[#217346] hover:underline">
                        {p.farmerName || farmerName(p.farmerId)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {p.category} {p.subCategory ? `· ${p.subCategory}` : ""}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#217346]">
                      {totalQty} {p.unit || "Kg"}
                    </td>
                    <td className="px-3 py-2.5 text-[#6B7280]">
                      {p.harvestDate ? new Date(p.harvestDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          p.status === "Active" || p.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : isPendingProductApproval(p.status)
                              ? "bg-yellow-100 text-yellow-700"
                              : p.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status || "Draft"}
                      </span>
                    </td>
                    <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2.5">
                      <div className="flex flex-nowrap items-center justify-end gap-1">
                        <Link to={orderCreatePath(p)} className={ACTION_BTN}>
                          Create Order
                        </Link>
                        <Link to={`/farmer/manager/farmers/${p.farmerId}`} className={ACTION_BTN}>
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === id || !isPendingProductApproval(p.status)}
                          onClick={() => handleReview(p, "approved")}
                          className={APPROVE_BTN}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === id || !isPendingProductApproval(p.status)}
                          onClick={() => handleReview(p, "rejected")}
                          className={REJECT_BTN}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
