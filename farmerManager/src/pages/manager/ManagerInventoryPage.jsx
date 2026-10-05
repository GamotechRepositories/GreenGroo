import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getManagerAllInventory,
  adjustFarmerStockByManager,
} from "../../api/farmerApi";
import { CopyButton } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import { formatProductBusinessId } from "../../utils/cropLinks";

function extractProductGrades(p = {}) {
  let gradeA = Number(p.gradeAQty || 0);
  let gradeB = Number(p.gradeBQty || 0);
  let gradeC = Number(p.gradeCQty || 0);

  if (Array.isArray(p.grades) && p.grades.length > 0) {
    p.grades.forEach((g) => {
      const label = String(g.label || g.grade || g.name || "").trim().toUpperCase();
      const q = Number(g.quantity ?? g.qty ?? 0);
      if (label.includes("A") && (q > 0 || gradeA === 0)) gradeA = q;
      else if (label.includes("B") && (q > 0 || gradeB === 0)) gradeB = q;
      else if (label.includes("C") && (q > 0 || gradeC === 0)) gradeC = q;
    });
  }

  const gradesTotal = gradeA + gradeB + gradeC;
  const stock = gradesTotal > 0 ? gradesTotal : Number(p.totalQuantity || p.stock || p.availableQuantity || 0);
  return { gradeA, gradeB, gradeC, totalStock: stock };
}

