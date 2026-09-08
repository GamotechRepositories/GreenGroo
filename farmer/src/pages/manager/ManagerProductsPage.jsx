import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerAllProducts, reviewManagerFarmerProduct } from "../../api/farmerApi";
import { isPendingProductApproval } from "../../utils/productActions";
import { formatProductBusinessId } from "../../utils/cropLinks";
import CopyId from "../../components/ui/CopyId";
import StatusBadge from "../../components/ui/StatusBadge";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function productGroupKey(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id.toUpperCase();
  return `${productNameOf(item).trim().toLowerCase()}|${String(item.variety || "").trim().toLowerCase()}`;
}

function productQty(product) {
  const gradesSum = (product.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product.availableQuantity ?? product.stock ?? 0);
}

function productFarmersPath(product) {
  const key = productGroupKey(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId = [product.productId, product.id].find((v) => isBusinessProductId(v)) || product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/farmer/manager/products/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

function orderCreatePath(product) {
  const params = new URLSearchParams({
    farmerId: product.farmerId || "",
    productId: product.id || product.productId || "",
  });
  return `/farmer/manager/orders/create?${params.toString()}`;
}

function statusPriority(status) {
  if (isPendingProductApproval(status)) return 0;
  if (status === "Rejected") return 1;
  if (status === "Draft" || status === "Paused") return 2;
  return 3;
}

function groupByProduct(items) {
  const map = new Map();
  for (const p of items) {
    const key = productGroupKey(p);
    const qty = productQty(p);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...p,
        groupKey: key,
        listings: [p],
        totalQty: qty,
      });
      continue;
    }
    existing.listings.push(p);
    existing.totalQty += qty;
    if (statusPriority(p.status) < statusPriority(existing.status)) {
      existing.status = p.status;
    }
    if (!existing.image && p.image) existing.image = p.image;
  }
  return Array.from(map.values());
}

const ACTION_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 disabled:opacity-40";
const APPROVE_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-green-100 px-2 text-[10px] font-semibold text-green-700 whitespace-nowrap hover:bg-green-200 disabled:opacity-40";
const REJECT_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-red-100 px-2 text-[10px] font-semibold text-red-700 whitespace-nowrap hover:bg-red-200 disabled:opacity-40";
const MOBILE_BTN =
  "inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700";
const MOBILE_APPROVE =
  "inline-flex h-9 w-full items-center justify-center rounded-lg bg-green-100 px-2 text-[11px] font-semibold text-green-700 disabled:opacity-40";
const MOBILE_REJECT =
  "inline-flex h-9 w-full items-center justify-center rounded-lg bg-red-100 px-2 text-[11px] font-semibold text-red-700 disabled:opacity-40";

