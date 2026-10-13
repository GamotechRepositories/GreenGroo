import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ListFilter,
} from "lucide-react";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";
import {
  formatProductId,
  isPendingProduct,
  productNameOf,
  productStatusClass,
} from "../../utils/productList";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";
const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#217346]";

function productThumb(p, name) {
  if (p.image) {
    return (
      <img
        src={p.image}
        alt={name}
        loading="lazy"
        decoding="async"
        className="h-11 w-11 shrink-0 rounded-xl border border-[#D4D4D4] object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-sm font-bold text-[#217346]">
      {String(name || "P").charAt(0).toUpperCase()}
    </div>
  );
}

export default function VendorProductsPage() {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [q, setQ] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState("farmer-wise"); // 'farmer-wise' | 'all-products'
  const [expandedFarmers, setExpandedFarmers] = useState(new Set());
  const [busyId, setBusyId] = useState("");

  // Reject Modal state
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    product: null,
    reason: "",
    submitting: false,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: "", type: "info" }), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts();
      const data = res.data || {};
      const farmersList = Array.isArray(data.farmers) ? data.farmers : [];
      const productsList = Array.isArray(data.products) ? data.products : [];
      setFarmers(farmersList);
      setProducts(productsList);

      // Expand all farmers by default
      const allFarmerIds = new Set(farmersList.map((f) => f.id || f.farmerId).filter(Boolean));
      productsList.forEach((p) => {
        if (p.farmerId) allFarmerIds.add(p.farmerId);
      });
      setExpandedFarmers(allFarmerIds);
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
    loadData();
  }, []);

  const getFarmerInfo = (farmerId) => {
    const f = farmers.find((item) => item.id === farmerId || item.farmerId === farmerId);
    return {
      id: farmerId,
      name: f?.name || f?.farmerName || "Farmer",
      mobile: f?.mobile || f?.phone || "",
      farmLocation: f?.farmLocation || f?.farmName || f?.village || "",
      district: f?.district || "",
    };
  };

  const pendingCount = useMemo(() => {
    return products.filter((p) => isPendingProduct(p.status)).length;
  }, [products]);

  const activeCount = useMemo(() => {
    return products.filter((p) => p.status === "Active" || p.status === "Approved").length;
  }, [products]);

  const rejectedCount = useMemo(() => {
    return products.filter((p) => p.status === "Rejected").length;
  }, [products]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  // Filter listings
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedFarmerId && p.farmerId !== selectedFarmerId) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedStatus === "Pending Approval" && !isPendingProduct(p.status)) return false;
      if (selectedStatus && selectedStatus !== "Pending Approval" && p.status !== selectedStatus) return false;
      if (!q) return true;

      const query = q.toLowerCase();
      const fInfo = getFarmerInfo(p.farmerId);
      return (
        p.name?.toLowerCase().includes(query) ||
        p.productName?.toLowerCase().includes(query) ||
        p.variety?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        String(p.productId || p.id || "").toLowerCase().includes(query) ||
        fInfo.name.toLowerCase().includes(query) ||
        fInfo.id.toLowerCase().includes(query) ||
        String(fInfo.mobile || "").includes(query)
      );
    });
  }, [products, farmers, selectedFarmerId, selectedCategory, selectedStatus, q]);

  // Group filtered products by Farmer
  const farmerGroups = useMemo(() => {
    const map = new Map();

    filteredProducts.forEach((p) => {
      const fid = p.farmerId || "other";
      if (!map.has(fid)) {
        const fInfo = getFarmerInfo(fid);
        map.set(fid, {
          farmerId: fid,
          farmerName: fInfo.name || p.farmerName || "Farmer",
          mobile: fInfo.mobile,
          farmLocation: fInfo.farmLocation,
          district: fInfo.district,
          products: [],
          pendingCount: 0,
        });
      }
      const group = map.get(fid);
      group.products.push(p);
      if (isPendingProduct(p.status)) {
        group.pendingCount += 1;
      }
    });

    return Array.from(map.values());
  }, [filteredProducts, farmers]);

  const toggleFarmerExpand = (farmerId) => {
    setExpandedFarmers((prev) => {
      const next = new Set(prev);
      if (next.has(farmerId)) {
        next.delete(farmerId);
      } else {
        next.add(farmerId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFarmers(new Set(farmerGroups.map((g) => g.farmerId)));
  };

  const collapseAll = () => {
    setExpandedFarmers(new Set());
  };

  // Review (Approve / Reject) Actions
  const handleApprove = async (product) => {
    if (!product) return;
    const id = product.id || product.productId;
    const farmerId = product.farmerId;
    if (!farmerId) {
      showToast("Farmer ID is missing for this product.", "error");
      return;
    }

    setBusyId(id);
    try {
      await vendorApi.reviewFarmerProduct(farmerId, id, "approved", "");
      showToast(`Product "${productNameOf(product)}" approved successfully!`, "success");
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve product", "error");
    } finally {
      setBusyId("");
    }
  };

  const openRejectModal = (product) => {
    setRejectModal({
      isOpen: true,
      product,
      reason: "",
      submitting: false,
    });
  };

  const confirmReject = async () => {
    const { product, reason } = rejectModal;
    if (!product) return;
    const id = product.id || product.productId;
    const farmerId = product.farmerId;

    setRejectModal((prev) => ({ ...prev, submitting: true }));
    setBusyId(id);
    try {
      await vendorApi.reviewFarmerProduct(farmerId, id, "rejected", reason);
      showToast(`Product "${productNameOf(product)}" has been rejected.`, "info");
      setRejectModal({ isOpen: false, product: null, reason: "", submitting: false });
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject product", "error");
      setRejectModal((prev) => ({ ...prev, submitting: false }));
    } finally {
      setBusyId("");
    }
  };

  const quickRejectReasons = [
    "Quality does not meet standard",
    "Produce not currently required",
    "Duplicate product submission",
    "Incorrect product details",
  ];

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Farmer Products
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Farmer-Wise
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            Review, approve, or reject produce listings submitted by your farmers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/vendor/farmer-products/add"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#217346] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#1a5c38] transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : toast.type === "info"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
        <div className={`${PANEL} p-3 sm:p-4 border-l-4 border-l-blue-600`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">Farmers Active</span>
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-slate-800 sm:text-2xl">
            {farmerGroups.length} <span className="text-xs font-normal text-gray-500">/ {farmers.length}</span>
          </p>
          <span className="text-[10px] text-gray-400">Total registered farmers</span>
        </div>

        <div className={`${PANEL} p-3 sm:p-4 border-l-4 border-l-emerald-600`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">Total Products</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-emerald-700 sm:text-2xl">
            {products.length}
          </p>
          <span className="text-[10px] text-gray-400">Farmer product listings</span>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === "Pending Approval" ? "" : "Pending Approval")}
          className={`${PANEL} p-3 sm:p-4 border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50/40 transition-colors ${
            selectedStatus === "Pending Approval" ? "ring-2 ring-amber-400" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-800">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1 flex items-baseline gap-2 text-xl font-extrabold text-amber-600 sm:text-2xl">
            {pendingCount}
            {pendingCount > 0 && (
              <span className="inline-block animate-pulse text-[10px] font-semibold text-amber-700">
                Action required
              </span>
            )}
          </p>
          <span className="text-[10px] text-amber-600">Click to filter pending</span>
        </div>

        <div className={`${PANEL} p-3 sm:p-4 border-l-4 border-l-[#217346]`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">Active / Approved</span>
            <CheckCircle2 className="h-4 w-4 text-[#217346]" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-[#217346] sm:text-2xl">
            {activeCount}
          </p>
          <span className="text-[10px] text-gray-400">{rejectedCount} Rejected</span>
        </div>
      </div>

      {/* Filter Bar & View Toggle */}
      <div className={`${PANEL} p-3 sm:p-4 space-y-3`}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by product name, ID, farmer name, mobile..."
              className={`${INPUT} pl-9`}
            />
          </div>

          {/* Select Filters */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            {/* Filter by Farmer */}
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className={`${INPUT} min-w-[150px] !py-2 text-xs`}
            >
              <option value="">All Farmers ({farmers.length})</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Filter by Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${INPUT} min-w-[130px] !py-2 text-xs`}
            >
              <option value="">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${INPUT} min-w-[140px] !py-2 text-xs`}
            >
              <option value="">All Statuses</option>
              <option value="Pending Approval">Pending Approval ({pendingCount})</option>
              <option value="Active">Active / Approved ({activeCount})</option>
              <option value="Rejected">Rejected ({rejectedCount})</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Status Quick Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs">
          {/* Quick status pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setSelectedStatus("")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedStatus === ""
                  ? "bg-slate-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("Pending Approval")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedStatus === "Pending Approval"
                  ? "bg-amber-600 text-white font-semibold"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("Active")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedStatus === "Active"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("Rejected")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedStatus === "Rejected"
                  ? "bg-red-700 text-white"
                  : "bg-red-50 text-red-800 hover:bg-red-100 border border-red-200"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            {viewMode === "farmer-wise" && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mr-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-emerald-700 hover:underline"
                >
                  Expand All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-emerald-700 hover:underline"
                >
                  Collapse All
                </button>
              </div>
            )}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("farmer-wise")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  viewMode === "farmer-wise"
                    ? "bg-white text-[#217346] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Farmer-Wise
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all-products")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  viewMode === "all-products"
                    ? "bg-white text-[#217346] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                All Products List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={`${PANEL} flex flex-col items-center justify-center p-12 text-gray-500`}>
          <Loader2 className="h-8 w-8 animate-spin text-[#217346]" />
          <p className="mt-3 text-sm font-medium">Loading farmer products…</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={`${PANEL} p-12 text-center text-gray-500`}>
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-base font-semibold text-gray-800">No products found</p>
          <p className="mt-1 text-xs text-gray-500">
            {products.length === 0
              ? "No farmer products have been added yet."
              : "Try adjusting your search query, farmer filter, or status filters."}
          </p>
          {(q || selectedFarmerId || selectedCategory || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setSelectedFarmerId("");
                setSelectedCategory("");
                setSelectedStatus("");
              }}
              className="mt-4 inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "farmer-wise" ? (
        /* ================= FARMER-WISE GROUPED VIEW ================= */
        <div className="space-y-4">
          {farmerGroups.map((group) => {
            const isExpanded = expandedFarmers.has(group.farmerId);
            return (
              <div
                key={group.farmerId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300"
              >
                {/* Farmer Group Header */}
                <div
                  onClick={() => toggleFarmerExpand(group.farmerId)}
                  className="flex cursor-pointer flex-col gap-2.5 bg-gradient-to-r from-emerald-50/50 via-white to-gray-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Farmer Details */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#217346] text-base font-bold text-white shadow-sm">
                      {group.farmerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/vendor/all-farmers/${group.farmerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold text-slate-900 hover:text-[#217346] hover:underline"
                        >
                          {group.farmerName}
                        </Link>
                        <CopyId
                          value={group.farmerId}
                          className="shrink-0"
                          textClassName="font-mono text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-semibold"
                        />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        {group.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {group.mobile}
                          </span>
                        )}
                        {(group.farmLocation || group.district) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {[group.farmLocation, group.district].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Expand Control */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                        {group.products.length} {group.products.length === 1 ? "Product" : "Products"}
                      </span>
                      {group.pendingCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 animate-pulse">
                          <Clock className="h-3 w-3" />
                          {group.pendingCount} Pending Request{group.pendingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Farmer Products List (Table - only Product, Category, Status, Action) */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[580px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-600">
                            <th className="px-3.5 py-2.5">Product & ID</th>
                            <th className="px-3.5 py-2.5">Category</th>
                            <th className="px-3.5 py-2.5">Status</th>
                            <th className="px-3.5 py-2.5 text-right font-bold text-slate-700">
                              Approval Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.products.map((p) => {
                            const name = productNameOf(p);
                            const id = p.id || p.productId;
                            const isPending = isPendingProduct(p.status);
                            const isBusy = busyId === id;

                            return (
                              <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                                {/* Product info */}
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    {productThumb(p, name)}
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900">{name}</p>
                                      {p.variety && (
                                        <p className="text-[11px] font-medium text-gray-500">
                                          Variety: {p.variety}
                                        </p>
                                      )}
                                      <CopyId
                                        value={formatProductId(p)}
                                        textClassName="font-mono text-[10px] text-emerald-800"
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Category */}
                                <td className="px-3.5 py-2.5 text-gray-600">
                                  <p className="font-medium text-slate-800">{p.category || "—"}</p>
                                  {p.subCategory && (
                                    <p className="text-[10px] text-gray-400">{p.subCategory}</p>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="px-3.5 py-2.5">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${productStatusClass(
                                      p.status
                                    )}`}
                                  >
                                    {p.status || "Draft"}
                                  </span>
                                  {p.rejectionReason && (
                                    <p
                                      className="mt-0.5 max-w-[150px] truncate text-[10px] text-red-600"
                                      title={p.rejectionReason}
                                    >
                                      Reason: {p.rejectionReason}
                                    </p>
                                  )}
                                </td>

                                {/* Action Buttons */}
                                <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                                  {isPending ? (
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      {/* Approve Button */}
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleApprove(p)}
                                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                                      >
                                        {isBusy ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
                                        Approve
                                      </button>

                                      {/* Reject Button */}
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => openRejectModal(p)}
                                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        Reject
                                      </button>
                                    </div>
                                  ) : p.status === "Active" || p.status === "Approved" ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      Approved
                                    </span>
                                  ) : p.status === "Rejected" ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 border border-red-200">
                                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                                        Rejected
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">
                                      {p.status || "—"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT ALL PRODUCTS TABLE VIEW ================= */
        <div className={`${PANEL} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-600">
                  <th className="px-3.5 py-3">Farmer</th>
                  <th className="px-3.5 py-3">Product</th>
                  <th className="px-3.5 py-3">Category</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const fInfo = getFarmerInfo(p.farmerId);
                  const name = productNameOf(p);
                  const id = p.id || p.productId;
                  const isPending = isPendingProduct(p.status);
                  const isBusy = busyId === id;

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Farmer Column */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-bold text-[#217346]">
                            {fInfo.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/vendor/all-farmers/${p.farmerId}`}
                              className="font-bold text-slate-800 hover:text-[#217346] hover:underline"
                            >
                              {fInfo.name}
                            </Link>
                            <CopyId
                              value={p.farmerId}
                              textClassName="font-mono text-[9px] text-emerald-800"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Product Column */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          {productThumb(p, name)}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">{name}</p>
                            {p.variety && (
                              <p className="text-[10px] text-gray-500">{p.variety}</p>
                            )}
                            <CopyId
                              value={formatProductId(p)}
                              textClassName="font-mono text-[9px] text-emerald-800"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3.5 py-2.5 text-gray-600">
                        <p className="font-medium">{p.category || "—"}</p>
                        {p.subCategory && <p className="text-[10px] text-gray-400">{p.subCategory}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${productStatusClass(
                            p.status
                          )}`}
                        >
                          {p.status || "Draft"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApprove(p)}
                              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openRejectModal(p)}
                              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : p.status === "Active" || p.status === "Approved" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        ) : p.status === "Rejected" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                            <XCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">{p.status || "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Reject Product Request</h3>
                  <p className="text-xs text-gray-500">
                    Provide a reason for rejecting this farmer submission
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, product: null, reason: "", submitting: false })}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rejectModal.product && (
              <div className="mt-3.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs">
                <p className="font-bold text-gray-800">
                  {productNameOf(rejectModal.product)}{" "}
                  {rejectModal.product.variety ? `· ${rejectModal.product.variety}` : ""}
                </p>
                <p className="mt-0.5 text-gray-500">
                  Farmer:{" "}
                  <strong className="text-gray-700">
                    {getFarmerInfo(rejectModal.product.farmerId).name}
                  </strong>
                </p>
              </div>
            )}

            {/* Quick Reason Chips */}
            <div className="mt-3.5">
              <label className="text-[11px] font-semibold text-gray-600">Quick Reasons:</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {quickRejectReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectModal((prev) => ({ ...prev, reason: r }))}
                    className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
                      rejectModal.reason === r
                        ? "border-red-400 bg-red-50 font-bold text-red-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-gray-600">Custom Reason:</label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Enter detailed reason for rejection (optional)..."
                className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={rejectModal.submitting}
                onClick={() =>
                  setRejectModal({ isOpen: false, product: null, reason: "", submitting: false })
                }
                className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectModal.submitting}
                onClick={confirmReject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {rejectModal.submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
