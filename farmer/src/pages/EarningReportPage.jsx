import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyQualityReport } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import CopyId, { isCopyableId } from "../components/ui/CopyId";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { formatMoney } from "../utils/orderDisplay";
import { gradeStatementRows, gradeStatementTotals, num } from "../utils/gradeStatement";
import {
  EXCEL_BTN,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

const PARAM_FIELDS = [
  { key: "freshness", label: "Freshness" },
  { key: "size", label: "Size" },
  { key: "colour", label: "Colour" },
  { key: "appearance", label: "Appearance" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "damage", label: "Damage" },
  { key: "moisture", label: "Moisture" },
  { key: "weight", label: "Weight" },
  { key: "overallQuality", label: "Overall Quality" },
];

const GRADE_ROWS = [
  { key: "gradeAQuantity", label: "Grade A" },
  { key: "gradeBQuantity", label: "Grade B" },
  { key: "gradeCQuantity", label: "Grade C" },
];

const GRADE_TONE = {
  "Grade A": "border-[#A7F3D0] bg-[#ECFDF5]",
  "Grade B": "border-[#BFDBFE] bg-[#EFF6FF]",
  "Grade C": "border-[#FDE68A] bg-[#FFFBEB]",
};

const QUALITY_TIMELINE = [
  { key: "RECEIVED", label: "Received" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "GRADING", label: "Grading" },
  { key: "GRADING_COMPLETED", label: "Grading Completed" },
];

function qualityTimelineIndex(status) {
  const s = String(status || "").toUpperCase();
  if (s === "GRADE_CONFIRMED" || s === "ORDER_COMPLETED") return 3;
  if (s === "GRADING") return 2;
  if (s === "INSPECTION" || s === "QUALITY_CHECK") return 1;
  return 0;
}

function QualityStatusTimeline({ status }) {
  const idx = qualityTimelineIndex(status);
  return (
    <ol className="flex w-full items-start">
      {QUALITY_TIMELINE.map((step, i) => {
        const done = i <= idx;
        const lineDone = i < idx;
        const last = i === QUALITY_TIMELINE.length - 1;
        return (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center px-0.5">
            {!last ? (
              <span
                className={`pointer-events-none absolute left-1/2 top-[8px] h-[3px] w-full ${
                  lineDone ? "bg-[#217346]" : "bg-[#C9E4D3]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${
                done ? "border-[#217346]" : "border-[#C9E4D3]"
              }`}
            >
              {done ? <span className="h-[6px] w-[6px] rounded-full bg-[#217346]" /> : null}
            </span>
            <p
              className={`mt-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                done ? "text-[#217346]" : "text-[#9CA3AF]"
              }`}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId
          value={value}
          className="mt-0.5"
          textClassName="break-all font-mono text-xs font-semibold text-[#1F2937]"
          breakAll
        />
      ) : (
        <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value ?? "—"}</p>
      )}
    </div>
  );
}

function ReportPhotos({ photos }) {
  const [preview, setPreview] = useState(null);
  const rows = Array.isArray(photos) ? photos.filter((p) => p?.url) : [];
  if (!rows.length) {
    return <p className="text-[11px] text-[#9CA3AF]">No quality photos.</p>;
  }
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {rows.map((p, i) => (
          <button
            key={`${i}-${(p.url || "").slice(-12)}`}
            type="button"
            className="overflow-hidden rounded-lg border border-[#D4D4D4] bg-white p-0.5 text-left"
            onClick={() => setPreview(p)}
          >
            <img src={p.url} alt={p.label || "Quality"} className="h-16 w-full object-cover" />
            <p className="truncate px-0.5 py-0.5 text-[9px] text-[#6B7280]">{p.label || "Photo"}</p>
          </button>
        ))}
      </div>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-full max-w-3xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-xs font-semibold">{preview.label || "Preview"}</p>
            <img src={preview.url} alt="" className="max-h-[70vh] max-w-full" />
            <button type="button" className={`mt-2 ${EXCEL_BTN}`} onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function qtyLabel(value, unit) {
  const n = num(value);
  return `${n.toLocaleString("en-IN")} ${unit || "Kg"}`;
}

export default function EarningReportPage() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    getMyQualityReport(orderId)
      .then((row) => {
        setData(row);
        setError("");
      })
      .catch((err) => {
        setData(null);
        setError(err.message || "Quality report is available after grading is confirmed");
      })
      .finally(() => setLoading(false));
  }, [orderId], 12000);

  const unit = data?.unit || "Kg";
  const gq = data?.gradeQuality || {};
  const qualityGrades = useMemo(() => {
    if (!data) return [];
    return GRADE_ROWS.filter((row) => {
      const assigned = num(data[row.key]);
      const statement = (data.finalStatement || []).find((g) => g.label === row.label);
      const ordered = num(statement?.orderedQuantity);
      const rejected = num(gq[row.label]?.rejectedQuantity);
      return assigned > 0 || ordered > 0 || rejected > 0;
    });
  }, [data, gq]);

  const summaryRows = useMemo(() => {
    if (!data) return [];
    return gradeStatementRows({
      ...data.order,
      ...data,
      grades: data.finalStatement?.length ? data.finalStatement : data.grades,
      finalStatement: data.finalStatement,
      orderedGrades: data.orderedGrades,
      gradeQuality: data.gradeQuality,
      gradeAAssigned: data.gradeAAssigned ?? data.order?.gradeAAssigned,
      gradeBAssigned: data.gradeBAssigned ?? data.order?.gradeBAssigned,
      gradeCAssigned: data.gradeCAssigned ?? data.order?.gradeCAssigned,
    });
  }, [data]);
  const totals = useMemo(() => gradeStatementTotals(summaryRows), [summaryRows]);

  if (loading) return <LoadingState rows={8} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Link to="/farmer/earnings" className="text-xs text-[#6B7280] hover:text-[#217346]">
          ← Earning Statement
        </Link>
        <EmptyState title="Quality report not ready" description={error || "This report is available after Grading Completed."} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="mb-1 break-words text-xs text-[#6B7280] print:hidden">
        <Link to="/farmer/earnings" className="hover:text-[#217346]">
          Earning Statement
        </Link>
        <span> › {data.orderDisplayId || orderId}</span>
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <StatusBadge status={data.status || data.qualityStatus} className="shrink-0" />
        <h1 className={`${EXCEL_PAGE_TITLE} min-w-0 text-[16px] sm:text-xl`}>Quality Inspection & Grading</h1>
        <p className={`${EXCEL_PAGE_SUB} min-w-0 truncate`}>
          {data.productName || data.product}
          {data.variety ? ` · ${data.variety}` : ""}
        </p>
      </div>

      <section className={EXCEL_PANEL}>
        <div className="px-2 py-3 sm:px-4">
          <QualityStatusTimeline status={data.status || data.qualityStatus} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>1. Order Information</div>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Info label="Order ID" value={data.orderDisplayId || data.orderId} />
          <Info label="Product" value={data.productName || data.product} />
          <Info label="Variety" value={data.variety} />
          <Info label="Ordered Quantity" value={qtyLabel(data.orderedQuantity, unit)} />
          <Info label="Received Quantity" value={qtyLabel(data.receivedQuantity, unit)} />
          <Info label="Lot / Batch ID" value={data.batchId} />
          <Info label="Collection Centre" value={data.collectionCentre} />
          <Info label="Pickup Date" value={data.pickupDate || "—"} />
          <Info label="Pickup Time" value={data.pickupTime || "—"} />
          <Info label="Received Date" value={data.receivedDate || "—"} />
          <Info label="Received Time" value={data.receivedTime || "—"} />
          <Info label="Weight Verified" value={data.weightVerified ? "Yes" : "No"} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>2. Grade-wise Quality Check</div>
        <div className="space-y-2 p-3">
          {qualityGrades.length === 0 ? (
            <p className="text-[11px] text-[#9CA3AF]">No grade inspection details.</p>
          ) : (
            qualityGrades.map((row) => {
              const grade = gq[row.label] || {};
              const params = grade.parameters || {};
              const assigned = num(data[row.key]);
              return (
                <div key={row.label} className={`overflow-hidden rounded-lg border ${GRADE_TONE[row.label] || "border-[#D4D4D4]"}`}>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-[#1F2937]">{row.label}</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#1F2937]">
                      {assigned} {unit}
                    </p>
                  </div>
                  <div className="border-t border-black/5 px-3 pb-3">
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {PARAM_FIELDS.map((f) => (
                        <div key={f.key}>
                          <p className="text-[10px] font-semibold text-[#6B7280]">{f.label}</p>
                          <p className="text-[12px] font-semibold text-[#1F2937]">{params[f.key] || "—"}</p>
                        </div>
                      ))}
                      <div>
                        <p className="text-[10px] font-semibold text-[#6B7280]">Rejected Quantity</p>
                        <p className="text-[12px] font-semibold text-[#DC2626]">
                          {num(grade.rejectedQuantity) > 0 ? qtyLabel(grade.rejectedQuantity, unit) : "×"}
                        </p>
                      </div>
                      {num(grade.rejectedQuantity) > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold text-[#6B7280]">Rejection Reason</p>
                          <p className="text-[12px] font-semibold text-[#1F2937]">
                            {grade.rejectionReason || "—"}
                            {grade.rejectionRemarks ? ` — ${grade.rejectionRemarks}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-semibold text-[#4B5563]">Photos</p>
                      <ReportPhotos photos={grade.photos} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>3. Quality Remarks</div>
        <div className="p-3">
          <p className="whitespace-pre-wrap text-sm text-[#1F2937]">{data.qualityRemarks || "—"}</p>
        </div>
      </section>

      <section id="final-report" className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>4. Final Summary</div>
        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Info label="Order ID" value={data.orderDisplayId || data.orderId} />
            <Info label="Product" value={data.productName || data.product} />
          </div>
          <table className="w-full table-fixed border-collapse text-left text-[10px] md:text-xs">
              <thead>
                <tr className="bg-[#F8FAF8] text-[9px] font-bold uppercase tracking-wide text-[#6B7280] md:text-[10px]">
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 md:px-2 md:py-2">Grade</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Ordered</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Rejected</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Final Qty</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Rate</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length ? (
                  summaryRows.map((row) => (
                    <tr key={row.label} className={GRADE_TONE[row.label] || ""}>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 font-semibold text-[#1F2937] md:px-2 md:py-2">
                        {row.label}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {qtyLabel(row.ordered, unit)}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums text-[#DC2626] md:px-2 md:py-2">
                        {qtyLabel(row.rejected, unit)}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {qtyLabel(row.finalQty, unit)}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {row.rate > 0 ? formatMoney(row.rate) : "×"}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right font-semibold tabular-nums text-[#217346] md:px-2 md:py-2">
                        {row.amount > 0 ? formatMoney(row.amount) : "×"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-[#9CA3AF] md:px-2 md:py-2" colSpan={6}>
                      No grade quantities.
                    </td>
                  </tr>
                )}
                <tr className="bg-[#F8FAF8] font-bold">
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 md:px-2 md:py-2">Total</td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                    {qtyLabel(totals.ordered || data.orderedQuantity, unit)}
                  </td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums text-[#DC2626] md:px-2 md:py-2">
                    {qtyLabel(totals.rejected, unit)}
                  </td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                    {qtyLabel(totals.finalQty, unit)}
                  </td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 md:px-2 md:py-2" />
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums text-[#217346] md:px-2 md:py-2">
                    {formatMoney(totals.amount || data.totalAmount || data.orderValue || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
      </section>

      <div className="flex flex-col gap-2 print:hidden sm:flex-row">
        <Link to="/farmer/earnings" className={`${EXCEL_BTN} w-full sm:w-auto`}>
          Back to Earning Statement
        </Link>
        <button type="button" className={`${EXCEL_BTN} w-full sm:w-auto`} onClick={() => window.print()}>
          Download Final Report
        </button>
      </div>
    </div>
  );
}
