import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { vendorApi } from "../../api/vendorApi";
import { CopyButton } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import { EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_INPUT } from "../../utils/excelStyles";

const REFRESH_MS = 30000;

const TH =
  "border border-[#E5E7EB] bg-[#F3F4F6] px-1 py-1.5 text-left text-[9px] font-semibold text-[#374151] sm:px-2.5 sm:py-2.5 sm:text-[11px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 align-middle text-[9px] text-[#1F2937] sm:px-2.5 sm:py-2.5 sm:text-[12px]";
const GRADE_TH = "border px-1 py-1.5 text-center text-[9px] font-semibold sm:px-2.5 sm:py-2.5 sm:text-[11px]";
const GRADE_TD = "border px-1 py-1.5 text-center align-middle font-bold tabular-nums text-[9px] sm:px-2.5 sm:py-2.5 sm:text-[12px]";

const GRADE_COLS = [
  { grade: "A", th: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]", td: "border-[#A7F3D0] bg-[#ECFDF5]" },
  { grade: "B", th: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]", td: "border-[#BFDBFE] bg-[#EFF6FF]" },
  { grade: "C", th: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]", td: "border-[#FDE68A] bg-[#FFFBEB]" },
];

const STOCK_FILTERS = [
  { id: "all", label: "All" },
  { id: "in", label: "In Stock" },
  { id: "low", label: "Low Stock" },
  { id: "out", label: "Out of Stock" },
];

function stockBucket(item) {
  if (item.availableQuantity <= 0) return "out";
  if (item.availableQuantity <= item.lowStockLimit) return "low";
  return "in";
}

const BUCKET_BADGE = {
  in: { label: "In Stock", cls: "bg-[#DCFCE7] text-[#166534]" },
  low: { label: "Low Stock", cls: "bg-[#FEF3C7] text-[#92400E]" },
  out: { label: "Out of Stock", cls: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const qty = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function gradeQty(item, grade) {
  return Number(item.grades?.find((g) => g.grade === grade)?.quantity || 0);
}

function otherGrades(item) {
  return (item.grades || []).filter((g) => !GRADE_COLS.some((c) => c.grade === g.grade) && Number(g.quantity) > 0);
}

function updatedText(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AllFarmerInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await vendorApi.getAllFarmerInventory();
      setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load farmer inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true });
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: items.length, in: 0, low: 0, out: 0 };
    items.forEach((item) => {
      c[stockBucket(item)] += 1;
    });
    return c;
  }, [items]);

  const farmerCount = useMemo(() => new Set(items.map((i) => i.farmerId)).size, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && stockBucket(item) !== filter) return false;
      if (!q) return true;
      return [item.farmerName, item.farmerCode, item.farmerMobile, item.name, item.variety, item.productId, item.sku]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [items, query, filter]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>All Farmer Inventory</h1>
          <p className={EXCEL_PAGE_SUB}>
            Grade-wise stock updated by your farmers · {farmerCount} farmer{farmerCount === 1 ? "" : "s"} · refreshes every 30 sec
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${EXCEL_INPUT} w-full sm:w-64`}
            placeholder="Search farmer, product, ID…"
          />
          <button
            type="button"
            onClick={() => load()}
            disabled={refreshing}
            title="Refresh"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-[#217346] hover:bg-[#F9FAFB] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STOCK_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === f.id
                ? "border-[#217346] bg-[#217346] text-white"
                : "border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]"
            }`}
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No farmer inventory yet" description="Stock your farmers add in the farmer app will appear here." />
      ) : (
        <div className="w-full overflow-x-auto border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <th className={`${TH} w-8 text-center`}>#</th>
                <th className={TH}>Farmer</th>
                <th className={TH}>Product</th>
                <th className={TH}>Variety</th>
                {GRADE_COLS.map((c) => (
                  <th key={c.grade} className={`${GRADE_TH} ${c.th}`}>
                    Grade {c.grade}
                  </th>
                ))}
                <th className={`${TH} text-center`}>Total</th>
                <th className={`${TH} text-center`}>Reserved</th>
                <th className={`${TH} text-center`}>Available</th>
                <th className={`${TH} text-center`}>Unit</th>
                <th className={`${TH} text-center`}>Status</th>
                <th className={TH}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item, idx) => {
                const bucket = BUCKET_BADGE[stockBucket(item)];
                const others = otherGrades(item);
                return (
                  <tr key={item.id} className="hover:bg-[#F9FBF9]">
                    <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                    <td className={TD}>
                      <Link
                        to={`/vendor/all-farmers/${encodeURIComponent(item.farmerId)}`}
                        className="block font-semibold text-[#111827] hover:text-[#217346]"
                      >
                        {item.farmerName || "—"}
                      </Link>
                      <span className="block text-[8px] text-[#6B7280] sm:text-[10px]">
                        {[item.farmerCode, item.farmerVillage].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td className={TD}>
                      <span className="block font-bold text-[#111827]">{item.name || "—"}</span>
                      <span className="inline-flex items-center gap-0.5 font-mono text-[8px] font-semibold text-[#217346] sm:text-[10px]">
                        {item.productId}
                        <CopyButton value={item.productId} />
                      </span>
                    </td>
                    <td className={TD}>{item.variety || "—"}</td>
                    {GRADE_COLS.map((c) => (
                      <td key={c.grade} className={`${GRADE_TD} ${c.td}`}>
                        {qty(gradeQty(item, c.grade))}
                      </td>
                    ))}
                    <td className={`${TD} text-center font-bold tabular-nums`}>
                      {qty(item.totalQuantity)}
                      {others.length ? (
                        <span className="block text-[8px] font-normal text-[#6B7280] sm:text-[10px]">
                          incl. {others.map((g) => `${g.grade}: ${qty(g.quantity)}`).join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td className={`${TD} text-center tabular-nums text-[#6B7280]`}>{qty(item.reservedQuantity)}</td>
                    <td className={`${TD} text-center font-bold tabular-nums text-[#217346]`}>{qty(item.availableQuantity)}</td>
                    <td className={`${TD} text-center font-semibold text-[#374151]`}>{item.unit}</td>
                    <td className={`${TD} text-center`}>
                      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[11px] ${bucket.cls}`}>
                        {bucket.label}
                      </span>
                    </td>
                    <td className={`${TD} whitespace-nowrap text-[#6B7280]`}>{updatedText(item.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="py-6 text-center text-sm text-[#6B7280]">No products match.</p> : null}
        </div>
      )}
    </div>
  );
}
