import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, BellRing } from "lucide-react";
import { listManagerQuality } from "../../api/managerPortApi";
import { vendorApi } from "../../api/vendorApi";
import { CopyButton } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import InventoryAlertModal from "../../components/inventory/InventoryAlertModal";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_INPUT } from "../../utils/excelStyles";

const TH =
  "border border-[#E5E7EB] bg-[#F3F4F6] px-1 py-1.5 text-left text-[9px] font-semibold text-[#374151] sm:px-3 sm:py-3 sm:text-[12px]";
const TD =
  "border border-[#E5E7EB] px-1 py-1.5 text-[9px] leading-tight text-[#1F2937] sm:px-3 sm:py-3 sm:text-[12px]";
const GRADE_TH =
  "border px-1 py-1.5 text-center text-[9px] font-semibold sm:px-3 sm:py-3 sm:text-[12px]";
const GRADE_TD = "border px-1 py-1.5 text-center sm:px-3 sm:py-3";

function productNameOf(row = {}) {
  return row.productName || row.product || row.name || "Product";
}

function productGroupKey(row = {}) {
  const id = String(row.productId || "").trim();
  if (id && !/^[a-f0-9]{24}$/i.test(id)) return id.toUpperCase();
  const biz = formatProductBusinessId(row);
  if (biz && biz !== "—" && !/^[a-f0-9]{24}$/i.test(biz)) return String(biz).toUpperCase();
  return `${productNameOf(row).trim().toLowerCase()}|${String(row.variety || "").trim().toLowerCase()}`;
}

function gradeLetterQty(row, letter) {
  const label = `Grade ${letter}`;
  const fromAssigned = Number(
    row[`grade${letter}Quantity`] ?? row[`grade${letter}Qty`] ?? row[`grade${letter}Assigned`] ?? 0
  );
  const grades = Array.isArray(row.grades) ? row.grades : [];
  const fromGrades = grades.find((g) => {
    const key = String(g.grade || g.label || "")
      .replace(/grade\s*/i, "")
      .trim()
      .toUpperCase();
    return key === letter || String(g.label || "").trim() === label;
  });
  const finalRows = Array.isArray(row.finalStatement) ? row.finalStatement : [];
  const fromFinal = finalRows.find((g) => {
    const key = String(g.grade || g.label || "")
      .replace(/grade\s*/i, "")
      .trim()
      .toUpperCase();
    return key === letter || String(g.label || "").trim() === label;
  });
  const gq = row.gradeQuality && typeof row.gradeQuality === "object" ? row.gradeQuality : {};
  const rejected = Number(gq[label]?.rejectedQuantity || fromFinal?.rejectedQuantity || 0);
  const base = Number(
    fromFinal?.finalQty ??
      fromFinal?.quantity ??
      fromFinal?.qty ??
      fromGrades?.quantity ??
      fromGrades?.qty ??
      (fromAssigned > 0 ? fromAssigned : 0)
  );
  const qty = Math.max(0, base - (fromFinal?.finalQty != null ? 0 : rejected));
  return Number.isFinite(qty) ? qty : 0;
}

function formatQty(qty, min) {
  const n = Number(qty || 0);
  return (
    <span
      className={`font-bold tabular-nums text-[10px] sm:text-[13px] ${min ? "text-[#DC2626]" : "text-[#111827]"}`}
      title={min ? `Below alert level of ${min}` : undefined}
    >
      {n.toLocaleString("en-IN")}
      {min ? <span className="ml-0.5 align-top text-[8px] sm:text-[10px]">▼</span> : null}
    </span>
  );
}

function splitProductId(value) {
  const text = String(value || "").trim();
  if (!text || text === "—") return { line1: "—", line2: "" };
  const parts = text.split("-");
  if (parts.length < 4) {
    const mid = Math.ceil(text.length / 2);
    return { line1: text.slice(0, mid), line2: text.slice(mid) };
  }
  const mid = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, mid).join("-"),
    line2: parts.slice(mid).join("-"),
  };
}

function ProductIdTwoLines({ value }) {
  const { line1, line2 } = splitProductId(value);
  const full = String(value || "").trim() || "—";
  return (
    <span className="inline-flex min-w-0 max-w-full items-start gap-0.5">
      <span
        className="min-w-0 font-mono text-[7px] font-semibold leading-snug tracking-wide text-[#217346] sm:text-[10px]"
        title={full}
      >
        <span className="hidden truncate sm:block">{full}</span>
        <span className="block sm:hidden">{line1}</span>
        {line2 ? <span className="block sm:hidden">{line2}</span> : null}
      </span>
      <CopyButton value={full === "—" ? "" : full} />
    </span>
  );
}

