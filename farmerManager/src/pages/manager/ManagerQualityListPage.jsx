import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listManagerQuality } from "../../api/farmerApi";
import EmptyState from "../../components/ui/EmptyState";
import CopyId, { CopyButton } from "../../components/ui/CopyId";
import StatusBadge from "../../components/ui/StatusBadge";
import { usePolling } from "../../hooks/usePolling";
import { EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";

const COPY = {
  pending: { title: "Pending Inspection", sub: "Inspections started but not yet completed.", bucket: "in_progress", empty: "No pending quality inspections." },
  all: { title: "All Inspection", sub: "All orders that are not yet completed.", bucket: "all", empty: "No quality inspections." },
  inspection: { title: "Quality Inspection & Grading", sub: "Inspections in progress.", bucket: "inspection", empty: "No inspections in progress." },
  completed: { title: "Completed", sub: "Grade confirmed and completed orders.", bucket: "completed", empty: "No completed quality inspections yet." },
};

const TABS = [
  { mode: "all", to: "/manager/quality/all", label: "All" },
  { mode: "pending", to: "/manager/quality/pending", label: "Pending" },
  { mode: "inspection", to: "/manager/quality/inspection", label: "Inspection & Grading" },
  { mode: "completed", to: "/manager/quality/completed", label: "Completed" },
];

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];
const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";
const ACTION_BTN =
  "inline-flex h-7 min-w-[4.5rem] items-center justify-center rounded px-2 text-[10px] font-semibold leading-none whitespace-nowrap border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]";
