import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listManagerQuality } from "../../api/farmerApi";
import { CopyButton } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
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

function formatQty(qty) {
  const n = Number(qty || 0);
  return (
    <span className="font-bold tabular-nums text-[#111827] text-[10px] sm:text-[13px]">
      {n.toLocaleString("en-IN")}
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

export default function ManagerInventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    listManagerQuality({ bucket: "completed" })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
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

    const q = query.trim().toLowerCase();
    return Array.from(map.values())
      .map((row) => ({
        ...row,
        status: stockStatusOf(row.gradeA, row.gradeB, row.gradeC),
      }))
      .filter((row) => {
        if (!q) return true;
        return (
          row.productLabel.toLowerCase().includes(q) ||
          String(row.variety || "").toLowerCase().includes(q) ||
          String(row.productBizId || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.productLabel.localeCompare(b.productLabel));
  }, [items, query]);

  return (
    <div className="space-y-4">
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
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.key}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer hover:bg-[#F9FBF9]"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (row.productId) params.set("productId", row.productId);
                    if (row.productBizId) params.set("productBizId", row.productBizId);
                    if (row.productLabel) params.set("name", row.productLabel);
                    if (row.variety) params.set("variety", row.variety);
                    navigate(`/manager/inventory/history?${params.toString()}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const params = new URLSearchParams();
                      if (row.productId) params.set("productId", row.productId);
                      if (row.productBizId) params.set("productBizId", row.productBizId);
                      if (row.productLabel) params.set("name", row.productLabel);
                      if (row.variety) params.set("variety", row.variety);
                      navigate(`/manager/inventory/history?${params.toString()}`);
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
                  <td className={`${GRADE_TD} align-middle border-[#A7F3D0] bg-[#ECFDF5]`}>{formatQty(row.gradeA)}</td>
                  <td className={`${GRADE_TD} align-middle border-[#BFDBFE] bg-[#EFF6FF]`}>{formatQty(row.gradeB)}</td>
                  <td className={`${GRADE_TD} align-middle border-[#FDE68A] bg-[#FFFBEB]`}>{formatQty(row.gradeC)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
