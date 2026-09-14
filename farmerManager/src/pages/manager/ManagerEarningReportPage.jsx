import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerQualityReport, getManagerQuality, updateManagerOrderPayment } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { formatMoney } from "../../utils/orderDisplay";
import { gradeStatementRows, gradeStatementTotals, num } from "../../utils/gradeStatement";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../../utils/excelStyles";

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

function qualityTimelineIndex(status, paymentStatus) {
  const p = String(paymentStatus || "").toUpperCase().trim();
  const isPaid = p === "PAID" || p === "PAYMENT_COMPLETED" || p === "COMPLETED" || p === "PAYMENT RECEIVED";
  if (isPaid) return 4;
  const s = String(status || "").toUpperCase();
  if (s === "GRADE_CONFIRMED" || s === "ORDER_COMPLETED") return 3;
  if (s === "GRADING") return 2;
  if (s === "INSPECTION" || s === "QUALITY_CHECK") return 1;
  return 0;
}

function QualityStatusTimeline({ status, paymentStatus }) {
  const isPaid = ["PAID", "PAYMENT_COMPLETED", "COMPLETED", "PAYMENT RECEIVED"].includes(
    String(paymentStatus || "").toUpperCase().trim()
  );
  const idx = qualityTimelineIndex(status, paymentStatus);
  const steps = [
    { key: "RECEIVED", label: "Received" },
    { key: "QUALITY_CHECK", label: "Quality Check" },
    { key: "GRADING", label: "Grading" },
    { key: "GRADING_COMPLETED", label: "Grading Completed" },
    { key: "PAYMENT", label: isPaid ? "Payment Completed" : "Payment" },
  ];

  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const done = i <= idx;
        const lineDone = i < idx;
        const last = i === steps.length - 1;
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
          <div className="max-h-full max-w-3xl bg-white p-3 shadow-xl rounded-md" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-xs font-semibold">{preview.label || "Preview"}</p>
            <img src={preview.url} alt="" className="max-h-[70vh] max-w-full rounded" />
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

export default function ManagerEarningReportPage() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: "Paid",
    paymentMethod: "Bank Transfer",
    transactionId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const loadReport = () => {
    getManagerQualityReport(orderId)
      .then((res) => {
        setData(res);
        setError("");
      })
      .catch(() => {
        return getManagerQuality(orderId).then((res) => {
          setData(res);
          setError("");
        });
      })
      .catch((err) => {
        setData(null);
        setError(err.message || "Quality report is available after grading is confirmed");
      })
      .finally(() => setLoading(false));
  };

  usePolling(loadReport, [orderId], 12000);

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

  const finalPayableAmount = Number(totals.amount || data?.totalAmount || data?.orderValue || data?.finalAmount || 0);
  const currentPaymentStatus = String(data?.paymentStatus || data?.order?.paymentStatus || "Pending");
  const isPaid = currentPaymentStatus.toUpperCase() === "PAID" || currentPaymentStatus.toUpperCase() === "COMPLETED";

  const handleOpenPaymentModal = () => {
    const details = data?.order?.paymentDetails || {};
    setPaymentForm({
      paymentStatus: isPaid ? "Paid" : "Paid",
      paymentMethod: details.paymentMethod || data?.order?.paymentMethod || "Bank Transfer",
      transactionId: details.transactionId || data?.order?.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      paymentDate: details.paymentDate ? String(details.paymentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: details.notes || "",
    });
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      await updateManagerOrderPayment(orderId, {
        ...paymentForm,
        amount: finalPayableAmount,
      });
      toast.success(`Payment status updated to ${paymentForm.paymentStatus} successfully!`);
      setPaymentModalOpen(false);
      setData((prev) => (prev ? { ...prev, paymentStatus: paymentForm.paymentStatus, order: { ...(prev.order || {}), paymentStatus: paymentForm.paymentStatus, paymentDetails: { ...paymentForm, amount: finalPayableAmount } } } : prev));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loading) return <LoadingState rows={8} />;
  if (!data) {
    return (
      <div className="space-y-3 p-4">
        <Link to="/manager/earnings" className="text-xs text-[#6B7280] hover:text-[#217346]">
          ← Back to Earning Statement
        </Link>
        <EmptyState title="Quality report not ready" description={error || "This report is available after Grading Completed."} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 font-sans">
      <p className="mb-1 break-words text-xs text-[#6B7280] print:hidden">
        <Link to="/manager/earnings" className="hover:text-[#217346] font-semibold">
          ← Earning Statement
        </Link>
        <span> › {data.orderDisplayId || orderId}</span>
      </p>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <StatusBadge status={data.status || data.qualityStatus} className="shrink-0" />
          <h1 className={`${EXCEL_PAGE_TITLE} min-w-0 text-[16px] sm:text-xl`}>Quality Inspection & Grading</h1>
          <p className={`${EXCEL_PAGE_SUB} min-w-0 truncate`}>
            {data.productName || data.product}
            {data.variety ? ` · ${data.variety}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenPaymentModal}
          className={`${EXCEL_BTN_PRIMARY} print:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold`}
        >
          💳 {isPaid ? "Update Payment" : "Pay Farmer / Mark Paid"}
        </button>
      </div>

      {/* 1. Quality Status Timeline */}
      <section className={EXCEL_PANEL}>
        <div className="px-2 py-3 sm:px-4">
          <QualityStatusTimeline status={data.status || data.qualityStatus} paymentStatus={currentPaymentStatus} />
        </div>
      </section>

      {/* 2. Order Information */}
      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>1. Order Information</div>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Info label="Order ID" value={data.orderDisplayId || data.orderId} />
          <Info label="Product" value={data.productName || data.product} />
          <Info label="Variety" value={data.variety} />
          <Info label="Farmer Name" value={data.farmerName || data.farmer?.name || "Farmer"} />
          <Info label="Ordered Quantity" value={qtyLabel(data.orderedQuantity, unit)} />
          <Info label="Received Quantity" value={qtyLabel(data.receivedQuantity, unit)} />
          <Info label="Lot / Batch ID" value={data.batchId} />
          <Info label="Collection Centre" value={data.collectionCentre} />
          <Info label="Pickup Date" value={data.pickupDate || "—"} />
          <Info label="Pickup Time" value={data.pickupTime || "—"} />
          <Info label="Received Date" value={data.receivedDate || "—"} />
          <Info label="Received Time" value={data.receivedTime || "—"} />
          <Info label="Weight Verified" value={data.weightVerified ? "Yes" : "No"} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Payment Status</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={currentPaymentStatus} />
              <button
                type="button"
                onClick={handleOpenPaymentModal}
                className="text-[11px] font-semibold text-[#217346] hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Grade-wise Quality Check */}
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

      {/* 4. Quality Remarks */}
      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>3. Quality Remarks</div>
        <div className="p-3">
          <p className="whitespace-pre-wrap text-sm text-[#1F2937]">{data.qualityRemarks || "—"}</p>
        </div>
      </section>

      {/* 5. Final Summary */}
      <section id="final-report" className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>4. Final Summary</div>
        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Info label="Order ID" value={data.orderDisplayId || data.orderId} />
            <Info label="Product" value={data.productName || data.product} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Payment Status</p>
              <div className="mt-1">
                <StatusBadge status={currentPaymentStatus} />
              </div>
            </div>
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
                  {formatMoney(finalPayableAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Farmer Payment & Settlement Option Section */}
      <section className={`${EXCEL_PANEL} border-l-4 ${isPaid ? "border-l-[#217346]" : "border-l-[#F59E0B]"}`}>
        <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
          <span>5. Farmer Payment & Settlement</span>
          <StatusBadge status={currentPaymentStatus} />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#6B7280]">Total Payable Amount to Farmer</p>
              <p className="text-xl font-extrabold text-[#217346]">₹{finalPayableAmount.toLocaleString("en-IN")}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              className={`${EXCEL_BTN_PRIMARY} px-4 py-2 text-xs font-bold shadow-sm`}
            >
              💳 {isPaid ? "Update Payment Details" : "Pay Farmer (Mark Paid)"}
            </button>
          </div>

          {data?.order?.paymentDetails ? (
            <div className="rounded border border-slate-200 bg-[#F8FAF8] p-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Method</p>
                <p className="font-semibold text-slate-800">{data.order.paymentDetails.paymentMethod || "Bank Transfer"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Transaction ID</p>
                <p className="font-mono font-semibold text-slate-800">{data.order.paymentDetails.transactionId || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Payment Date</p>
                <p className="font-semibold text-slate-800">{data.order.paymentDetails.paymentDate ? String(data.order.paymentDetails.paymentDate).slice(0, 10) : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Notes</p>
                <p className="font-semibold text-slate-800">{data.order.paymentDetails.notes || "—"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Footer Actions */}
      <div className="flex flex-col gap-2 print:hidden sm:flex-row">
        <Link to="/manager/earnings" className={`${EXCEL_BTN} w-full sm:w-auto text-center font-semibold`}>
          ← Back to Earning Statement
        </Link>
        <button type="button" className={`${EXCEL_BTN} w-full sm:w-auto`} onClick={() => window.print()}>
          🖨️ Download / Print Final Report
        </button>
      </div>

      {/* Payment Action Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPaymentModalOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl border border-slate-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-extrabold text-[#1F2937]">Farmer Payment & Settlement</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                onClick={() => setPaymentModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payable Amount</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${finalPayableAmount.toLocaleString("en-IN")}`}
                  className="mt-1 w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm font-extrabold text-[#217346]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Status</label>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:border-[#217346]"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:border-[#217346]"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Transaction / Ref ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
                  placeholder="e.g. TXN-984210"
                  className={`${EXCEL_INPUT} mt-1 w-full font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))}
                  className={`${EXCEL_INPUT} mt-1 w-full text-xs`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Remarks / Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Paid to farmer bank account"
                  className={`${EXCEL_INPUT} mt-1 w-full text-xs`}
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  className={EXCEL_BTN}
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className={`${EXCEL_BTN_PRIMARY} px-4 py-2 font-bold`}
                >
                  {paymentSaving ? "Saving…" : "Save Payment Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
