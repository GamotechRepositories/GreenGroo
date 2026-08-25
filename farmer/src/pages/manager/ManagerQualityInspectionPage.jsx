import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getManagerQuality,
  startManagerQuality,
  uploadManagerQualityPhotos,
  saveManagerQualityParameters,
  saveManagerQualityGrading,
  confirmManagerQuality,
} from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import QualityPhotos from "../../components/quality/QualityPhotos";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
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
  { key: "gradeAQuantity", title: "GRADE A — PREMIUM" },
  { key: "gradeBQuantity", title: "GRADE B — STANDARD" },
  { key: "gradeCQuantity", title: "GRADE C — LOW GRADE" },
];

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value ?? "—"}</p>
    </div>
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ManagerQualityInspectionPage() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    qualityParameters: {},
    qualityRemarks: "",
    gradeAQuantity: "",
    gradeBQuantity: "",
    gradeCQuantity: "",
    rejectedQuantity: "",
    rejectionReason: "",
    rejectionRemarks: "",
    photos: [],
  });

  const hydrate = (d) => {
    setData(d);
    setForm({
      qualityParameters: { ...(d.qualityParameters || {}) },
      qualityRemarks: d.qualityRemarks || "",
      gradeAQuantity: d.gradeAQuantity ?? "",
      gradeBQuantity: d.gradeBQuantity ?? "",
      gradeCQuantity: d.gradeCQuantity ?? "",
      rejectedQuantity: d.rejectedQuantity ?? "",
      rejectionReason: d.rejectionReason || "",
      rejectionRemarks: d.rejectionRemarks || "",
      photos: d.qualityPhotos || [],
    });
  };

  const load = async () => {
    try {
      hydrate(await getManagerQuality(orderId));
      setError("");
    } catch (err) {
      setError(err.message || "Quality inspection not found");
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const locked = Boolean(data?.locked);
  const started = data && data.status !== "QUALITY_PENDING";
  const options = data?.paramOptions || {};
  const unit = data?.unit || "Kg";

  const split = useMemo(() => {
    const total = num(data?.receivedQuantity);
    const a = num(form.gradeAQuantity);
    const b = num(form.gradeBQuantity);
    const c = num(form.gradeCQuantity);
    const r = num(form.rejectedQuantity);
    const allocated = Math.round((a + b + c + r) * 1000) / 1000;
    return { total, allocated, remaining: Math.round((total - allocated) * 1000) / 1000, a, b, c, r };
  }, [form, data]);

  const paramsComplete = PARAM_FIELDS.every((f) => String(form.qualityParameters[f.key] || "").trim());
  const rejectionOk = split.r <= 0 || (form.rejectionReason && (form.rejectionReason !== "Other" || String(form.rejectionRemarks).trim()));
  const canAssign = started && !locked && paramsComplete && split.remaining === 0 && rejectionOk;

  const setParam = (key, value) => {
    setForm((f) => ({ ...f, qualityParameters: { ...f.qualityParameters, [key]: value } }));
  };

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      const d = await fn();
      hydrate(d);
      return d;
    } catch (err) {
      setError(err.message || "Action failed");
      throw err;
    } finally {
      setBusy("");
    }
  };

  const startCheck = () => run("start", () => startManagerQuality(orderId));

  const savePhotos = (photos) => {
    setForm((f) => ({ ...f, photos }));
    uploadManagerQualityPhotos(orderId, { photos, replace: true })
      .then(hydrate)
      .catch((err) => setError(err.message || "Failed to save photos"));
  };

  const assignGrade = async () => {
    await run("params", () =>
      saveManagerQualityParameters(orderId, {
        qualityParameters: form.qualityParameters,
        qualityRemarks: form.qualityRemarks,
      })
    );
    await run("grade", () =>
      saveManagerQualityGrading(orderId, {
        gradeAQuantity: num(form.gradeAQuantity),
        gradeBQuantity: num(form.gradeBQuantity),
        gradeCQuantity: num(form.gradeCQuantity),
        rejectedQuantity: num(form.rejectedQuantity),
        rejectionReason: form.rejectionReason,
        rejectionRemarks: form.rejectionRemarks,
        qualityRemarks: form.qualityRemarks,
      })
    );
    setConfirmOpen(true);
  };

  const confirmGrading = async () => {
    await run("confirm", () => confirmManagerQuality(orderId));
    setConfirmOpen(false);
  };

  if (!data && !error) return <p className="text-xs text-[#6B7280]">Loading quality inspection…</p>;
  if (!data) return <p className="text-xs text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="mb-1 text-xs text-[#6B7280]">
            <Link to="/farmer/manager/quality/pending" className="hover:text-[#217346]">Quality & Grading</Link>
            <span> › {data.orderDisplayId}</span>
          </p>
          <h1 className={EXCEL_PAGE_TITLE}>Quality Inspection</h1>
          <p className={EXCEL_PAGE_SUB}>{data.farmerName} · {data.productName}</p>
        </div>
        <StatusBadge status={data.status} />
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 print:hidden">{error}</div> : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        {data.status === "QUALITY_PENDING" ? (
          <button type="button" disabled={Boolean(busy)} className={EXCEL_BTN_PRIMARY} onClick={startCheck}>
            {busy === "start" ? "Starting…" : "Start Quality Check"}
          </button>
        ) : null}
        {started && !locked ? (
          <button type="button" disabled={!canAssign || Boolean(busy)} className={EXCEL_BTN_PRIMARY} onClick={assignGrade}>
            Assign Grade
          </button>
        ) : null}
        {locked ? (
          <>
            <a href="#final-report" className={EXCEL_BTN}>View Final Report</a>
            <button type="button" className={EXCEL_BTN} onClick={() => window.print()}>Download Final Report</button>
          </>
        ) : null}
      </div>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>1. Order Information</div>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Info label="Order ID" value={data.orderDisplayId} />
          <Info label="QR / Order Code" value={data.qrPayload} />
          <Info label="Farmer Name" value={data.farmerName} />
          <Info label="Product" value={data.productName} />
          <Info label="Variety" value={data.variety} />
          <Info label="Ordered Quantity" value={`${data.orderedQuantity} ${unit}`} />
          <Info label="Received Quantity" value={`${data.receivedQuantity} ${unit}`} />
          <Info label="Batch ID" value={data.batchId} />
          <Info label="Collection Centre" value={data.collectionCentre} />
          <Info label="Received Date" value={data.receivedDate} />
          <Info label="Received Time" value={data.receivedTime} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>2. Weight Information</div>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
          <Info label="Actual Weight" value={`${data.actualWeight} ${unit}`} />
          <Info label="Accepted Weight" value={`${data.acceptedWeight} ${unit}`} />
          <Info label="Received Quantity" value={`${data.receivedQuantity} ${unit}`} />
          <Info label="Weight Verified" value={data.weightVerified ? "Yes" : "No"} />
        </div>
      </section>

      <section className={`${EXCEL_PANEL} print:hidden`}>
        <div className={EXCEL_PANEL_HEAD}>3. Quality Parameters</div>
        <div className="p-3">
          {!started ? <p className="text-xs text-[#9CA3AF]">Start quality check to enter parameters.</p> : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARAM_FIELDS.map((f) => (
                <label key={f.key} className="text-xs font-semibold">
                  {f.label} *
                  <select disabled={locked} className={`mt-1 w-full ${EXCEL_SELECT}`} value={form.qualityParameters[f.key] || ""} onChange={(e) => setParam(f.key, e.target.value)}>
                    <option value="">Select</option>
                    {(options[f.key] || []).map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={`${EXCEL_PANEL} print:hidden`}>
        <div className={EXCEL_PANEL_HEAD}>4. Quality Photos</div>
        <div className="p-3">
          <QualityPhotos photos={form.photos} onChange={savePhotos} disabled={locked || !started} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>5. Grade Allocation</div>
        <div className="space-y-3 p-3">
          {GRADE_ROWS.map((row) => (
            <div key={row.key} className="border border-[#D4D4D4] px-3 py-3">
              <p className="text-xs font-bold text-[#1F2937]">{row.title}</p>
              <label className="mt-2 block text-xs">
                Quantity
                <div className="mt-1 flex items-center gap-2">
                  <input type="number" min="0" step="0.001" disabled={locked || !started} className={`w-40 ${EXCEL_INPUT}`} value={form[row.key]} onChange={(e) => setForm((f) => ({ ...f, [row.key]: e.target.value }))} />
                  <span className="text-xs text-[#6B7280]">{unit}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>6. Rejected Quantity</div>
        <div className="p-3">
          <div className="border border-[#D4D4D4] px-3 py-3">
            <p className="text-xs font-bold text-[#1F2937]">REJECTED</p>
            <label className="mt-2 block text-xs">
              Quantity
              <div className="mt-1 flex items-center gap-2">
                <input type="number" min="0" step="0.001" disabled={locked || !started} className={`w-40 ${EXCEL_INPUT}`} value={form.rejectedQuantity} onChange={(e) => setForm((f) => ({ ...f, rejectedQuantity: e.target.value }))} />
                <span className="text-xs text-[#6B7280]">{unit}</span>
              </div>
            </label>
            {split.r > 0 ? (
              <>
                <label className="mt-3 block text-xs">
                  Reason *
                  <select disabled={locked} className={`mt-1 w-full max-w-sm ${EXCEL_SELECT}`} value={form.rejectionReason} onChange={(e) => setForm((f) => ({ ...f, rejectionReason: e.target.value }))}>
                    <option value="">Select reason</option>
                    {(data.rejectionReasons || []).map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                {form.rejectionReason === "Other" ? (
                  <label className="mt-3 block text-xs">
                    Other Reason *
                    <input disabled={locked} className={`mt-1 w-full ${EXCEL_INPUT}`} value={form.rejectionRemarks} onChange={(e) => setForm((f) => ({ ...f, rejectionRemarks: e.target.value }))} />
                  </label>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Info label="Total Received" value={`${split.total} ${unit}`} />
            <Info label="Allocated" value={`${split.allocated} ${unit}`} />
            <Info label="Remaining" value={`${split.remaining} ${unit}`} />
          </div>
          {split.remaining !== 0 ? <p className="mt-2 text-[11px] text-amber-700">Remaining quantity must be 0 before grading can be confirmed.</p> : null}
          {!paramsComplete && started ? <p className="mt-2 text-[11px] text-amber-700">Complete all mandatory quality parameters before assigning grades.</p> : null}
        </div>
      </section>

      <section className={`${EXCEL_PANEL} print:hidden`}>
        <div className={EXCEL_PANEL_HEAD}>7. Quality Remarks</div>
        <div className="p-3">
          <textarea disabled={locked || !started} rows={3} className={`w-full ${EXCEL_INPUT}`} placeholder="Additional observations" value={form.qualityRemarks} onChange={(e) => setForm((f) => ({ ...f, qualityRemarks: e.target.value }))} />
        </div>
      </section>

      <section id="final-report" className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>8. Final Summary</div>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Info label="Order ID" value={data.orderDisplayId} />
          <Info label="QR / Order Code" value={data.qrPayload} />
          <Info label="Farmer Name" value={data.farmerName} />
          <Info label="Product" value={data.productName} />
          <Info label="Ordered Quantity" value={`${data.orderedQuantity} ${unit}`} />
          <Info label="Received Quantity" value={`${data.receivedQuantity} ${unit}`} />
          <Info label="Accepted Quantity" value={`${data.acceptedQuantity} ${unit}`} />
          <Info label="Grade A Quantity" value={`${data.gradeAQuantity} ${unit}`} />
          <Info label="Grade B Quantity" value={`${data.gradeBQuantity} ${unit}`} />
          <Info label="Grade C Quantity" value={`${data.gradeCQuantity} ${unit}`} />
          <Info label="Rejected Quantity" value={`${data.rejectedQuantity} ${unit}`} />
          <Info label="Final Weight" value={`${data.finalWeight} ${unit}`} />
          <Info label="Final Quality Status" value={String(data.status || "").replace(/_/g, " ")} />
          <Info label="Final Amount" value={`₹ ${Number(data.finalAmount || 0).toFixed(2)}`} />
          <Info label="Payment Status" value={data.paymentStatus} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>9. Order Timeline</div>
        <ol className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
          {(data.timeline || []).map((step) => (
            <li
              key={step.key}
              className={`border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide ${
                step.done ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-[#D4D4D4] bg-[#F9FAFB] text-[#6B7280]"
              }`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="w-full max-w-md border border-[#D4D4D4] bg-white p-5">
            <p className="text-sm font-bold text-[#1F2937]">Are you sure you want to assign these grades?</p>
            <div className="mt-3 space-y-1 text-xs text-[#374151]">
              <p>Grade A Quantity: {split.a} {unit}</p>
              <p>Grade B Quantity: {split.b} {unit}</p>
              <p>Grade C Quantity: {split.c} {unit}</p>
              <p>Rejected Quantity: {split.r} {unit}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={EXCEL_BTN} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" disabled={Boolean(busy)} className={EXCEL_BTN_PRIMARY} onClick={confirmGrading}>
                {busy === "confirm" ? "Confirming…" : "Confirm Grading"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
