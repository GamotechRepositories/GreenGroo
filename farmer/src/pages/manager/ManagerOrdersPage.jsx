import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerOrders, updateManagerFarmerOrderStatus } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["New", "Confirmed", "Processing", "Ready for Pickup", "Picked Up", "Delivered", "Completed", "Cancelled"];

const STATUS_BADGES = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Processing: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Ready for Pickup": "bg-purple-50 text-purple-700 border-purple-200",
  "Picked Up": "bg-sky-50 text-sky-700 border-sky-200",
  Delivered: "bg-teal-50 text-teal-700 border-teal-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ManagerOrdersPage() {
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Tabs: "farmer-wise" | "product-wise" | "all-orders"
  const [activeTab, setActiveTab] = useState("farmer-wise");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [farmerFilter, setFarmerFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const fs = await getManagerFarmers().catch(() => []);
      const farmerList = Array.isArray(fs) ? fs : [];
      setFarmers(farmerList);

      const results = await Promise.all(
        farmerList.map((f) =>
          getManagerFarmerOrders(f.id)
            .then((os) =>
              (Array.isArray(os) ? os : []).map((o) => ({
                ...o,
                farmerName: f.name,
                farmerMobile: f.mobile,
                farmerLocation: f.farmLocation || f.address?.village || "Nashik",
                farmerId: f.id,
              }))
            )
            .catch(() => [])
        )
      );
      const merged = results.flat().sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt));
      setOrders(merged);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (farmerId, orderId, newStatus) => {
    try {
      await updateManagerFarmerOrderStatus(farmerId, orderId, newStatus);
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update order status");
    }
  };

  // Unique Products across all orders
  const uniqueProducts = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      o.products?.forEach((p) => {
        if (p.name) set.add(p.name);
      });
    });
    return Array.from(set);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFarmer = farmerFilter === "ALL" || o.farmerId === farmerFilter;
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchProduct =
        productFilter === "ALL" ||
        o.products?.some((p) => p.name === productFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.farmerName?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.products?.some((p) => p.name?.toLowerCase().includes(q) || p.grade?.toLowerCase().includes(q));

      return matchFarmer && matchStatus && matchProduct && matchSearch;
    });
  }, [orders, farmerFilter, statusFilter, productFilter, searchQuery]);

  // Farmer-wise Grouping
  const farmerGroups = useMemo(() => {
    const map = {};
    farmers.forEach((f) => {
      map[f.id] = {
        farmer: f,
        orders: [],
        totalQty: 0,
        totalAmount: 0,
      };
    });

    filteredOrders.forEach((o) => {
      if (!map[o.farmerId]) {
        map[o.farmerId] = {
          farmer: { id: o.farmerId, name: o.farmerName, mobile: o.farmerMobile, farmLocation: o.farmerLocation },
          orders: [],
          totalQty: 0,
          totalAmount: 0,
        };
      }
      map[o.farmerId].orders.push(o);
      map[o.farmerId].totalQty += Number(o.totalQuantity || 0);
      map[o.farmerId].totalAmount += Number(o.totalAmount || 0);
    });

    return Object.values(map).filter((g) => g.orders.length > 0 || farmerFilter === "ALL");
  }, [farmers, filteredOrders, farmerFilter]);

  // Product-wise Grouping
  const productGroups = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      o.products?.forEach((p) => {
        const pName = p.name || "Produce";
        if (!map[pName]) {
          map[pName] = {
            productName: pName,
            orders: [],
            totalQty: 0,
            farmers: new Set(),
            gradesBreakdown: {},
          };
        }
        map[pName].orders.push({ ...o, currentItem: p });
        map[pName].totalQty += Number(p.quantity || 0);
        map[pName].farmers.add(o.farmerName);

        const gradeLabel = p.grade || "Grade A";
        map[pName].gradesBreakdown[gradeLabel] =
          (map[pName].gradesBreakdown[gradeLabel] || 0) + Number(p.quantity || 0);
      });
    });

    return Object.values(map);
  }, [filteredOrders]);

  // Summary Metrics
  const totalVolume = filteredOrders.reduce((sum, o) => sum + Number(o.totalQuantity || 0), 0);
  const pendingOrdersCount = filteredOrders.filter((o) => ["New", "Confirmed", "Processing"].includes(o.status)).length;
  const completedOrdersCount = filteredOrders.filter((o) => ["Delivered", "Completed"].includes(o.status)).length;
  const activeFarmersCount = new Set(filteredOrders.map((o) => o.farmerId)).size;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Order ID", "Date", "Farmer", "Customer", "Products & Grades", "Total Qty (Kg)", "Status"];
    const csvRows = [headers.join(",")];

    filteredOrders.forEach((o) => {
      const prodStr = (o.products || []).map((p) => `${p.name} (${p.grade}: ${p.quantity}Kg)`).join(" | ");
      csvRows.push([
        `"${o.id}"`,
        `"${o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN") : ""}"`,
        `"${o.farmerName}"`,
        `"${o.customer?.name || "Direct"}"`,
        `"${prodStr}"`,
        o.totalQuantity || 0,
        `"${o.status}"`,
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manager_orders_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order Management & Statements</h1>
          <p className={EXCEL_PAGE_SUB}>Manage and monitor produce orders categorized Farmer-wise and Product-wise</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`${EXCEL_BTN} text-xs font-semibold`}
          >
            📥 Export CSV
          </button>
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-sm`}
          >
            <span>+</span> Create Order / Daily Statement
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="border border-[#D4D4D4] bg-white p-3 rounded-sm shadow-sm">
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Orders</p>
          <p className="text-lg font-bold text-[#1F2937]">{filteredOrders.length}</p>
        </div>
        <div className="border border-[#D4D4D4] bg-white p-3 rounded-sm shadow-sm">
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Volume</p>
          <p className="text-lg font-bold text-[#217346]">{totalVolume.toLocaleString("en-IN")} Kg</p>
        </div>
        <div className="border border-[#D4D4D4] bg-white p-3 rounded-sm shadow-sm">
          <p className="text-[11px] font-semibold text-[#6B7280]">Pending / Active</p>
          <p className="text-lg font-bold text-amber-600">{pendingOrdersCount}</p>
        </div>
        <div className="border border-[#D4D4D4] bg-white p-3 rounded-sm shadow-sm">
          <p className="text-[11px] font-semibold text-[#6B7280]">Delivered / Completed</p>
          <p className="text-lg font-bold text-emerald-600">{completedOrdersCount}</p>
        </div>
        <div className="border border-[#D4D4D4] bg-white p-3 rounded-sm shadow-sm">
          <p className="text-[11px] font-semibold text-[#6B7280]">Active Farmers</p>
          <p className="text-lg font-bold text-indigo-700">{activeFarmersCount}</p>
        </div>
      </div>

      {/* 3. Navigation View Tabs */}
      <div className="flex border-b border-[#D4D4D4] bg-[#F2F2F2]">
        <button
          type="button"
          onClick={() => setActiveTab("farmer-wise")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "farmer-wise"
              ? "border-[#217346] bg-white text-[#217346]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          👨‍🌾 Farmer-wise Orders ({farmerGroups.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("product-wise")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "product-wise"
              ? "border-[#217346] bg-white text-[#217346]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          📦 Product-wise Orders ({productGroups.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("all-orders")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "all-orders"
              ? "border-[#217346] bg-white text-[#217346]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          📊 Master Spreadsheet List ({filteredOrders.length})
        </button>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-[#D4D4D4] bg-[#F9F9F9] p-2.5 rounded-sm">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, farmer, product or grade…"
            className={`${EXCEL_INPUT} w-full pl-2`}
          />
        </div>

        {/* Farmer Filter */}
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[180px] font-medium`}
        >
          <option value="ALL">All Farmers ({farmers.length})</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Product Filter */}
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[170px] font-medium`}
        >
          <option value="ALL">All Products</option>
          {uniqueProducts.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[150px] font-medium`}
        >
          <option value="ALL">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 5. TAB CONTENTS */}
      {loading ? (
        <div className={`${EXCEL_PANEL} p-12 text-center text-xs text-[#6B7280]`}>
          Loading orders and statements…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-12 text-center text-xs text-[#6B7280] space-y-3`}>
          <p className="font-semibold text-gray-700">No orders found matching the filter criteria.</p>
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2 text-xs`}
          >
            + Create First Statement Order
          </Link>
        </div>
      ) : activeTab === "farmer-wise" ? (
        /* ────────── 1. FARMER-WISE VIEW ────────── */
        <div className="space-y-4">
          {farmerGroups.map((group) => {
            const f = group.farmer;
            if (group.orders.length === 0 && farmerFilter !== "ALL") return null;

            return (
              <div key={f.id} className="border border-[#D4D4D4] bg-white rounded-sm shadow-sm overflow-hidden">
                {/* Farmer Header Banner */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#F7FAF7] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center border border-[#217346] bg-[#E8F5E9] font-bold text-[#217346] rounded-sm text-xs">
                      {(f.name || "F").charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1F2937]">{f.name}</span>
                        <span className="text-[11px] font-mono text-[#6B7280]">({f.mobile})</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        Location: {f.farmLocation || f.address?.village || "Nashik"} · {f.farmName || "Farm"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-[#6B7280]">Total Orders</p>
                      <p className="font-bold text-xs text-[#1F2937]">{group.orders.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#6B7280]">Total Produce</p>
                      <p className="font-bold text-xs text-[#217346]">{group.totalQty} Kg</p>
                    </div>
                    <Link
                      to="/farmer/manager/orders/create"
                      className="border border-[#217346] text-[#217346] hover:bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold rounded"
                    >
                      + Order
                    </Link>
                  </div>
                </div>

                {/* Farmer Orders Table */}
                {group.orders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#6B7280]">
                    No orders placed under this farmer yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#F2F2F2] text-left border-b border-[#D4D4D4]">
                          {["Order ID", "Date", "Produce Items & Grades Breakdown", "Total Qty", "Status", "Update Status"].map((h) => (
                            <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.orders.map((o) => (
                          <tr key={o.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9F9F9]">
                            <td className="px-3 py-2.5 font-mono font-bold text-[#217346]">
                              {o.id}
                            </td>
                            <td className="px-3 py-2 text-[#4B5563] whitespace-nowrap">
                              {o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1.5">
                                {(o.products || []).map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 border border-[#D4D4D4] bg-[#F9FBF9] px-2 py-0.5 rounded text-[11px]"
                                  >
                                    <span className="font-semibold text-gray-800">{p.name}</span>
                                    <span className="bg-[#217346] text-white px-1 rounded text-[10px]">
                                      {p.grade || "Grade A"}
                                    </span>
                                    <span className="font-bold text-[#217346]">{p.quantity} Kg</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-bold text-[#1F2937] whitespace-nowrap">
                              {o.totalQuantity} Kg
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGES[o.status] || "bg-gray-50 text-gray-600"}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={o.status}
                                onChange={(e) => handleStatusUpdate(o.farmerId, o.id, e.target.value)}
                                className={`${EXCEL_INPUT} py-0.5 text-[11px] max-w-[140px]`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : activeTab === "product-wise" ? (
        /* ────────── 2. PRODUCT-WISE VIEW ────────── */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {productGroups.map((pGroup) => (
            <div key={pGroup.productName} className="border border-[#D4D4D4] bg-white rounded-sm shadow-sm overflow-hidden">
              {/* Product Header */}
              <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#F4F9F4] px-4 py-2.5">
                <div>
                  <h3 className="font-bold text-sm text-[#217346]">{pGroup.productName}</h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Supplied by {pGroup.farmers.size} Farmers · Total Orders: {pGroup.orders.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#6B7280]">Total Ordered</p>
                  <p className="text-base font-extrabold text-[#217346]">{pGroup.totalQty} Kg</p>
                </div>
              </div>

              {/* Grades Breakdown Pill */}
              <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] bg-[#FDFDFD] px-4 py-2">
                <span className="text-[11px] font-semibold text-gray-500">Grades:</span>
                {Object.entries(pGroup.gradesBreakdown).map(([grade, qty]) => (
                  <span key={grade} className="border border-[#C4DBC4] bg-[#EBF5EB] px-2 py-0.5 rounded text-[11px] font-bold text-[#217346]">
                    {grade}: {qty} Kg
                  </span>
                ))}
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F2F2F2] text-left border-b border-[#D4D4D4]">
                      {["Farmer", "Grade", "Qty", "Date", "Status", "Action"].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pGroup.orders.map((o, idx) => (
                      <tr key={idx} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2 font-semibold text-gray-800">
                          {o.farmerName}
                        </td>
                        <td className="px-3 py-2">
                          <span className="bg-[#217346] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {o.currentItem?.grade || "Grade A"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-[#217346]">
                          {o.currentItem?.quantity || 0} Kg
                        </td>
                        <td className="px-3 py-2 text-[#6B7280]">
                          {o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block border px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGES[o.status] || "bg-gray-50 text-gray-600"}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusUpdate(o.farmerId, o.id, e.target.value)}
                            className={`${EXCEL_INPUT} py-0.5 text-[10px]`}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ────────── 3. MASTER SPREADSHEET LIST VIEW ────────── */
        <div className={`${EXCEL_PANEL} overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#EBF5EB] text-left border-b border-[#D4D4D4]">
                  {["Order ID", "Date", "Farmer Name", "Customer", "Produce Items & Grades", "Total Qty", "Status", "Manage Status"].map((h) => (
                    <th key={h} className="border-r border-[#D4D4D4] px-3 py-2.5 font-bold text-[#1F2937] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FBF9] transition-colors">
                    <td className="border-r border-[#E5E7EB] px-3 py-2 font-mono font-bold text-[#217346]">
                      {o.id}
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2 text-[#4B5563] whitespace-nowrap">
                      {o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2 font-semibold text-[#1F2937]">
                      {o.farmerName}
                      <span className="block text-[10px] font-normal text-gray-500">{o.farmerMobile}</span>
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2 text-gray-700">
                      {o.customer?.name || "Direct Store"}
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(o.products || []).map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 border border-[#D4D4D4] bg-white px-2 py-0.5 rounded text-[11px]"
                          >
                            <span className="font-semibold text-gray-800">{p.name}</span>
                            <span className="bg-[#217346] text-white px-1 rounded text-[10px]">{p.grade}</span>
                            <span className="font-bold text-[#217346]">{p.quantity}Kg</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2 font-bold text-[#217346] text-center">
                      {o.totalQuantity} Kg
                    </td>
                    <td className="border-r border-[#E5E7EB] px-3 py-2 text-center">
                      <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGES[o.status] || "bg-gray-50 text-gray-600"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.farmerId, o.id, e.target.value)}
                        className={`${EXCEL_INPUT} py-1 text-xs`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