const ACTION_BTN_PRIMARY =
  "inline-flex h-7 min-w-[4.5rem] items-center justify-center rounded px-2 text-[10px] font-semibold leading-none whitespace-nowrap border border-[#217346] bg-[#217346] text-white hover:bg-[#1B5E3B]";

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
  const fromId = String(value).match(/GGC-ORD-(\d{4})(\d{2})(\d{2})/i);
  if (fromId) return `${fromId[3]}/${fromId[2]}/${fromId[1]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) return raw.replace(/\s+/g, " ");
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    }
    return raw;
  }
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function gradeDetailMap(row) {
  const unit = row.unit || "Kg";
  const map = {};
  (Array.isArray(row.grades) ? row.grades : []).forEach((g) => {
    const label = String(g.label || g.name || g.grade || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || g.qty || 0);
    if (!(qty > 0)) return;
    if (!map[label]) map[label] = { qty: 0, unit };
    map[label].qty += qty;
  });
  const assigned = {
    "Grade A": Number(row.gradeAQuantity || 0),
    "Grade B": Number(row.gradeBQuantity || 0),
    "Grade C": Number(row.gradeCQuantity || 0),
  };
  Object.entries(assigned).forEach(([label, qty]) => {
    if (!(qty > 0)) return;
    if (!map[label]) map[label] = { qty: 0, unit };
    map[label].qty = qty;
  });
  if (!Object.keys(map).length) {
    const qty = Number(row.receivedQuantity || row.orderedQuantity || 0);
    if (qty > 0) map["Grade A"] = { qty, unit };
  }
  Object.keys(map).forEach((label) => {
    if (!(Number(map[label].qty) > 0)) delete map[label];
  });
  return map;
}

function gradeColumnList(map) {
  const present = Object.keys(map).filter((g) => Number(map[g]?.qty) > 0);
  const preferred = DEFAULT_GRADES.filter((g) => present.includes(g));
  const extras = present.filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  return [...preferred, ...extras];
}

function formatQty(qty, unit, { allowZero = false } = {}) {
  const n = Number(qty || 0);
  if (!(n > 0) && !allowZero) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}
      <span className="ml-0.5 text-[8px] text-[#6B7280] sm:text-[9px]">{unit || "Kg"}</span>
    </span>
  );
}

function rejectedBreakdown(row) {
  const gq = row?.gradeQuality && typeof row.gradeQuality === "object" ? row.gradeQuality : {};
  const perGrade = {};
  DEFAULT_GRADES.forEach((label) => {
    perGrade[label] = Number(gq[label]?.rejectedQuantity || 0);
  });
  Object.keys(gq).forEach((label) => {
    if (DEFAULT_GRADES.includes(label)) return;
    const n = Number(gq[label]?.rejectedQuantity || 0);
    if (n > 0) perGrade[label] = n;
  });
  const fromGrades = Object.values(perGrade).reduce((sum, n) => sum + n, 0);
  const total = fromGrades > 0 ? fromGrades : Number(row?.rejectedQuantity || 0);
  return { total, perGrade };
}

function GradeMiniTable({ map, unit, rejected }) {
  const columns = gradeColumnList(map);
  const showRejected = Boolean(rejected);
  if (!columns.length && !(showRejected && Number(rejected?.total) > 0)) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-[#E5E7EB]">
      <div className={`grid ${showRejected ? "grid-cols-3" : "grid-cols-2"} bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]`}>
        <span>Grade</span>
        <span className="text-right">Qty</span>
        {showRejected ? <span className="text-right">Rejected</span> : null}
      </div>
      {columns.map((g) => {
        const row = map[g] || { qty: 0, unit };
        const tone = gradeTone(g);
        const rejectedQty = Number(rejected?.perGrade?.[g] || 0);
        return (
          <div
            key={g}
            className={`grid ${showRejected ? "grid-cols-3" : "grid-cols-2"} items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px] ${tone.cell}`}
          >
            <span className="font-semibold text-[#1F2937]">{g}</span>
            <span className="text-right font-semibold tabular-nums">{formatQty(row.qty, row.unit || unit)}</span>
            {showRejected ? (
              <span className={`text-right font-semibold tabular-nums ${rejectedQty > 0 ? "text-[#DC2626]" : "text-[#9CA3AF]"}`}>
                {formatQty(rejectedQty, row.unit || unit, { allowZero: true })}
              </span>
            ) : null}
          </div>
        );
      })}
      {showRejected ? (
        <div className="grid grid-cols-3 items-center border-t border-[#FECACA] bg-[#FEF2F2] px-2 py-1.5 text-[12px]">
          <span className="font-semibold text-[#991B1B]">Rejected</span>
          <span />
          <span className="text-right font-semibold tabular-nums text-[#DC2626]">
            {formatQty(rejected.total, unit, { allowZero: true })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function actionLabel(mode, row) {
  const s = String(row?.status || row?.qualityStatus || "").toUpperCase();
  if (mode === "completed" || s === "GRADE_CONFIRMED" || s === "ORDER_COMPLETED") return "View";
  if (s === "INSPECTION" || s === "QUALITY_CHECK" || s === "GRADING") return "Pending";
  return "Start Inspection";
}

function actionBtnClass(label) {
  return label === "Start Inspection" ? ACTION_BTN_PRIMARY : ACTION_BTN;
}

function QualityMobileCard({ row, onOpen, label = "Start Inspection", showRejected = false }) {
  const map = gradeDetailMap(row);
  const unit = row.unit || "Kg";
  const product = row.productName || row.product || "Produce";
  const id = row.orderDisplayId || row.orderId;
  const rejected = showRejected ? rejectedBreakdown(row) : null;
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="min-w-0 truncate text-[13px] font-bold text-[#1F2937]">
          {product}
          {row.variety ? <span className="font-semibold text-[#6B7280]"> · {row.variety}</span> : null}
        </p>
        <CopyId
          value={id}
          className="min-w-0 flex-1"
          textClassName="font-mono text-[10px] text-emerald-700"
        />
      </div>
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span>
          Order <span className="font-semibold text-[#1F2937]">{shortDate(row.orderDate || id)}</span>
        </span>
        <span>
          Pickup <span className="font-semibold text-[#1F2937]">{shortDate(row.pickupDate)}</span>
        </span>
        <span>
          Time <span className="font-semibold text-[#1F2937]">{formatTime12h(row.pickupTime)}</span>
        </span>
      </div>
      <div className="mt-1.5">
        <StatusBadge status={row.status || row.qualityStatus} />
      </div>
      <GradeMiniTable map={map} unit={unit} rejected={rejected} />
      <button type="button" className={`${actionBtnClass(label)} mt-2 h-9 w-full`} onClick={() => onOpen(row)}>
        {label}
      </button>
    </article>
  );
}

export default function ManagerQualityListPage({ mode = "pending" }) {
  const meta = COPY[mode] || COPY.pending;
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    listManagerQuality({ bucket: meta.bucket })
      .then((data) => setRows(data?.items || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [meta.bucket], 8000);

  const openRow = (row) => navigate(`/manager/quality/${row.orderId}`);
  const showRejected = mode === "completed";
  const gradeColumns = useMemo(() => {
    const present = new Set();
    rows.forEach((row) => {
      Object.entries(gradeDetailMap(row)).forEach(([g, v]) => {
        if (Number(v?.qty) > 0) present.add(g);
      });
    });
    const preferred = DEFAULT_GRADES.filter((g) => present.has(g));
    const extras = Array.from(present).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...preferred, ...extras];
  }, [rows]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className={`${EXCEL_PAGE_TITLE} text-[18px] leading-tight`}>
          <span className="block sm:inline">Quality and Grading Manager</span>
          <span className="hidden sm:inline"> · </span>
          <span className="mt-0.5 block text-[15px] font-semibold text-slate-700 sm:mt-0 sm:inline sm:text-inherit sm:font-bold">
            {meta.title}
          </span>
        </h1>
        <p className={`${EXCEL_PAGE_SUB} mt-1`}>{meta.sub}</p>
      </div>

      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 md:hidden">
        {TABS.map((tab) => {
          const active = tab.mode === mode;
          return (
            <Link
              key={tab.mode}
              to={tab.to}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                active ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Loading inspections…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="No orders" description={meta.empty} />
      ) : (
        <>
          <div className="space-y-2.5 md:hidden">
            {rows.map((row) => (
              <QualityMobileCard
                key={row.inspectionId}
                row={row}
                onOpen={openRow}
                label={actionLabel(mode, row)}
                showRejected={showRejected}
              />
            ))}
          </div>

          <div className="hidden w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <table className="w-full min-w-[760px] border-collapse text-[10px] sm:text-[11px]">
              <colgroup>
                <col className="w-10" />
                <col className="w-[13.5rem]" />
                <col className="w-[8rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[5rem]" />
                {gradeColumns.map((g) => (
                  <col key={`col-${g}`} className="w-[5.5rem]" />
                ))}
                {showRejected ? <col className="w-[5.5rem]" /> : null}
                <col className="w-[7rem]" />
                <col className="w-[6.5rem]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>Order ID</th>
                  <th className={TH}>Product</th>
                  <th className={TH}>Order Date</th>
                  <th className={TH}>Pickup Date</th>
                  <th className={TH}>Pickup Time</th>
                  {gradeColumns.map((g) => {
                    const tone = gradeTone(g);
                    return (
                      <th
                        key={g}
                        className={`border px-0.5 py-1.5 text-center text-[9px] font-bold leading-tight sm:text-[10px] ${tone.head}`}
                      >
                        {g}
                      </th>
                    );
                  })}
                  {showRejected ? (
                    <th className="border border-[#FECACA] bg-[#FEE2E2] px-0.5 py-1.5 text-center text-[9px] font-bold leading-tight text-[#991B1B] sm:text-[10px]">
                      Rejected
                    </th>
                  ) : null}
                  <th className={TH}>Status</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const id = r.orderDisplayId || r.orderId;
                  const map = gradeDetailMap(r);
                  const unit = r.unit || "Kg";
                  const rejected = showRejected ? rejectedBreakdown(r) : null;
                  const label = actionLabel(mode, r);
                  return (
                    <tr key={r.inspectionId} className="hover:bg-[#F9FBF9]">
                      <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                      <td className={`${TD} whitespace-nowrap sm:text-[11px]`}>
                        <span className="inline-flex max-w-full items-center gap-0.5">
                          <span className="truncate font-mono text-[10px] font-semibold text-[#217346] sm:text-[11px]" title={id}>
                            {id}
                          </span>
                          <CopyButton value={id} />
                        </span>
                      </td>
                      <td className={TD} title={[r.productName, r.variety].filter(Boolean).join(" · ")}>
                        <span className="block font-semibold text-[#1F2937]">{r.productName || "Produce"}</span>
                        {r.variety ? <span className="mt-0.5 block text-[9px] leading-tight text-[#6B7280]">{r.variety}</span> : null}
                      </td>
                      <td className={`${TD} whitespace-nowrap text-center`}>{shortDate(r.orderDate || id)}</td>
                      <td className={`${TD} whitespace-nowrap text-center`}>{shortDate(r.pickupDate)}</td>
                      <td className={`${TD} whitespace-nowrap text-center`}>{formatTime12h(r.pickupTime)}</td>
                      {gradeColumns.map((g) => {
                        const row = map[g] || { qty: 0, unit };
                        const tone = gradeTone(g);
                        return (
                          <td
                            key={`${r.inspectionId}-${g}`}
                            className={`border px-0.5 py-1.5 text-center text-[10px] tabular-nums sm:text-[11px] ${tone.cell}`}
                          >
                        {Number(row.qty) > 0 ? formatQty(row.qty, row.unit || unit) : null}
                          </td>
                        );
                      })}
                      {showRejected ? (
                        <td className="border border-[#FECACA] bg-[#FEF2F2] px-0.5 py-1.5 text-center text-[10px] font-semibold tabular-nums text-[#DC2626] sm:text-[11px]">
                          {formatQty(rejected?.total, unit, { allowZero: true })}
                        </td>
                      ) : null}
                      <td className={`${TD} bg-white px-0.5 py-1 text-center align-middle sm:px-1`}>
                        <StatusBadge status={r.status || r.qualityStatus} />
                      </td>
                      <td className={`${TD} bg-white px-0.5 py-1 align-middle sm:px-1`}>
                        <button type="button" className={`${actionBtnClass(label)} w-full`} onClick={() => openRow(r)}>
                          {label}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