function productThumb(p, name) {
  if (p.image) {
    return <img src={p.image} alt={name} className="h-12 w-12 shrink-0 rounded-xl border border-[#D4D4D4] object-cover" />;
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-sm font-bold text-[#217346]">
      {String(name || "P").charAt(0)}
    </div>
  );
}

function ProductMobileCard({ p, busyId, onReview }) {
  const listings = p.listings || [p];
  const single = listings.length === 1 ? listings[0] : null;
  const reviewId = single ? single.id || single.productId : "";
  const canReview = Boolean(single && isPendingProductApproval(single.status));
  const name = productNameOf(p);
  const farmersPath = productFarmersPath(p);
  const createPath = single ? orderCreatePath(single) : farmersPath;
  const farmerCount = new Set(listings.map((item) => item.farmerId).filter(Boolean)).size;
  return (
    <article className={`${EXCEL_PANEL} p-3`}>
      <div className="flex items-start gap-2.5">
        {productThumb(p, name)}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={farmersPath} className="min-w-0 truncate text-[13px] font-bold text-[#217346]">
              {name}
              {p.variety ? <span className="font-medium text-[#6B7280]"> · {p.variety}</span> : null}
            </Link>
            <StatusBadge status={p.status || "Draft"} className="max-w-[46%] shrink-0" />
          </div>
          <CopyId
            value={formatProductBusinessId(p)}
            className="mt-0.5"
            textClassName="font-mono text-[10px] text-emerald-700"
            breakAll
          />
          <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
            {[p.category, p.subCategory].filter(Boolean).join(" · ") || "—"}
            {" · "}
            <span className="font-semibold text-[#217346]">
              {Number(p.totalQty || 0).toLocaleString("en-IN")} {p.unit || "Kg"}
            </span>
            {farmerCount > 1 ? ` · ${farmerCount} farmers` : ""}
          </p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <Link to={createPath} className={MOBILE_BTN}>
          Create Order
        </Link>
        <Link to={farmersPath} className={MOBILE_BTN}>
          View
        </Link>
        <button
          type="button"
          disabled={busyId === reviewId || !canReview}
          onClick={() => onReview(single, "approved")}
          className={MOBILE_APPROVE}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busyId === reviewId || !canReview}
          onClick={() => onReview(single, "rejected")}
          className={MOBILE_REJECT}
        >
          Reject
        </button>
      </div>
    </article>
  );
}

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

  const totalStockKg = products.reduce((sum, p) => sum + productQty(p), 0);
  const pendingCount = products.filter((p) => isPendingProductApproval(p.status)).length;
  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const uniqueProductCount = useMemo(() => groupByProduct(products).length, [products]);

  const filtered = useMemo(() => {
    const listings = products.filter((p) => {
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
        farmerName(p.farmerId).toLowerCase().includes(query) ||
        String(p.farmerName || "").toLowerCase().includes(query)
      );
    });
    return groupByProduct(listings);
  }, [products, farmers, selectedFarmerId, selectedCategory, selectedStatus, q]);

  const handleReview = async (product, decision) => {
    if (!product) return;
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
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>All Products</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden md:block`}>Approve farmer products before they go live</p>
        </div>
        <Link
          to="/farmer/manager/products/add"
          className={`${EXCEL_BTN_PRIMARY} inline-flex h-9 shrink-0 items-center justify-center px-3 text-xs md:inline-block md:h-auto md:py-1.5`}
        >
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Total Products", value: uniqueProductCount, color: "text-[#217346]" },
          { label: "Total Produce Stock", value: `${totalStockKg.toLocaleString("en-IN")} Kg`, color: "text-emerald-700" },
          { label: "Pending Approval", value: pendingCount, color: "text-amber-600" },
          { label: "Categories", value: allCategories.length || "—", color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`${EXCEL_PANEL} min-w-0 p-2.5 sm:p-3`}>
            <p className="text-[11px] leading-tight text-[#6B7280]">{s.label}</p>
            <p className={`mt-0.5 break-words text-lg font-bold sm:text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product, ID, or farmer…"
          className={`${EXCEL_INPUT} md:max-w-xs`}
        />
        <div className="grid grid-cols-3 gap-1.5 md:contents">
          <select
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            className={`${EXCEL_INPUT} min-w-0 !px-1.5 !py-2 !text-[11px] md:max-w-[200px] md:!px-3 md:!py-2.5 md:!text-sm`}
          >
            <option value="">All Farmers ({farmers.length})</option>
            {farmers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${EXCEL_INPUT} min-w-0 !px-1.5 !py-2 !text-[11px] md:max-w-[160px] md:!px-3 md:!py-2.5 md:!text-sm`}
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`${EXCEL_INPUT} min-w-0 !px-1.5 !py-2 !text-[11px] md:max-w-[180px] md:!px-3 md:!py-2.5 md:!text-sm`}
          >
            <option value="">All Statuses</option>
            <option value="Pending Approval">Pending Approval ({pendingCount})</option>
            <option value="Active">Active</option>
            <option value="Rejected">Rejected</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>
          {products.length === 0 ? "No products yet." : "No matching products found"}
        </div>
      ) : (
        <>
          <div className="space-y-2.5 md:hidden">
            {filtered.map((p) => (
              <ProductMobileCard key={p.groupKey} p={p} busyId={busyId} onReview={handleReview} />
            ))}
          </div>
          <div className={`${EXCEL_PANEL} hidden overflow-x-auto md:block`}>
          <table className="w-full min-w-[780px] text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                {["Product", "Variety", "Product ID", "Category", "Qty", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                ))}
                <th className="sticky right-0 z-20 whitespace-nowrap border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const listings = p.listings || [p];
                const single = listings.length === 1 ? listings[0] : null;
                const reviewId = single ? single.id || single.productId : "";
                const canReview = Boolean(single && isPendingProductApproval(single.status));
                const name = productNameOf(p);
                const farmersPath = productFarmersPath(p);
                const createPath = single ? orderCreatePath(single) : farmersPath;
                return (
                  <tr key={p.groupKey} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {p.image ? (
                          <img src={p.image} alt={name} className="h-7 w-7 rounded border border-[#D4D4D4] object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                            {String(name || "P").charAt(0)}
                          </div>
                        )}
                        <Link to={farmersPath} className="font-semibold text-[#217346] hover:underline">
                          {name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{p.variety || "—"}</td>
                    <td className="px-3 py-2.5">
                      <CopyId value={formatProductBusinessId(p)} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {p.category} {p.subCategory ? `· ${p.subCategory}` : ""}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#217346]">
                      {Number(p.totalQty || 0).toLocaleString("en-IN")} {p.unit || "Kg"}
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
                        <Link to={createPath} className={ACTION_BTN}>
                          Create Order
                        </Link>
                        <Link to={farmersPath} className={ACTION_BTN}>
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === reviewId || !canReview}
                          onClick={() => handleReview(single, "approved")}
                          className={APPROVE_BTN}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === reviewId || !canReview}
                          onClick={() => handleReview(single, "rejected")}
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
        </>
      )}
    </div>
  );
}
