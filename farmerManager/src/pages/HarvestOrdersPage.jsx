import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { getHarvestOrders } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
} from "../utils/excelStyles";

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

export default function HarvestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        const hoData = await getHarvestOrders().catch(() => []);

        const rawList = Array.isArray(hoData) ? hoData : [];

        // Deduplicate
        const idMap = new Map();
        rawList.forEach((o) => {
          const key = o.id || o.orderId || String(o._id);
          if (!idMap.has(key)) {
            idMap.set(key, o);
          }
        });

        const combined = Array.from(idMap.values()).sort(
          (a, b) => new Date(b.harvestDate || b.date || b.createdAt || 0) - new Date(a.harvestDate || a.date || a.createdAt || 0)
        );

        setOrders(combined);
      } catch (err) {
        toast.error(err.message || "Failed to load harvest orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const uniqueProducts = useMemo(() => {
    return Array.from(productCountMap.keys());
  }, [productCountMap]);

  // Dynamic discovery of all grades
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

  // Flattened spreadsheet rows
  const spreadsheetRows = useMemo(() => {
    const rows = [];
    orders.forEach((o) => {
      const orderProducts = o.products && o.products.length > 0
        ? o.products
        : [
            {
              name: o.productName || "Farm Fresh Produce",
              category: o.category || "Produce",
              unit: o.unit || "Kg",
              grade: o.grade || "Grade A",
              quantity: o.totalQuantity || 0,
            },
          ];

      orderProducts.forEach((p, pIdx) => {
        const matchProduct = productFilter === "ALL" || p.name === productFilter;
        if (matchProduct) {
          const dateStr = formatDate(o.harvestDate || o.date || o.createdAt);
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
            orderId: o.id || o.orderId,
            date: dateStr,
            day: dayStr,
            productName: p.name || "Farm Fresh Produce",
            unit: unit,
            gradeMap: gradeMap,
            rejectionQty: rejectionLabel,
            rawRejectionQty: rejectionQty,
            totalQuantity: Number(p.quantity || 0),
            status: o.status || "Approved",
          });
        }
      });
    });
    return rows;
  }, [orders, productFilter, availableGrades]);

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

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-6xl space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Harvest Orders</h1>
          <p className={EXCEL_PAGE_SUB}>View all daily harvest orders and produce grade records</p>
        </div>
        <span className="rounded bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346]">
          View Only (Issued by Vendor / Manager)
        </span>
      </div>

      {/* Harvest Order Spreadsheet Table */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-3 bg-[#F2F8F3] px-3 py-2 border-b border-[#D4D4D4]`}>
          {/* Left Group: Records Badge & Filter Produce Chips */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346] whitespace-nowrap">
              {spreadsheetRows.length} Records
            </span>

            {/* Produce Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] font-bold text-[#6B7280] whitespace-nowrap">Filter Produce:</span>
              <button
                type="button"
                onClick={() => setProductFilter("ALL")}
                className={`shrink-0 rounded-xs border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                  productFilter === "ALL"
                    ? "border-[#217346] bg-[#217346] text-white shadow-xs"
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
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xs border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      isSel
                        ? "border-[#217346] bg-[#E8F5E9] text-[#217346] font-bold ring-1 ring-[#217346] shadow-xs"
                        : "border-[#D4D4D4] bg-white text-[#1F2937] hover:border-[#217346] hover:bg-[#F9F9F9]"
                    }`}
                  >
                    <span>{pName}</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isSel ? "bg-[#217346] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Group: Select Product Dropdown (Shifted Right) */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="text-xs font-semibold text-[#6B7280] whitespace-nowrap">Select Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className={`${EXCEL_SELECT} text-black bg-white border border-[#D4D4D4] py-1.5 px-2.5 font-medium rounded-xs shadow-xs focus:border-[#217346]`}
            >
              <option value="ALL">All Products ({orders.length})</option>
              {uniqueProducts.map((pName) => (
                <option key={pName} value={pName}>
                  {pName} ({productCountMap.get(pName) || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3">
          {spreadsheetRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7280]">
              No harvest orders found. Vendor Manager will issue harvest orders here.
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
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetRows.map((r, idx) => (
                    <tr key={`${r.orderId}-${idx}`} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                      <td className={`${EXCEL_CELL} font-medium whitespace-nowrap`}>{r.date}</td>
                      <td className={`${EXCEL_CELL} text-[#6B7280]`}>{r.day}</td>
                      <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{r.productName}</td>
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{r.unit}</td>
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
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626] tabular-nums`}>
                        {r.rejectionQty}
                      </td>
                      <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Grand Total Footer */}
                <tfoot>
                  <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                    <td colSpan={5} className={`${EXCEL_CELL} text-right uppercase tracking-wider`}>
                      Grand Total:
                    </td>
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
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