function stockStatusOf(gradeA, gradeB, gradeC) {
  const total = Number(gradeA || 0) + Number(gradeB || 0) + Number(gradeC || 0);
  return total > 0 ? "In Stock" : "Out of Stock";
}

/** Which limits of an enabled alert the row is below, e.g. { A: 50, total: 200 }. */
function alertBreaches(row, alert) {
  if (!alert || alert.enabled === false) return {};
  const breaches = {};
  if (alert.minGradeA > 0 && row.gradeA < alert.minGradeA) breaches.A = alert.minGradeA;
  if (alert.minGradeB > 0 && row.gradeB < alert.minGradeB) breaches.B = alert.minGradeB;
  if (alert.minGradeC > 0 && row.gradeC < alert.minGradeC) breaches.C = alert.minGradeC;
  const total = row.gradeA + row.gradeB + row.gradeC;
  if (alert.minTotal > 0 && total < alert.minTotal) breaches.total = alert.minTotal;
  return breaches;
}

function breachText(row, breaches) {
  const unit = row.unit || "Kg";
  return Object.entries(breaches)
    .map(([key, min]) =>
      key === "total"
        ? `Total ${row.gradeA + row.gradeB + row.gradeC} < ${min} ${unit}`
        : `Grade ${key} ${row[`grade${key}`]} < ${min} ${unit}`
    )
    .join(" · ");
}

