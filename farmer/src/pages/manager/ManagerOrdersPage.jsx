import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerOrders, updateManagerFarmerOrderStatus } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_INPUT,
  EXCEL_SELECT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
} from "../../utils/excelStyles";
import toast from "react-hot-toast";

const ORDER_STATUSES = [
  "Approved",
  "Confirmed",
  "Processing",
  "Ready for Pickup",
  "Delivered",
  "Completed",
  "Cancelled",
];

function getDayName(dateStr) {
  if (!dateStr) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr);
  return isNaN(d.getDay()) ? "Today" : days[d.getDay()];
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toISOString().split("T")[0];
}

export default function ManagerOrdersPage() {
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Tabs: "spreadsheet" (Default matching photo) | "farmer-wise" | "product-wise"
  const [activeTab, setActiveTab] = useState("spreadsheet");

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
      const merged = results
        .flat()
        .sort((a, b) => new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0));
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

  // Flattened row data for accurate spreadsheet rows
  const spreadsheetRows = useMemo(() => {
    const rows = [];
    orders.forEach((o) => {
      const matchFarmer = farmerFilter === "ALL" || o.farmerId === farmerFilter;
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();

      const orderProducts = o.products && o.products.length > 0
        ? o.products
        : [
            {
              name: o.productName || "Produce",
              category: o.category || "Produce",
              unit: o.unit || "Kg",
              grade: "Grade A",
              quantity: o.totalQuantity || 0,
              price: o.amount ? Math.round(o.amount / (o.totalQuantity || 1)) : 0,
              total: o.totalAmount || o.amount || 0,
            },
          ];

      orderProducts.forEach((p, pIdx) => {
        const matchProduct = productFilter === "ALL" || p.name === productFilter;
        const matchSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.farmerName?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.grade?.toLowerCase().includes(q);

        if (matchFarmer && matchStatus && matchProduct && matchSearch) {
          const dateStr = formatDate(o.harvestDate || o.orderDate || o.createdAt);
          const dayStr = o.day || getDayName(dateStr);
          const gradeALabel = p.grade === "Grade B" ? "0" : `${p.quantity || 0} ${p.unit || o.unit || "Kg"}`;
          const gradeBLabel = p.grade === "Grade B" ? `${p.quantity || 0} ${p.unit || o.unit || "Kg"}` : "0";
          const rejectionQty = pIdx === 0 ? Number(o.rejectionQty || 0) : 0;
          const rejectionLabel = `${rejectionQty} ${p.unit || o.unit || "Kg"}`;

          rows.push({
            orderId: o.id,
            farmerId: o.farmerId,
            farmerName: o.farmerName,
            farmerMobile: o.farmerMobile,
            date: dateStr,
            day: dayStr,
            productName: p.name || "Farm Fresh Produce",
            category: p.category || o.category || "Produce",
            unit: p.unit || o.unit || "Kg",
            grade: p.grade || "Grade A",
            gradeAQty: gradeALabel,
            gradeBQty: gradeBLabel,
            rawGradeAQty: p.grade === "Grade B" ? 0 : Number(p.quantity || 0),
            rawGradeBQty: p.grade === "Grade B" ? Number(p.quantity || 0) : 0,
            rejectionQty: rejectionLabel,
            rawRejectionQty: rejectionQty,
            totalQuantity: Number(p.quantity || 0),
            totalAmount: Number(p.total || Number(p.price || 0) * Number(p.quantity || 1) || 0),
            status: o.status || "Approved",
            isFirstInOrder: pIdx === 0,
            orderItemCount: orderProducts.length,
          });
        }
      });
    });
    return rows;
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

    spreadsheetRows.forEach((row) => {
      if (!map[row.farmerId]) {
        map[row.farmerId] = {
          farmer: { id: row.farmerId, name: row.farmerName, mobile: row.farmerMobile },
          orders: [],
          totalQty: 0,
          totalAmount: 0,
        };
      }
      map[row.farmerId].orders.push(row);
      map[row.farmerId].totalQty += row.totalQuantity;
      map[row.farmerId].totalAmount += row.totalAmount;
    });

    return Object.values(map).filter((g) => g.orders.length > 0 || farmerFilter === "ALL");
  }, [farmers, spreadsheetRows, farmerFilter]);

  // Product-wise Grouping
  const productGroups = useMemo(() => {
    const map = {};
    spreadsheetRows.forEach((r) => {
      const pName = r.productName;
      if (!map[pName]) {
        map[pName] = {
          productName: pName,
          category: r.category,
          unit: r.unit,
          rows: [],
          totalQty: 0,
          totalAmount: 0,
          farmers: new Set(),
        };
      }
      map[pName].rows.push(r);
      map[pName].totalQty += r.totalQuantity;
      map[pName].totalAmount += r.totalAmount;
      map[pName].farmers.add(r.farmerName);
    });

    return Object.values(map);
  }, [spreadsheetRows]);

  // Summary Metrics
  const totalVolume = spreadsheetRows.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalRejection = spreadsheetRows.reduce((sum, r) => sum + r.rawRejectionQty, 0);
  const totalFinancialValue = spreadsheetRows.reduce((sum, r) => sum + r.totalAmount, 0);
  const approvedCount = spreadsheetRows.filter((r) =>
    ["Approved", "Confirmed", "Delivered", "Completed"].includes(r.status)
  ).length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Date",
      "Day",
      "Farmer Name",
      "Product",
      "Category",
      "Unit",
      "Grade A Qty",
      "Rejection Qty",
      "Total Qty",
      "Total Amount",
      "Status",
    ];
    const csvRows = [headers.join(",")];

    spreadsheetRows.forEach((r, idx) => {
      csvRows.push(
        [
          idx + 1,
          `"${r.date}"`,
          `"${r.day}"`,
          `"${r.farmerName}"`,
          `"${r.productName}"`,
          `"${r.category}"`,
          `"${r.unit}"`,
          `"${r.gradeAQty}"`,
          `"${r.rejectionQty}"`,
          r.totalQuantity,
          r.totalAmount,
          `"${r.status}"`,
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harvest_orders_statement_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order Management & Statements</h1>
          <p className={EXCEL_PAGE_SUB}>
            Daily harvest orders and statement spreadsheets for assigned farmers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`${EXCEL_BTN} text-xs font-semibold`}
          >
            📥 Export Spreadsheet (CSV)
          </button>
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-xs`}
          >
            <span>+</span> Create Harvest Order / Statement
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Entries</p>
          <p className="text-lg font-bold text-[#1F2937]">{spreadsheetRows.length}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Harvest Qty</p>
          <p className="text-lg font-bold text-[#217346]">
            {totalVolume.toLocaleString("en-IN")} Kg/Litre
          </p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Rejection Volume</p>
          <p className="text-lg font-bold text-[#DC2626]">
            {totalRejection.toLocaleString("en-IN")} Kg/Litre
          </p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Approved / Active</p>
          <p className="text-lg font-bold text-emerald-700">{approvedCount}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Statement Value</p>
          <p className="text-lg font-bold text-[#217346]">
            ₹{totalFinancialValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3. Navigation View Tabs */}
      <div className="flex border-b border-[#D4D4D4] bg-[#F2F2F2]">
        <button
          type="button"
          onClick={() => setActiveTab("spreadsheet")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "spreadsheet"
              ? "border-[#217346] bg-white text-[#217346]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          📊 Master Spreadsheet Grid ({spreadsheetRows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("farmer-wise")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "farmer-wise"
              ? "border-[#217346] bg-white text-[#217346]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          👨‍🌾 Farmer-wise Summary ({farmerGroups.length})
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
          📦 Product-wise Summary ({productGroups.length})
        </button>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-[#D4D4D4] bg-[#F9F9F9] p-2.5 rounded-xs">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, farmer, day or status…"
            className={`${EXCEL_INPUT} w-full`}
          />
        </div>

        {/* Farmer Filter */}
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_SELECT} max-w-[180px] font-medium`}
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
          className={`${EXCEL_SELECT} max-w-[170px] font-medium`}
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
          className={`${EXCEL_SELECT} max-w-[150px] font-medium`}
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
          Loading orders and statements spreadsheet…
        </div>
      ) : spreadsheetRows.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-12 text-center text-xs text-[#6B7280] space-y-3`}>
          <p className="font-semibold text-gray-700">No harvest orders found matching your filters.</p>
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2 text-xs`}
          >
            + Create First Harvest Order
          </Link>
        </div>
      ) : activeTab === "spreadsheet" ? (
        /* ────────── 1. MASTER SPREADSHEET (PHOTO REPLICA) ────────── */
        <section className={EXCEL_PANEL}>
          {/* Panel Top Header */}
          <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
            <span className="font-bold text-[#1F2937]">Harvest Order Details</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
                LIVE STATEMENT GRID
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Showing {spreadsheetRows.length} Rows
              </span>
            </div>
          </div>

          <div className="p-3">
            <div className={EXCEL_WRAP}>
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr className="bg-[#F2F2F2]">
                    <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Farmer</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Product</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Category</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                    <th className={`${EXCEL_HEAD} text-right`}>Grade A Qty</th>
                    <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Rejection Qty</th>
                    <th className={`${EXCEL_HEAD} text-right`}>Total Amount</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetRows.map((r, idx) => (
                    <tr key={`${r.orderId}-${idx}`} className="hover:bg-[#F9F9F9] transition-colors">
                      {/* Sr. */}
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>

                      {/* Date */}
                      <td className={`${EXCEL_CELL} font-medium whitespace-nowrap`}>{r.date}</td>

                      {/* Day */}
                      <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.day}</td>

                      {/* Farmer */}
                      <td className={`${EXCEL_CELL} font-semibold text-[#1F2937]`}>
                        {r.farmerName}
                        {r.farmerMobile && (
                          <span className="block text-[10px] font-normal text-[#6B7280]">
                            {r.farmerMobile}
                          </span>
                        )}
                      </td>

                      {/* Product (Bold) */}
                      <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{r.productName}</td>

                      {/* Category */}
                      <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.category}</td>

                      {/* Unit */}
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{r.unit}</td>

                      {/* Grade A Qty (Bold) */}
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#1F2937] tabular-nums`}>
                        {r.gradeAQty}
                      </td>

                      {/* Rejection Qty (Bold Red) */}
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626] tabular-nums`}>
                        {r.rejectionQty}
                      </td>

                      {/* Total Amount */}
                      <td className={`${EXCEL_CELL} text-right font-semibold text-[#217346] tabular-nums`}>
                        ₹{r.totalAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Status Badge (Green Bordered Capsule) */}
                      <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Status Dropdown */}
                      <td className={`${EXCEL_CELL} text-center`}>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusUpdate(r.farmerId, r.orderId, e.target.value)}
                          className={`${EXCEL_SELECT} py-0.5 text-[11px]`}
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

                {/* Summary Table Footer */}
                <tfoot>
                  <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                    <td colSpan={7} className={`${EXCEL_CELL} text-right uppercase tracking-wider`}>
                      Grand Total:
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#217346] tabular-nums`}>
                      {totalVolume.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#DC2626] tabular-nums`}>
                      {totalRejection.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#217346] tabular-nums`}>
                      ₹{totalFinancialValue.toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} className={`${EXCEL_CELL} text-center text-[#217346]`}>
                      {approvedCount} Approved
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
      ) : activeTab === "farmer-wise" ? (
        /* ────────── 2. FARMER-WISE VIEW ────────── */
        <div className="space-y-4">
          {farmerGroups.map((group) => {
            const f = group.farmer;
            return (
              <section key={f.id} className={EXCEL_PANEL}>
                <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F2937]">{f.name}</span>
                    {f.mobile && <span className="text-xs text-[#6B7280]">({f.mobile})</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-[#6B7280]">
                      Total Qty: <span className="text-[#217346] font-bold">{group.totalQty} Kg</span>
                    </span>
                    <span className="text-xs font-semibold text-[#6B7280]">
                      Total Amount: <span className="text-[#217346] font-bold">₹{group.totalAmount.toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <div className={EXCEL_WRAP}>
                    <table className={EXCEL_TABLE}>
                      <thead>
                        <tr className="bg-[#F2F2F2]">
                          <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                          <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                          <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                          <th className={`${EXCEL_HEAD} text-left`}>Product</th>
                          <th className={`${EXCEL_HEAD} text-left`}>Category</th>
                          <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                          <th className={`${EXCEL_HEAD} text-right`}>Grade A Qty</th>
                          <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Rejection Qty</th>
                          <th className={`${EXCEL_HEAD} text-right`}>Amount</th>
                          <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.orders.map((r, idx) => (
                          <tr key={idx} className="hover:bg-[#F9F9F9]">
                            <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                            <td className={`${EXCEL_CELL} font-medium`}>{r.date}</td>
                            <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.day}</td>
                            <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{r.productName}</td>
                            <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.category}</td>
                            <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{r.unit}</td>
                            <td className={`${EXCEL_CELL} text-right font-bold text-[#1F2937]`}>{r.gradeAQty}</td>
                            <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626]`}>{r.rejectionQty}</td>
                            <td className={`${EXCEL_CELL} text-right font-semibold text-[#217346]`}>
                              ₹{r.totalAmount.toLocaleString("en-IN")}
                            </td>
                            <td className={`${EXCEL_CELL} text-center`}>
                              <StatusBadge status={r.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* ────────── 3. PRODUCT-WISE VIEW ────────── */
        <div className="space-y-4">
          {productGroups.map((pGroup) => (
            <section key={pGroup.productName} className={EXCEL_PANEL}>
              <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
                <div>
                  <span className="font-bold text-[#1F2937]">{pGroup.productName}</span>
                  <span className="ml-2 text-xs text-[#6B7280]">
                    ({pGroup.category} · {pGroup.farmers.size} Farmers)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#6B7280]">
                    Total Harvest: <span className="text-[#217346] font-bold">{pGroup.totalQty} {pGroup.unit}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#6B7280]">
                    Value: <span className="text-[#217346] font-bold">₹{pGroup.totalAmount.toLocaleString("en-IN")}</span>
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className={EXCEL_WRAP}>
                  <table className={EXCEL_TABLE}>
                    <thead>
                      <tr className="bg-[#F2F2F2]">
                        <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                        <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                        <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                        <th className={`${EXCEL_HEAD} text-left`}>Farmer</th>
                        <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                        <th className={`${EXCEL_HEAD} text-right`}>Grade A Qty</th>
                        <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Rejection Qty</th>
                        <th className={`${EXCEL_HEAD} text-right`}>Amount</th>
                        <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pGroup.rows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-[#F9F9F9]">
                          <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                          <td className={`${EXCEL_CELL} font-medium`}>{r.date}</td>
                          <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.day}</td>
                          <td className={`${EXCEL_CELL} font-semibold text-[#1F2937]`}>{r.farmerName}</td>
                          <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{r.unit}</td>
                          <td className={`${EXCEL_CELL} text-right font-bold text-[#1F2937]`}>{r.gradeAQty}</td>
                          <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626]`}>{r.rejectionQty}</td>
                          <td className={`${EXCEL_CELL} text-right font-semibold text-[#217346]`}>
                            ₹{r.totalAmount.toLocaleString("en-IN")}
                          </td>
                          <td className={`${EXCEL_CELL} text-center`}>
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