export default function ManagerInventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFarmer = searchParams.get("farmerId") || "";

  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(initialFarmer);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "in_stock" | "low_stock" | "out_of_stock"

  // Update Stock Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustAction, setAdjustAction] = useState("add"); // "add" | "reduce"
  const [selectedGrade, setSelectedGrade] = useState("Grade A");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("Harvest addition");
  const [customReason, setCustomReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadData = () => {
    setLoading(true);
    getManagerAllInventory()
      .then((invData) => {
        const fList = Array.isArray(invData?.farmers) ? invData.farmers : [];
        const rawProducts = Array.isArray(invData?.inventory) ? invData.inventory : [];

        // Build farmer map
        const fMap = new Map();
        fList.forEach((f) => {
          const fid = f.id || f.farmerId;
          if (fid) fMap.set(fid, f);
        });

        // Add any missing farmers from products
        rawProducts.forEach((p) => {
          if (p.farmerId && !fMap.has(p.farmerId)) {
            const newF = { id: p.farmerId, name: p.farmerName || p.farmerId };
            fMap.set(p.farmerId, newF);
            fList.push(newF);
          }
        });

        setFarmersList(fList);

        // Process products
        const processed = rawProducts.map((p) => {
          const { gradeA, gradeB, gradeC, totalStock } = extractProductGrades(p);
          const f = fMap.get(p.farmerId) || {};
          const bizId = formatProductBusinessId(p);

          // Stock status
          let status = "in_stock";
          if (totalStock <= 0) status = "out_of_stock";
          else if (totalStock < 50) status = "low_stock";

          return {
            ...p,
            id: p.id || p.productId || "",
            productId: p.productId || p.id || "",
            productName: p.productName || p.name || "Farm Produce",
            variety: p.variety || "Local",
            category: p.category || "Vegetables",
            cropLinked: p.cropName || p.crop || p.productName || p.name || "",
            displayBusinessId: bizId,
            unit: p.unit || "Kg",
            price: Number(p.price ?? p.marketPrice ?? 0),
            imageUrl: p.imageUrl || p.photo || p.image || "",
            farmerId: p.farmerId,
            farmerName: f.name || f.fullName || p.farmerName || p.farmerId || "—",
            farmerMobile: f.mobile || f.phone || "",
            farmerVillage: f.village || f.location || "",
            gradeA,
            gradeB,
            gradeC,
            totalStock,
            status,
          };
        });

        setAllProducts(processed);
      })
      .catch(() => {
        setFarmersList([]);
        setAllProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFarmerChange = (fid) => {
    setSelectedFarmerId(fid);
    const p = new URLSearchParams(searchParams);
    if (fid) p.set("farmerId", fid);
    else p.delete("farmerId");
    setSearchParams(p);
  };

  // Metrics across all products
  const countInStock = useMemo(() => allProducts.filter((p) => p.status === "in_stock").length, [allProducts]);
  const countLowStock = useMemo(() => allProducts.filter((p) => p.status === "low_stock").length, [allProducts]);
  const countOutOfStock = useMemo(() => allProducts.filter((p) => p.status === "out_of_stock").length, [allProducts]);
  const countAll = allProducts.length;

  // Filter products by selected farmer, status chip, and search query
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((p) => {
      // Farmer filter
      if (selectedFarmerId && p.farmerId !== selectedFarmerId) return false;

      // Status chip filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      // Search query
      if (!q) return true;
      const haystack = [
        p.productName,
        p.variety,
        p.category,
        p.cropLinked,
        p.displayBusinessId,
        p.farmerName,
        p.farmerId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [allProducts, selectedFarmerId, statusFilter, query]);

  // Group filtered products farmer-wise
  const farmerGroups = useMemo(() => {
    const map = new Map();

    filteredProducts.forEach((p) => {
      const fid = p.farmerId || "unknown";
      if (!map.has(fid)) {
        map.set(fid, {
          farmerId: fid,
          farmerName: p.farmerName || fid,
          farmerMobile: p.farmerMobile || "",
          farmerVillage: p.farmerVillage || "",
          products: [],
          totalStock: 0,
        });
      }
      const g = map.get(fid);
      g.products.push(p);
      g.totalStock += p.totalStock;
    });

    return Array.from(map.values()).sort((a, b) => b.totalStock - a.totalStock);
  }, [filteredProducts]);

  // Handle Stock Adjustment Submit
  const handleStockUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const qty = Number(adjustQuantity);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    const delta = adjustAction === "add" ? qty : -qty;
    const finalReason = adjustReason === "Other" ? customReason.trim() || "Manual adjustment" : adjustReason;

    try {
      setUpdating(true);
      await adjustFarmerStockByManager({
        farmerId: editingProduct.farmerId,
        productId: editingProduct.id || editingProduct.productId,
        change: delta,
        grade: selectedGrade,
        reason: finalReason,
        updatedBy: "Manager",
      });

      showToast(`Successfully ${delta > 0 ? "added" : "reduced"} ${qty} Kg of ${selectedGrade} for ${editingProduct.productName}`);
      setEditingProduct(null);
      setAdjustQuantity("");
      loadData(); // reload
    } catch (err) {
      alert(err.message || "Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#217346] px-4 py-3 text-white text-xs font-semibold shadow-lg animate-bounce">
          ✓ {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Inventory & Stock
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Farmer-wise available produce and live inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#217346] shadow-xs hover:bg-[#F0FDF4] transition"
          >
            🔄
          </button>
          <Link
            to="/manager/inventory/history"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#217346] shadow-xs hover:bg-[#F0FDF4] transition"
          >
            History →
          </Link>
        </div>
      </div>

      {/* 3 Metric Pills/Cards (Exact match from screenshot) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* In Stock */}
        <div
          onClick={() => setStatusFilter("in_stock")}
          className={`cursor-pointer rounded-2xl border p-3 sm:p-4 transition ${
            statusFilter === "in_stock"
              ? "border-[#217346] ring-2 ring-[#217346]/20 bg-[#ECFDF5]"
              : "border-[#A7F3D0] bg-[#ECFDF5]/80 hover:bg-[#ECFDF5]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
            <span>✓</span>
            <span>In Stock</span>
          </div>
          <p className="mt-1 text-2xl font-black text-[#065F46] sm:text-3xl tabular-nums">
            {countInStock}
          </p>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => setStatusFilter("low_stock")}
          className={`cursor-pointer rounded-2xl border p-3 sm:p-4 transition ${
            statusFilter === "low_stock"
              ? "border-[#D97706] ring-2 ring-[#D97706]/20 bg-[#FFFBEB]"
              : "border-[#FDE68A] bg-[#FFFBEB]/80 hover:bg-[#FFFBEB]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
            <span>⚠</span>
            <span>Low Stock</span>
          </div>
          <p className="mt-1 text-2xl font-black text-[#92400E] sm:text-3xl tabular-nums">
            {countLowStock}
          </p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter("out_of_stock")}
          className={`cursor-pointer rounded-2xl border p-3 sm:p-4 transition ${
            statusFilter === "out_of_stock"
              ? "border-[#DC2626] ring-2 ring-[#DC2626]/20 bg-[#FEF2F2]"
              : "border-[#FECACA] bg-[#FEF2F2]/80 hover:bg-[#FEF2F2]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#DC2626]">
            <span>⨂</span>
            <span>Out of Stock</span>
          </div>
          <p className="mt-1 text-2xl font-black text-[#DC2626] sm:text-3xl tabular-nums">
            {countOutOfStock}
          </p>
        </div>
      </div>

      {/* Search Input & Farmer Filter */}
      <div className="space-y-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#94A3B8]">
            🔍
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, variety, or ID..."
            className="h-11 w-full rounded-2xl border border-[#E2E8F0] bg-white pl-9 pr-8 text-xs text-[#0F172A] shadow-xs outline-none transition placeholder:text-[#94A3B8] focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/20 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Farmer Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748B] shrink-0 uppercase tracking-wide">Farmer:</span>
          <select
            value={selectedFarmerId}
            onChange={(e) => handleFarmerChange(e.target.value)}
            className="h-9 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] shadow-xs outline-none focus:border-[#217346] cursor-pointer"
          >
            <option value="">All Farmers ({farmersList.length})</option>
            {farmersList.map((f) => {
              const fid = f.id || f.farmerId;
              const fname = f.name || f.fullName || fid;
              return (
                <option key={fid} value={fid}>
                  {fname} ({fid})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Filter Chips (Exact match from screenshot) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer ${
            statusFilter === "all"
              ? "bg-[#217346] text-white shadow-xs"
              : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          All ({countAll})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("in_stock")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer ${
            statusFilter === "in_stock"
              ? "bg-[#217346] text-white shadow-xs"
              : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          In Stock ({countInStock})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("low_stock")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer ${
            statusFilter === "low_stock"
              ? "bg-[#217346] text-white shadow-xs"
              : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          Low Stock ({countLowStock})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("out_of_stock")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer ${
            statusFilter === "out_of_stock"
              ? "bg-[#217346] text-white shadow-xs"
              : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          Out of Stock ({countOutOfStock})
        </button>
      </div>

      {/* Main Content Area - FARMER-WISE DISPLAY */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-[#64748B]">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-[#217346] border-t-transparent mb-2" />
          <p className="font-semibold">Loading farmer inventory…</p>
        </div>
      ) : farmerGroups.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Check your search query or select another filter."
        />
      ) : (
        <div className="space-y-6">
          {farmerGroups.map((group) => (
            <div key={group.farmerId} className="space-y-3">
              {/* Farmer Header Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2.5 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#217346] font-bold text-white text-sm shadow-xs">
                    {(group.farmerName.charAt(0) || "F").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#065F46] text-sm sm:text-base truncate">
                        {group.farmerName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#065F46] border border-[#A7F3D0]">
                        {group.farmerId}
                        <CopyButton value={group.farmerId} />
                      </span>
                    </div>
                    {(group.farmerMobile || group.farmerVillage) && (
                      <p className="text-[11px] text-[#065F46]/80 truncate">
                        {[group.farmerMobile, group.farmerVillage].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase text-[#065F46] block">Farmer Total</span>
                  <span className="text-sm font-black text-[#065F46] tabular-nums">
                    {group.totalStock.toLocaleString("en-IN")} Kg
                  </span>
                </div>
              </div>

              {/* Product Cards for this Farmer */}
              <div className="space-y-3">
                {group.products.map((product) => {
                  const stock = product.totalStock;
                  const unit = product.unit || "Kg";

                  // Status badge styling
                  let statusBg = "bg-[#D1FAE5]";
                  let statusColor = "text-[#059669]";
                  let statusText = "In Stock";
                  if (stock <= 0) {
                    statusBg = "bg-[#FEE2E2]";
                    statusColor = "text-[#DC2626]";
                    statusText = "Out of Stock";
                  } else if (stock < 50) {
                    statusBg = "bg-[#FEF3C7]";
                    statusColor = "text-[#D97706]";
                    statusText = "Low Stock";
                  }

                  const subtitle = [product.variety, product.category, product.cropLinked]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <div
                      key={product.id || product.displayBusinessId}
                      className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 sm:p-4 shadow-xs hover:border-[#217346]/40 transition"
                    >
                      {/* Top Row: Thumbnail, Name, Business ID, Status Badges */}
                      <div className="flex items-start gap-3">
                        {/* Product Thumbnail */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] border border-slate-100 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981] text-xl">
                              🌿
                            </div>
                          )}
                        </div>

                        {/* Name & Meta */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm sm:text-base font-bold text-[#0F172A]">
                              {product.productName}
                            </h3>
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${statusBg} ${statusColor}`}
                            >
                              {statusText}
                            </span>
                          </div>

                          <p className="truncate text-[11px] text-[#64748B] mt-0.5 font-medium">
                            {subtitle}
                          </p>

                          {/* Business ID with copy */}
                          <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-bold text-[#059669]">
                            <span className="truncate">{product.displayBusinessId}</span>
                            <CopyButton value={product.displayBusinessId} />
                          </div>
                        </div>
                      </div>

                      {/* Total Stock Highlight Box (Exact match from screenshot) */}
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5">
                        <div>
                          <p className="text-[11px] font-semibold text-[#64748B]">Total Available Stock</p>
                          <div className="mt-0.5 flex items-baseline gap-1">
                            <span
                              className={`text-lg sm:text-xl font-black tabular-nums ${
                                stock <= 0 ? "text-[#DC2626]" : "text-[#1E293B]"
                              }`}
                            >
                              {stock.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs font-bold text-[#64748B]">{unit}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-[#64748B]">Price / Unit</p>
                          <p className="mt-0.5 text-base sm:text-lg font-bold text-[#059669] tabular-nums">
                            ₹{product.price.toLocaleString("en-IN")} / {unit}
                          </p>
                        </div>
                      </div>

                      {/* Grade Breakdown Boxes (Exact match from screenshot) */}
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {/* Grade A */}
                        <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-2 text-center">
                          <p className="text-[10px] sm:text-[11px] font-semibold text-[#065F46]">Grade A</p>
                          <p className="mt-0.5 text-xs sm:text-[13px] font-black text-[#065F46] tabular-nums">
                            {product.gradeA > 0 ? `${product.gradeA.toLocaleString("en-IN")} ${unit}` : "—"}
                          </p>
                        </div>

                        {/* Grade B */}
                        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-2 text-center">
                          <p className="text-[10px] sm:text-[11px] font-semibold text-[#1E40AF]">Grade B</p>
                          <p className="mt-0.5 text-xs sm:text-[13px] font-black text-[#1E40AF] tabular-nums">
                            {product.gradeB > 0 ? `${product.gradeB.toLocaleString("en-IN")} ${unit}` : "—"}
                          </p>
                        </div>

                        {/* Grade C */}
                        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-2 text-center">
                          <p className="text-[10px] sm:text-[11px] font-semibold text-[#92400E]">Grade C</p>
                          <p className="mt-0.5 text-xs sm:text-[13px] font-black text-[#92400E] tabular-nums">
                            {product.gradeC > 0 ? `${product.gradeC.toLocaleString("en-IN")} ${unit}` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Action Row: Update Stock + History Arrow (Exact match from screenshot) */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setSelectedGrade("Grade A");
                            setAdjustAction("add");
                            setAdjustQuantity("");
                            setAdjustReason("Harvest addition");
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#217346] bg-white py-2.5 text-xs font-bold text-[#217346] shadow-xs hover:bg-[#F0FDF4] transition cursor-pointer"
                        >
                          <span>✏️</span>
                          <span>Update Stock</span>
                        </button>

                        <button
                          type="button"
                          title="View Product History"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set("farmerId", product.farmerId);
                            if (product.productId) params.set("productId", product.productId);
                            if (product.productName) params.set("name", product.productName);
                            navigate(`/manager/inventory/history?${params.toString()}`);
                          }}
                          className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        >
                          <span className="text-sm font-black">›</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPDATE STOCK MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Update Stock</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {editingProduct.productName} · <span className="font-semibold text-[#217346]">{editingProduct.farmerName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockUpdateSubmit} className="mt-4 space-y-4">
              {/* Grade Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Select Grade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Grade A", qty: editingProduct.gradeA },
                    { label: "Grade B", qty: editingProduct.gradeB },
                    { label: "Grade C", qty: editingProduct.gradeC },
                  ].map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setSelectedGrade(g.label)}
                      className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                        selectedGrade === g.label
                          ? "border-[#217346] bg-[#ECFDF5] font-bold text-[#065F46] ring-1 ring-[#217346]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold">{g.label}</span>
                      <span className="block text-[10px] text-slate-500 tabular-nums">
                        Curr: {g.qty} {editingProduct.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action: Add or Deduct */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction("add")}
                    className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                      adjustAction === "add"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    + Add Stock (आवक)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction("reduce")}
                    className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                      adjustAction === "reduce"
                        ? "border-red-600 bg-red-50 text-red-800 ring-1 ring-red-600"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    - Deduct Stock (जावक)
                  </button>
                </div>
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Quantity ({editingProduct.unit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder={`Enter ${editingProduct.unit} quantity...`}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/20"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#217346] cursor-pointer"
                >
                  <option value="Harvest addition">Harvest addition (नवीन कापणी आवक)</option>
                  <option value="Quality grading inward">Quality grading inward (प्रतवारी आवक)</option>
                  <option value="Physical count correction">Physical count correction (स्टॉक मोजणी दुरुस्ती)</option>
                  <option value="Wastage / Damage">Wastage / Damage (खराब / नासाडी जावक)</option>
                  <option value="Direct dispatch">Direct dispatch (थेट विक्री/पाठवणे)</option>
                  <option value="Other">Other (इतर)</option>
                </select>
                {adjustReason === "Other" && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="mt-2 h-9 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-[#217346]"
                  />
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 rounded-xl bg-[#217346] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1b5e39] disabled:opacity-50"
                >
                  {updating ? "Saving…" : "Confirm Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