export default function ManagerInventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState({});
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    listManagerQuality({ bucket: "completed" })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    vendorApi
      .getInventoryAlerts()
      .then((res) => {
        const list = Array.isArray(res?.data?.items) ? res.data.items : [];
        setAlerts(Object.fromEntries(list.map((a) => [a.productKey, a])));
      })
      .catch(() => setAlerts({}));
  }, []);

  const rows = useMemo(() => {
    const map = new Map();
    items.forEach((row) => {
      const key = productGroupKey(row);
      const unit = row.unit || "Kg";
      const gradeA = gradeLetterQty(row, "A");
      const gradeB = gradeLetterQty(row, "B");
      const gradeC = gradeLetterQty(row, "C");
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          productLabel: productNameOf(row),
          variety: row.variety || "",
          productBizId: formatProductBusinessId(row),
          productId: row.productId || "",
          unit,
          gradeA,
          gradeB,
          gradeC,
          orderId: row.orderId || row.orderDisplayId || "",
        });
        return;
      }
      existing.gradeA += gradeA;
      existing.gradeB += gradeB;
      existing.gradeC += gradeC;
      if (!existing.productBizId || existing.productBizId === "—") {
        existing.productBizId = formatProductBusinessId(row);
      }
      if (!existing.orderId) existing.orderId = row.orderId || row.orderDisplayId || "";
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        status: stockStatusOf(row.gradeA, row.gradeB, row.gradeC),
        alert: alerts[row.key] || null,
        breaches: alertBreaches(row, alerts[row.key]),
      }))
      .sort((a, b) => a.productLabel.localeCompare(b.productLabel));
  }, [items, alerts]);

  const triggered = useMemo(() => rows.filter((row) => Object.keys(row.breaches).length), [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (alertsOnly && triggered.length ? triggered : rows).filter((row) => {
      if (!q) return true;
      return (
        row.productLabel.toLowerCase().includes(q) ||
        String(row.variety || "").toLowerCase().includes(q) ||
        String(row.productBizId || "").toLowerCase().includes(q)
      );
    });
  }, [rows, triggered, alertsOnly, query]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>All Inventory</h1>
          <p className={EXCEL_PAGE_SUB}>Product-wise stock from Quality &amp; Grading · Completed</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${EXCEL_INPUT} w-full sm:max-w-xs`}
          placeholder="Search product…"
        />
      </div>

      {!loading && triggered.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
              <BellRing className="h-4 w-4" />
              {triggered.length} product{triggered.length > 1 ? "s" : ""} below alert level
            </p>
            <button
              type="button"
              onClick={() => setAlertsOnly(!alertsOnly)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
              {alertsOnly ? "Show all products" : "Show only these"}
            </button>
          </div>
          <ul className="mt-2 space-y-0.5 text-xs text-red-700">
            {triggered.map((row) => (
              <li key={row.key}>
                <span className="font-semibold">
                  {row.productLabel}
                  {row.variety ? ` (${row.variety})` : ""}
                </span>
                : {breachText(row, row.breaches)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No graded inventory yet"
          description="Completed Quality & Grading stock will appear here product-wise."
        />
      ) : (
        <div className="w-full overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr>
                <th className={`${TH} text-center`}>#</th>
                <th className={TH}>Product</th>
                <th className={`${TH} text-center sm:text-left`}>Variety</th>
                <th className={`${GRADE_TH} border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]`}>
                  <span className="sm:hidden">A</span>
                  <span className="hidden sm:inline">Grade A</span>
                </th>
                <th className={`${GRADE_TH} border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]`}>
                  <span className="sm:hidden">B</span>
                  <span className="hidden sm:inline">Grade B</span>
                </th>
                <th className={`${GRADE_TH} border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]`}>
                  <span className="sm:hidden">C</span>
                  <span className="hidden sm:inline">Grade C</span>
                </th>
                <th className={`${TH} text-center`}>Unit</th>
                <th className={`${TH} text-center`}>Status</th>
                <th className={`${TH} text-center`}>Alert</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr
                  key={row.key}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer ${
                    Object.keys(row.breaches).length ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-[#F9FBF9]"
                  }`}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (row.productId) params.set("productId", row.productId);
                    if (row.productBizId) params.set("productBizId", row.productBizId);
                    if (row.productLabel) params.set("name", row.productLabel);
                    if (row.variety) params.set("variety", row.variety);
                    navigate(`/vendor/inventory/history?${params.toString()}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const params = new URLSearchParams();
                      if (row.productId) params.set("productId", row.productId);
                      if (row.productBizId) params.set("productBizId", row.productBizId);
                      if (row.productLabel) params.set("name", row.productLabel);
                      if (row.variety) params.set("variety", row.variety);
                      navigate(`/vendor/inventory/history?${params.toString()}`);
                    }
                  }}
                >
                  <td className={`${TD} text-center align-middle text-[#9CA3AF]`}>{idx + 1}</td>
                  <td className={`${TD} min-w-0 align-middle`}>
                    <span className="block break-words font-bold leading-snug text-[#111827] text-[10px] sm:text-[13px]">
                      {row.productLabel}
                    </span>
                    <div className="mt-0.5 min-w-0 max-w-full" onClick={(e) => e.stopPropagation()}>
                      <ProductIdTwoLines value={row.productBizId} />
                    </div>
                  </td>
                  <td className={`${TD} align-middle break-words text-center font-medium text-[#374151] sm:text-left`}>
                    {row.variety || "—"}
                  </td>
                  <td className={`${GRADE_TD} align-middle border-[#A7F3D0] bg-[#ECFDF5]`}>
                    {formatQty(row.gradeA, row.breaches.A)}
                  </td>
                  <td className={`${GRADE_TD} align-middle border-[#BFDBFE] bg-[#EFF6FF]`}>
                    {formatQty(row.gradeB, row.breaches.B)}
                  </td>
                  <td className={`${GRADE_TD} align-middle border-[#FDE68A] bg-[#FFFBEB]`}>
                    {formatQty(row.gradeC, row.breaches.C)}
                  </td>
                  <td className={`${TD} align-middle text-center font-semibold text-[#374151]`}>{row.unit || "Kg"}</td>
                  <td className={`${TD} align-middle text-center`}>
                    {row.status === "In Stock" ? (
                      <span className="inline-flex flex-col items-center font-semibold leading-tight text-[#217346]">
                        <span>In</span>
                        <span>Stock</span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-col items-center font-semibold leading-tight text-[#DC2626]">
                        <span>Out of</span>
                        <span>Stock</span>
                      </span>
                    )}
                  </td>
                  <td className={`${TD} align-middle text-center`}>
                    <AlertButton row={row} onClick={() => setEditingRow(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#6B7280]">No products match.</p>
          ) : null}
        </div>
      )}

      {editingRow ? (
        <InventoryAlertModal
          row={editingRow}
          alert={alerts[editingRow.key]}
          onClose={() => setEditingRow(null)}
          onSaved={(item) => {
            setAlerts((prev) => ({ ...prev, [item.productKey]: item }));
            setEditingRow(null);
          }}
          onDeleted={(item) => {
            setAlerts((prev) => {
              const next = { ...prev };
              delete next[item.productKey];
              return next;
            });
            setEditingRow(null);
          }}
        />
      ) : null}
    </div>
  );
}

function AlertButton({ row, onClick }) {
  const breached = Object.keys(row.breaches).length > 0;
  const Icon = !row.alert ? Bell : row.alert.enabled === false ? BellOff : breached ? BellRing : Bell;
  const tone = breached
    ? "bg-red-100 text-red-600 ring-red-200"
    : row.alert && row.alert.enabled !== false
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-slate-50 text-slate-400 ring-slate-200";
  const title = breached
    ? breachText(row, row.breaches)
    : row.alert
      ? row.alert.enabled === false
        ? "Alert is off — click to edit"
        : "Alert set — click to edit"
      : "Set stock alert";
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 transition hover:scale-105 sm:h-8 sm:w-8 ${tone}`}
    >
      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${breached ? "animate-pulse" : ""}`} />
    </button>
  );
}
