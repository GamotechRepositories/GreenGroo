import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getManagerFarmerById,
  getManagerFarmerOrders,
  updateManagerFarmerOrder,
  deleteManagerFarmerOrder,
} from "../../api/farmerApi";
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

const UNIT_OPTIONS = ["Kg", "Litre", "Box", "Bundle", "Dozen", "Quintal", "Gram"];

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

export default function ManagerFarmerOrdersSpreadsheetPage() {
  const { farmerId } = useParams();

  const [farmer, setFarmer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    day: "",
    productName: "",
    unit: "Kg",
    rejectionQty: 0,
    status: "Approved",
    gradeMap: {},
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Spreadsheet Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmerData, ordersData] = await Promise.all([
        getManagerFarmerById(farmerId).catch(() => null),
        getManagerFarmerOrders(farmerId).catch(() => []),
      ]);

      setFarmer(farmerData);
      const sorted = (Array.isArray(ordersData) ? ordersData : []).sort(
        (a, b) => new Date(b.harvestDate || b.orderDate || b.createdAt || 0) - new Date(a.harvestDate || a.orderDate || a.createdAt || 0)
      );
      setOrders(sorted);
    } catch (err) {
      toast.error(err?.message || "Failed to load farmer harvest orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmerId]);

  // Product Counts Map for quick chips
  const productCountMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const prods = o.products && o.products.length > 0 ? o.products : [{ name: o.productName || "Produce" }];
      prods.forEach((p) => {
        if (p.name) {
          map.set(p.name, (map.get(p.name) || 0) + 1);
        }
      });
    });
    return map;
  }, [orders]);

  // Unique Products across this farmer's orders
  const uniqueProducts = useMemo(() => {
    return Array.from(productCountMap.keys());
  }, [productCountMap]);

  // Dynamic Grades Discovery for this farmer
  const availableGrades = useMemo(() => {
    const gradeSet = new Set(["Grade A", "Grade B", "Grade C"]);
    orders.forEach((o) => {
      (o.grades || []).forEach((g) => {
        if (g.name || g.label) gradeSet.add(g.name || g.label);
      });
      (o.products || []).forEach((p) => {
        if (p.grade) gradeSet.add(p.grade);
        (p.grades || []).forEach((g) => {
          if (g.label || g.name) gradeSet.add(g.label || g.name);
        });
      });
    });
    return Array.from(gradeSet);
  }, [orders]);

  // Flattened spreadsheet rows with all grades breakdown
  const spreadsheetRows = useMemo(() => {
    const rows = [];
    orders.forEach((o) => {
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();

      const orderProducts = o.products && o.products.length > 0
        ? o.products
        : [
            {
              name: o.productName || "Produce",
              category: o.category || "Produce",
              unit: o.unit || "Kg",
              grade: o.grade || "Grade A",
              quantity: o.totalQuantity || 0,
            },
          ];

      orderProducts.forEach((p, pIdx) => {
        const matchProduct = productFilter === "ALL" || p.name === productFilter;
        const matchSearch =
          !q ||
          o.id.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.grade?.toLowerCase().includes(q);

        if (matchStatus && matchProduct && matchSearch) {
          const dateStr = formatDate(o.harvestDate || o.orderDate || o.createdAt);
          const dayStr = o.day || getDayName(dateStr);
          const unit = p.unit || o.unit || "Kg";
          const rejectionQty = pIdx === 0 ? Number(o.rejectionQty || 0) : 0;
          const rejectionLabel = `${rejectionQty} ${unit}`;

          // Calculate quantities for all grades
          const gradeMap = {};
          availableGrades.forEach((g) => {
            gradeMap[g] = 0;
          });

          if (Array.isArray(o.grades) && o.grades.length > 0) {
            o.grades.forEach((g) => {
              const gName = g.name || g.label || "Grade A";
              gradeMap[gName] = Number(g.quantity || 0);
            });
          } else if (Array.isArray(p.grades) && p.grades.length > 0) {
            p.grades.forEach((g) => {
              const gName = g.label || g.name || "Grade A";
              gradeMap[gName] = Number(g.quantity || 0);
            });
          } else {
            const pGrade = p.grade || "Grade A";
            gradeMap[pGrade] = Number(p.quantity || 0);
          }

          rows.push({
            orderId: o.id,
            date: dateStr,
            day: dayStr,
            productName: p.name || "Farm Fresh Produce",
            category: p.category || o.category || "Produce",
            unit: unit,
            grade: p.grade || "Grade A",
            gradeMap: gradeMap,
            rejectionQty: rejectionLabel,
            rawRejectionQty: rejectionQty,
            totalQuantity: Number(p.quantity || 0),
            status: o.status || "Approved",
            rawOrder: o,
          });
        }
      });
    });
    return rows;
  }, [orders, statusFilter, productFilter, searchQuery, availableGrades]);

  // Open Edit Modal
  const handleOpenEdit = (row) => {
    setEditingOrder(row);
    setEditForm({
      date: row.date,
      day: row.day,
      productName: row.productName,
      unit: row.unit || "Kg",
      rejectionQty: row.rawRejectionQty || 0,
      status: row.status || "Approved",
      gradeMap: { ...row.gradeMap },
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingEdit(true);

    try {
      // Calculate total quantity across grades
      const totalQty = Object.values(editForm.gradeMap).reduce(
        (sum, q) => sum + Number(q || 0),
        0
      );

      const gradeList = Object.entries(editForm.gradeMap).map(([name, qty]) => ({
        label: name,
        name: name,
        quantity: Number(qty || 0),
      }));

      const payload = {
        harvestDate: editForm.date,
        day: editForm.day,
        unit: editForm.unit,
        rejectionQty: Number(editForm.rejectionQty || 0),
        status: editForm.status,
        grades: gradeList,
        products: [
          {
            name: editForm.productName,
            unit: editForm.unit,
            quantity: totalQty,
            grades: gradeList,
          },
        ],
      };

      const updated = await updateManagerFarmerOrder(farmerId, editingOrder.orderId, payload);
      toast.success("Harvest order updated successfully!");

      // Update local state
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === editingOrder.orderId || o.orderId === editingOrder.orderId) {
            return {
              ...o,
              ...updated,
              harvestDate: editForm.date,
              day: editForm.day,
              unit: editForm.unit,
              rejectionQty: Number(editForm.rejectionQty || 0),
              status: editForm.status,
              grades: gradeList,
              products: payload.products,
            };
          }
          return o;
        })
      );

      setEditingOrder(null);
    } catch (err) {
      toast.error(err?.message || "Failed to update harvest order");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Handler
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this harvest order entry?")) return;
    setDeletingId(orderId);
    try {
      await deleteManagerFarmerOrder(farmerId, orderId);
      toast.success("Harvest order deleted successfully");
      setOrders((prev) => prev.filter((o) => o.id !== orderId && o.orderId !== orderId && o._id !== orderId));
    } catch (err) {
      toast.error(err?.message || "Failed to delete harvest order");
    } finally {
      setDeletingId(null);
    }
  };

  // Totals
  const totalVolume = spreadsheetRows.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalRejection = spreadsheetRows.reduce((sum, r) => sum + r.rawRejectionQty, 0);
  const approvedCount = spreadsheetRows.filter((r) =>
    ["Approved", "Confirmed", "Delivered", "Completed"].includes(r.status)
  ).length;

  const gradeTotals = useMemo(() => {
    const totals = {};
    availableGrades.forEach((g) => {
      totals[g] = spreadsheetRows.reduce((sum, r) => sum + (r.gradeMap[g] || 0), 0);
    });
    return totals;
  }, [spreadsheetRows, availableGrades]);

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Date",
      "Day",
      "Farmer Name",
      "Product",
      "Unit",
      ...availableGrades.map((g) => `${g} Qty`),
      "Rejection Qty",
      "Total Qty",
      "Status",
    ];
    const csvRows = [headers.join(",")];

    spreadsheetRows.forEach((r, idx) => {
      const gradeValues = availableGrades.map((g) => r.gradeMap[g] || 0);
      csvRows.push(
        [
          idx + 1,
          `"${r.date}"`,
          `"${r.day}"`,
          `"${farmer?.name || "Farmer"}"`,
          `"${r.productName}"`,
          `"${r.unit}"`,
          ...gradeValues,
          `"${r.rejectionQty}"`,
          r.totalQuantity,
          `"${r.status}"`,
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harvest_sheet_${farmer?.name || "farmer"}_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className={`${EXCEL_PANEL} p-12 text-center text-xs text-[#6B7280]`}>
        Loading harvest order spreadsheet…
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#DC2626] space-y-3`}>
        <p className="font-bold text-sm">Farmer not found</p>
        <Link to="/farmer/manager/orders" className={`${EXCEL_BTN_PRIMARY} inline-block px-3 py-1.5`}>
          ← Back to Farmers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/manager/orders"
            className={`${EXCEL_BTN} inline-flex items-center gap-1 font-bold text-[#217346] hover:bg-[#E8F5E9]`}
          >
            ← Back to Farmers List
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-extrabold text-[#1F2937] text-sm">
            Harvest Order Details — {farmer.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`${EXCEL_BTN} text-xs font-semibold text-[#217346]`}
          >
            📥 Export CSV
          </button>
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold`}
          >
            + Create Harvest Order
          </Link>
        </div>
      </div>

      {/* 2. Farmer Information Banner */}
      <div className={`${EXCEL_PANEL} p-4 bg-gradient-to-r from-[#F7FAF7] to-white border-l-4 border-l-[#217346]`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border border-[#217346] bg-[#E8F5E9] font-bold text-xl text-[#217346] rounded-xs">
              👨‍🌾
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#1F2937]">{farmer.name}</h1>
                <span className="rounded bg-[#217346] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  FARMER: {farmer.name.toUpperCase()}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                  {farmer.farmerCode || "CODE-FRM"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                Mobile: <span className="font-bold text-gray-800">{farmer.mobile}</span> · Location: {farmer.farmLocation || farmer.address?.village || "Nashik"} · Farm: {farmer.farmName || "Organic Farm"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/farmer/manager/farmers/${farmer.id}`}
              className="border border-[#D4D4D4] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] hover:bg-gray-50"
            >
              View Full Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          <p className="text-[11px] font-semibold text-[#6B7280]">Approved Entries</p>
          <p className="text-lg font-bold text-emerald-700">{approvedCount}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Harvest Records</p>
          <p className="text-lg font-bold text-[#1F2937]">
            {spreadsheetRows.length} Orders
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. HARVEST ORDER DETAILS SPREADSHEET (PHOTO REPLICA)         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className={EXCEL_PANEL}>
        {/* Panel Top Header */}
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2 bg-[#F2F8F3]`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1F2937] text-sm">
              Harvest Order Details — {farmer.name}
            </span>
            <span className="rounded bg-[#217346] px-2.5 py-0.5 text-[10px] font-bold text-white">
              FARMER: {farmer.name.toUpperCase()}
            </span>
            {productFilter !== "ALL" && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                PRODUCT: {productFilter}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Select Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className={`${EXCEL_SELECT} text-black bg-white border border-[#D4D4D4] py-1 px-2 font-medium`}
            >
              <option value="ALL">All Products</option>
              {uniqueProducts.map((pName) => (
                <option key={pName} value={pName}>
                  {pName} ({productCountMap.get(pName) || 0})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#6B7280]">
              {spreadsheetRows.length} Records
            </span>
          </div>
        </div>

        {/* Quick 1-Click Product Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#D4D4D4] bg-[#FAFAFA] p-2.5">
          <span className="shrink-0 text-[11px] font-bold text-[#6B7280]">Product Quick Filter:</span>
          <button
            type="button"
            onClick={() => setProductFilter("ALL")}
            className={`shrink-0 rounded-xs border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
              productFilter === "ALL"
                ? "border-[#217346] bg-[#217346] text-white"
                : "border-[#D4D4D4] bg-white text-[#4B5563] hover:bg-[#F2F2F2]"
            }`}
          >
            All Products ({orders.length})
          </button>
          {uniqueProducts.map((pName) => {
            const count = productCountMap.get(pName) || 0;
            const isSel = productFilter === pName;
            return (
              <button
                key={pName}
                type="button"
                onClick={() => setProductFilter(pName)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-xs border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  isSel
                    ? "border-[#217346] bg-[#E8F5E9] text-[#217346] font-bold ring-1 ring-[#217346]"
                    : "border-[#D4D4D4] bg-white text-[#1F2937] hover:border-[#217346] hover:bg-[#F9F9F9]"
                }`}
              >
                <span>{pName}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSel ? "bg-[#217346] text-white" : "bg-gray-100 text-gray-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Spreadsheet Table */}
        <div className="p-3">
          {spreadsheetRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B7280] space-y-3">
              <p className="font-semibold text-gray-700">No harvest orders recorded for {farmer.name} yet.</p>
              <Link
                to="/farmer/manager/orders/create"
                className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2 text-xs`}
              >
                + Issue Harvest Order
              </Link>
            </div>
          ) : (
            <div className={EXCEL_WRAP}>
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr className="bg-[#F2F2F2]">
                    <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Product</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                    {/* ALL Grades Headers */}
                    {availableGrades.map((g) => (
                      <th key={g} className={`${EXCEL_HEAD} text-right font-bold text-[#1F2937]`}>
                        {g} Qty
                      </th>
                    ))}
                    <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Rejection Qty</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                    <th className={`${EXCEL_HEAD} text-center w-28`}>Action</th>
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

                      {/* Product (Bold) */}
                      <td className={`${EXCEL_CELL}`}>
                        <button
                          type="button"
                          onClick={() => setProductFilter(r.productName)}
                          className="font-bold text-[#1F2937] hover:text-[#217346] hover:underline text-left"
                          title="Click to filter by this product"
                        >
                          {r.productName}
                        </button>
                      </td>

                      {/* Unit */}
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{r.unit}</td>

                      {/* ALL Grades Quantities */}
                      {availableGrades.map((g) => {
                        const qty = r.gradeMap[g] || 0;
                        return (
                          <td
                            key={g}
                            className={`px-3 py-2 text-right border border-[#D4D4D4] tabular-nums ${
                              qty > 0 ? "font-bold text-[#1F2937]" : "text-gray-400 font-normal"
                            }`}
                          >
                            {qty > 0 ? `${qty} ${r.unit}` : "0"}
                          </td>
                        );
                      })}

                      {/* Rejection Qty (Bold Red) */}
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626] tabular-nums`}>
                        {r.rejectionQty}
                      </td>

                      {/* Status Badge (Green Bordered Capsule) */}
                      <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Actions: Edit | Delete */}
                      <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="font-bold text-xs text-[#217346] hover:underline cursor-pointer transition-colors"
                            title="Edit harvest order details"
                          >
                            Edit
                          </button>
                          <span className="text-[#D4D4D4]">|</span>
                          <button
                            type="button"
                            disabled={deletingId === r.orderId}
                            onClick={() => handleDeleteOrder(r.orderId)}
                            className="font-bold text-xs text-[#DC2626] hover:underline cursor-pointer transition-colors disabled:opacity-50"
                            title="Delete harvest order"
                          >
                            {deletingId === r.orderId ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Summary Table Footer */}
                <tfoot>
                  <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                    <td colSpan={5} className={`${EXCEL_CELL} text-right uppercase tracking-wider`}>
                      Grand Total ({farmer.name}):
                    </td>
                    {/* All Grade Totals */}
                    {availableGrades.map((g) => (
                      <td key={g} className={`${EXCEL_CELL} text-right text-[#217346] tabular-nums`}>
                        {gradeTotals[g]?.toLocaleString("en-IN") || 0}
                      </td>
                    ))}
                    <td className={`${EXCEL_CELL} text-right text-[#DC2626] tabular-nums`}>
                      {totalRejection.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-center text-[#217346]`}>
                      {approvedCount} Approved
                    </td>
                    <td className={`${EXCEL_CELL}`}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. EDIT HARVEST ORDER MODAL                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xs border border-[#217346] bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#F2F8F3] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <h3 className="font-extrabold text-sm text-[#1F2937]">
                  Edit Harvest Order — {farmer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="font-bold text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditForm((prev) => ({
                        ...prev,
                        date: newDate,
                        day: getDayName(newDate),
                      }));
                    }}
                    className={`${EXCEL_INPUT} w-full py-1`}
                  />
                </div>

                {/* Day */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Day</label>
                  <input
                    type="text"
                    value={editForm.day}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, day: e.target.value }))}
                    className={`${EXCEL_INPUT} w-full py-1 bg-gray-50`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.productName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, productName: e.target.value }))}
                    className={`${EXCEL_INPUT} w-full py-1 font-semibold`}
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Unit</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className={`${EXCEL_SELECT} w-full py-1`}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grades Quantities Breakdown */}
              <div className="rounded-xs border border-[#E5E7EB] bg-[#FAFAFA] p-3">
                <p className="text-[11px] font-extrabold text-[#217346] mb-2">Produce Grades Breakdown ({editForm.unit}):</p>
                <div className="grid grid-cols-3 gap-2">
                  {availableGrades.map((g) => (
                    <div key={g}>
                      <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">{g} Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editForm.gradeMap[g] || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditForm((prev) => ({
                            ...prev,
                            gradeMap: {
                              ...prev.gradeMap,
                              [g]: val,
                            },
                          }));
                        }}
                        className={`${EXCEL_INPUT} w-full py-1 font-bold text-[#1F2937]`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Rejection Qty */}
                <div>
                  <label className="block text-[11px] font-bold text-[#DC2626] mb-1">
                    Rejection Quantity ({editForm.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.rejectionQty}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rejectionQty: e.target.value }))}
                    className={`${EXCEL_INPUT} w-full py-1 font-bold text-[#DC2626] border-[#DC2626]/40`}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className={`${EXCEL_SELECT} w-full py-1 font-semibold`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] pt-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className={`${EXCEL_BTN} px-3 py-1.5 font-semibold text-[#4B5563]`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`${EXCEL_BTN_PRIMARY} px-4 py-1.5 font-bold shadow-xs disabled:opacity-50`}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
