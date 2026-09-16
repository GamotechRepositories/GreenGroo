import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getHarvestOrders } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import CopyId from "../components/ui/CopyId";
import { formatOrderDate } from "../utils/orderDisplay";
import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";
import { Search, UserCheck, Users, Package } from "lucide-react";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const TH = "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";

/** Soft color grading per grade column group */
const GRADE_COLORS = {
  "Grade A": {
    head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]",
    cell: "border-[#A7F3D0] bg-[#ECFDF5]",
  },
  "Grade B": {
    head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]",
    cell: "border-[#BFDBFE] bg-[#EFF6FF]",
  },
  "Grade C": {
    head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
    cell: "border-[#FDE68A] bg-[#FFFBEB]",
  },
};

function gradeTone(label = "") {
  return (
    GRADE_COLORS[label] || {
      head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
      cell: "border-[#E5E7EB] bg-[#F9FAFB]",
    }
  );
}

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) {
    return raw.replace(/\s+/g, " ").toUpperCase().replace(/AM/i, "AM").replace(/PM/i, "PM");
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${min} ${period}`;
}

function shortOrderId(id = "") {
  const s = String(id);
  const m = s.match(/(\d{5})$/);
  return { full: s, short: m ? `…${m[1]}` : s };
}

function formatQty(qty, unit = "Kg") {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="text-[#9CA3AF]">0</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}{" "}
      <span className="text-[9px] font-normal text-[#6B7280]">{unit}</span>
    </span>
  );
}

function isOrderDeleted(o) {
  if (!o) return true;
  if (o.isDeleted === true || o.deleted === true) return true;
  const s = String(o.status || "").trim().toUpperCase();
  return s === "DELETED" || s === "CANCELLED" || s === "CANCELED" || s === "DELETED_ORDER";
}

export default function HarvestOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const hoData = await getHarvestOrders().catch(() => []);
        const rawList = (Array.isArray(hoData) ? hoData : []).filter((o) => !isOrderDeleted(o));

        // Deduplicate
        const idMap = new Map();
        rawList.forEach((o) => {
          if (isOrderDeleted(o)) return;
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

  // Unique Farmers for filter dropdown & chips
  const farmerStats = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const key = o.farmerId || o.farmerCode || o.farmerName;
      if (key) {
        if (!map.has(key)) {
          map.set(key, {
            key,
            id: o.farmerId || o.farmerCode || "",
            code: o.farmerCode || o.farmerId || "",
            name: o.farmerName || "Farmer",
            location: o.farmerLocation || "",
            count: 0,
          });
        }
        map.get(key).count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  // Product counts
  const productCountMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const name = o.productName || o.products?.[0]?.name || "Produce";
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return map;
  }, [orders]);

  const uniqueProducts = useMemo(() => {
    return Array.from(productCountMap.keys());
  }, [productCountMap]);

  // Dynamic discovery of all grades
  const availableGrades = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    orders.forEach((o) => {
      (o.grades || []).forEach((g) => {
        if (g.name || g.label) set.add(g.name || g.label);
      });
      (o.products || []).forEach((p) => {
        if (p.grade) set.add(p.grade);
        (p.grades || []).forEach((g) => {
          if (g.label || g.name) set.add(g.label || g.name);
        });
      });
    });
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [orders]);

  // Flattened spreadsheet rows (ONE ROW PER ORDER)
  const spreadsheetRows = useMemo(() => {
    const rows = [];
    orders.forEach((o) => {
      if (isOrderDeleted(o)) return;

      const fKey = o.farmerId || o.farmerCode || o.farmerName;
      const matchFarmer = farmerFilter === "ALL" || fKey === farmerFilter || o.farmerId === farmerFilter || o.farmerCode === farmerFilter || o.farmerName === farmerFilter;
      if (!matchFarmer) return;

      const prodName = o.productName || o.products?.[0]?.name || "Produce";
      const matchProduct = productFilter === "ALL" || prodName === productFilter;
      if (!matchProduct) return;

      const orderId = o.orderId || o.id || "";
      const farmerName = o.farmerName || "—";
      const farmerCode = o.farmerCode || o.farmerId || "";
      const farmerLoc = o.farmerLocation || "";
      const varietyName = o.variety || o.products?.[0]?.variety || "";

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${orderId} ${farmerName} ${farmerCode} ${farmerLoc} ${prodName} ${varietyName}`.toLowerCase();
        if (!hay.includes(q)) return;
      }

      const harvestDate = o.harvestDate || o.date || o.orderDate || o.createdAt;
      const pickupDate = o.pickupDate || o.requiredDate || "";
      const pickupTime = o.pickupTime || o.harvestTime || "";
      const unit = o.unit || o.products?.[0]?.unit || "Kg";
      const rejectionQty = Number(o.rejectionQty || 0);

      // Calculate quantities for all grades
      const gradeMap = {};
      availableGrades.forEach((g) => {
        gradeMap[g] = 0;
      });

      if (Array.isArray(o.grades) && o.grades.length > 0) {
        o.grades.forEach((g) => {
          const gName = g.name || g.label || "Grade A";
          gradeMap[gName] = (gradeMap[gName] || 0) + Number(g.quantity || 0);
        });
      } else if (Array.isArray(o.products) && o.products.length > 0) {
        o.products.forEach((p) => {
          if (Array.isArray(p.grades) && p.grades.length > 0) {
            p.grades.forEach((g) => {
              const gName = g.label || g.name || "Grade A";
              gradeMap[gName] = (gradeMap[gName] || 0) + Number(g.quantity || 0);
            });
          } else {
            const pGrade = p.grade || "Grade A";
            gradeMap[pGrade] = (gradeMap[pGrade] || 0) + Number(p.quantity || 0);
          }
        });
      }

      const totalQuantity = Number(o.totalQuantity || o.orderedQuantity || 0) || Object.values(gradeMap).reduce((s, v) => s + v, 0);

      rows.push({
        orderId,
        harvestDate,
        pickupDate,
        pickupTime,
        farmerName,
        farmerCode,
        farmerLocation: farmerLoc,
        productName: prodName,
        variety: varietyName,
        unit,
        gradeMap,
        rejectionQty,
        totalQuantity,
        status: o.status || "Approved",
        rawOrder: o,
      });
    });
    return rows;
  }, [orders, productFilter, farmerFilter, searchQuery, availableGrades]);

  // Totals
  const totalRejection = spreadsheetRows.reduce((sum, r) => sum + r.rejectionQty, 0);
  const gradeTotals = useMemo(() => {
    const totals = {};
    availableGrades.forEach((g) => {
      totals[g] = spreadsheetRows.reduce((sum, r) => sum + (r.gradeMap[g] || 0), 0);
    });
    return totals;
  }, [spreadsheetRows, availableGrades]);

  return (
    <div className="space-y-4">
      {/* 1. Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Harvest Orders</h1>
          <p className="text-xs text-[#6B7280]">
            Farmer-wise harvest records • {spreadsheetRows.length} record{spreadsheetRows.length === 1 ? "" : "s"} across {farmerStats.length} assigned farmer{farmerStats.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            {farmerStats.length} Active Farmers
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Package className="h-3.5 w-3.5 text-slate-600" />
            {uniqueProducts.length} Products
          </span>
        </div>
      </div>

      {/* 2. Filter Toolbar (Farmer dropdown, Produce dropdown & Search) */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between flex-wrap">
          {/* Farmer & Product Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
            {/* Farmer Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-[#374151] whitespace-nowrap flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Farmer:
              </label>
              <select
                value={farmerFilter}
                onChange={(e) => setFarmerFilter(e.target.value)}
                className="w-full sm:w-auto min-w-[180px] max-w-xs rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2937] shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Farmers ({orders.length})</option>
                {farmerStats.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.name} {f.code ? `(${f.code})` : ""} — {f.count}
                  </option>
                ))}
              </select>
            </div>

            {/* Produce Selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-[#374151] whitespace-nowrap">
                Produce:
              </label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full sm:w-auto min-w-[150px] max-w-xs rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2937] shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search farmer, ID, crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-[#1F2937] placeholder-slate-400 shadow-xs focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Quick Produce Chips */}
        {uniqueProducts.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => setProductFilter("ALL")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer shrink-0 ${
                productFilter === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Produce ({orders.length})
            </button>
            {uniqueProducts.map((pName) => {
              const isSel = productFilter === pName;
              const count = productCountMap.get(pName) || 0;
              return (
                <button
                  key={pName}
                  type="button"
                  onClick={() => setProductFilter(pName)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] transition cursor-pointer shrink-0 ${
                    isSel
                      ? "bg-emerald-700 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{pName}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${isSel ? "bg-emerald-900/60 text-white" : "bg-slate-200 text-slate-800"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : spreadsheetRows.length === 0 ? (
        <EmptyState
          title="No harvest orders found"
          description={
            farmerFilter !== "ALL" || productFilter !== "ALL" || searchQuery
              ? "No harvest orders match the selected filters or search criteria."
              : "Harvest orders will appear here."
          }
        />
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="space-y-2.5 md:hidden">
            {spreadsheetRows.map((row, idx) => (
              <HarvestMobileCard
                key={`${row.orderId}-${idx}`}
                row={row}
                availableGrades={availableGrades}
                onOpen={() => row.orderId && navigate(`/manager/orders/${row.orderId}`)}
              />
            ))}
          </div>

          {/* Desktop Table matching OrdersPage */}
          <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <table className="w-full table-fixed border-collapse text-[10px] sm:text-[11px]">
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                {availableGrades.map((g) => (
                  <col key={`col-${g}`} className="w-[6%]" />
                ))}
                <col className="w-[7%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={TH} rowSpan={2}>
                    #
                  </th>
                  <th className={TH} rowSpan={2}>
                    Order ID
                  </th>
                  <th className={TH} rowSpan={2}>
                    Farmer
                  </th>
                  <th className={TH} rowSpan={2}>
                    Product
                  </th>
                  <th className={TH} rowSpan={2}>
                    Variety
                  </th>
                  <th className={TH} rowSpan={2}>
                    Harvest Date
                  </th>
                  <th className={TH} rowSpan={2}>
                    Pickup Date
                  </th>
                  <th className={TH} rowSpan={2}>
                    Pickup Time
                  </th>
                  {availableGrades.map((g) => {
                    const tone = gradeTone(g);
                    return (
                      <th
                        key={g}
                        className={`border px-1 py-1.5 text-center text-[9px] font-bold leading-tight sm:text-[10px] ${tone.head}`}
                      >
                        {g}
                      </th>
                    );
                  })}
                  <th className="border border-red-200 bg-red-50 px-1 py-1.5 text-center text-[9px] font-bold text-red-700 sm:text-[10px]" rowSpan={2}>
                    Rejection
                  </th>
                  <th className={TH} rowSpan={2}>
                    Status
                  </th>
                </tr>
                <tr>
                  {availableGrades.map((g) => {
                    const tone = gradeTone(g);
                    return (
                      <th key={`h-${g}`} className={`border px-0.5 py-1 text-center text-[9px] font-semibold ${tone.head}`}>
                        Qty
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {spreadsheetRows.map((row, idx) => {
                  const oid = shortOrderId(row.orderId);
                  return (
                    <tr
                      key={`${row.orderId}-${idx}`}
                      onClick={() => row.orderId && navigate(`/manager/orders/${row.orderId}`)}
                      className="hover:bg-[#F2F8F3] transition-colors cursor-pointer group"
                      title="Click row to view full order & farmer details"
                    >
                      <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                      <td className={`${TD} sm:text-[10px]`}>
                        <CopyId value={oid.full} textClassName="font-mono text-[9px] font-semibold text-[#217346] sm:text-[10px]" />
                      </td>
                      {/* Farmer Column (Compact) */}
                      <td className={`${TD} min-w-0`} title={[row.farmerName, row.farmerCode, row.farmerLocation].filter(Boolean).join(" · ")}>
                        <p className="truncate font-bold text-[#1F2937] text-[10px] sm:text-[11px] leading-tight group-hover:text-emerald-800">{row.farmerName || "—"}</p>
                        {row.farmerCode ? (
                          <span className="inline-block mt-0.5 rounded bg-emerald-50 px-1 py-0.2 font-mono text-[9px] font-semibold text-emerald-800 border border-emerald-200 truncate max-w-full">
                            {row.farmerCode}
                          </span>
                        ) : null}
                      </td>
                      {/* Product Column */}
                      <td className={`${TD} truncate`} title={row.productName}>
                        <p className="font-bold text-[#1F2937] truncate">{row.productName || "Product"}</p>
                      </td>
                      {/* Variety Column */}
                      <td className={`${TD} truncate`} title={row.variety}>
                        {row.variety ? (
                          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 border border-slate-200 truncate max-w-full">
                            {row.variety}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] text-[10px]">—</span>
                        )}
                      </td>
                      <td className={`${TD} text-center`}>
                        {shortDate(row.harvestDate)}
                      </td>
                      <td className={`${TD} text-center font-medium`}>{shortDate(row.pickupDate)}</td>
                      <td className={`${TD} text-center`}>{formatTime12h(row.pickupTime)}</td>
                      {/* Grades Columns */}
                      {availableGrades.map((g) => {
                        const qty = row.gradeMap[g] || 0;
                        const tone = gradeTone(g);
                        const cell = `border px-0.5 py-1.5 text-center text-[10px] tabular-nums sm:text-[11px] ${tone.cell}`;
                        return (
                          <td key={`${row.orderId}-${g}`} className={cell}>
                            {formatQty(qty, row.unit)}
                          </td>
                        );
                      })}
                      {/* Rejection */}
                      <td className={`${TD} text-center font-bold text-red-600 tabular-nums bg-red-50/40`}>
                        {row.rejectionQty > 0 ? `${row.rejectionQty} ${row.unit}` : <span className="text-[#9CA3AF] font-normal">0</span>}
                      </td>
                      {/* Status */}
                      <td className={`${TD} text-center whitespace-nowrap`}>
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Footer matching the table style */}
              <tfoot>
                <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                  <td colSpan={8} className="border border-[#C5D4C8] px-2 py-2 text-right uppercase tracking-wider text-[10px] sm:text-[11px] text-[#217346]">
                    Grand Total:
                  </td>
                  {availableGrades.map((g) => (
                    <td key={`tot-${g}`} className="border border-[#C5D4C8] px-1 py-2 text-center text-[#217346] tabular-nums font-bold text-[10px] sm:text-[11px]">
                      {formatQty(gradeTotals[g] || 0)}
                    </td>
                  ))}
                  <td className="border border-[#C5D4C8] px-1 py-2 text-center text-[#DC2626] tabular-nums font-bold text-[10px] sm:text-[11px]">
                    {totalRejection > 0 ? `${totalRejection.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="border border-[#C5D4C8] px-1 py-2 text-center text-[#217346] font-bold text-[10px]">
                    {spreadsheetRows.length} Records
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function HarvestMobileCard({ row, availableGrades, onOpen }) {
  const oid = shortOrderId(row.orderId);

  return (
    <article
      onClick={onOpen}
      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm space-y-2.5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99]"
      title="Click to view full order & farmer details"
    >
      {/* Top Banner: Farmer Name & Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 shrink-0">
              🌱
            </span>
            <p className="truncate text-xs font-bold text-[#1F2937]">
              {row.farmerName || "Farmer"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#6B7280]">
            {row.farmerCode ? <span className="font-mono font-semibold text-emerald-700">{row.farmerCode}</span> : null}
            {row.farmerLocation ? <span>· 📍 {row.farmerLocation}</span> : null}
          </div>
        </div>
        <StatusBadge status={row.status} className="shrink-0" />
      </div>

      {/* Product & Order ID Row */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="min-w-0 truncate text-[13px] font-bold text-[#1F2937]">
            {row.productName || "Product"}
            {row.variety ? <span className="font-semibold text-[#6B7280]"> · {row.variety}</span> : null}
          </p>
        </div>
        <CopyId
          value={oid.full}
          className="shrink-0"
          textClassName="font-mono text-[10px] text-emerald-700"
        />
      </div>

      {/* Dates Row */}
      <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-[#6B7280] bg-slate-50/80 px-2 py-1.5 rounded-lg">
        <span>
          Harvest <span className="font-semibold text-[#1F2937]">{shortDate(row.harvestDate)}</span>
        </span>
        <span>
          Pickup <span className="font-semibold text-[#1F2937]">{shortDate(row.pickupDate)}</span>
        </span>
        <span>
          Time <span className="font-semibold text-[#1F2937]">{formatTime12h(row.pickupTime)}</span>
        </span>
      </div>

      {/* Grades Table */}
      <div className="overflow-hidden rounded-md border border-[#E5E7EB]">
        <div className="grid grid-cols-3 bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
          <span>Grade</span>
          <span className="text-center">Quantity</span>
          <span className="text-right">Rejection</span>
        </div>
        {availableGrades.map((g, gIdx) => {
          const qty = row.gradeMap[g] || 0;
          const tone = gradeTone(g);
          return (
            <div key={g} className={`grid grid-cols-3 items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px] ${tone.cell}`}>
              <span className="font-semibold text-[#1F2937]">{g}</span>
              <span className="text-center font-semibold tabular-nums">{formatQty(qty, row.unit)}</span>
              <span className="text-right font-semibold tabular-nums text-red-600">
                {gIdx === 0 && row.rejectionQty > 0 ? `${row.rejectionQty} ${row.unit}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
