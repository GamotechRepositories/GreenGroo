import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import QualityPhotos from "../../components/quality/QualityPhotos";

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
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function QualityInspectionPage() {
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
      const res = await vendorApi.getQuality(orderId);
      hydrate(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Quality inspection not found");
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
  const canAssign = started && !locked && paramsComplete && split.remaining === 0 && rejectionOk && split.total >= 0;

  const setParam = (key, value) => {
    setForm((f) => ({ ...f, qualityParameters: { ...f.qualityParameters, [key]: value } }));
  };

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      const res = await fn();
      hydrate(res.data);
      return res.data;
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed");
      throw err;
    } finally {
      setBusy("");
    }
  };

  const startCheck = () => run("start", () => vendorApi.startQuality(orderId));

  const savePhotos = (photos) => {
    setForm((f) => ({ ...f, photos }));
    vendorApi
      .uploadQualityPhotos(orderId, { photos, replace: true })
      .then((res) => hydrate(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to save photos"));
  };

  const assignGrade = async () => {
    await run("params", () =>
      vendorApi.saveQualityParameters(orderId, {
        qualityParameters: form.qualityParameters,
        qualityRemarks: form.qualityRemarks,
      })
    );
    await run("grade", () =>
      vendorApi.saveQualityGrading(orderId, {
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
    await run("confirm", () => vendorApi.confirmQuality(orderId));
    setConfirmOpen(false);
  };

  if (!data && !error) return <p className="p-6 text-xs text-gray-400">Loading quality inspection…</p>;
  if (!data) return <p className="p-6 text-xs text-red-500">{error}</p>;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <div className="mb-1 text-xs text-gray-400">
            <Link to="/vendor/quality/pending" className="hover:text-[#217346]">Quality & Grading</Link>
            <span> › {data.orderDisplayId}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Quality Inspection</h1>
          <p className="text-sm text-gray-500">{data.farmerName} · {data.productName}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase">
          {String(data.status || "").replace(/_/g, " ")}
        </span>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 print:hidden">{error}</div> : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        {data.status === "QUALITY_PENDING" ? (
          <button type="button" disabled={Boolean(busy)} className="bg-[#217346] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={startCheck}>
            {busy === "start" ? "Starting…" : "Start Quality Check"}
          </button>
        ) : null}
        {started && !locked ? (
          <button type="button" disabled={!canAssign || Boolean(busy)} className="bg-[#217346] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={assignGrade}>
            Assign Grade
          </button>
        ) : null}
        {locked ? (
          <>
            <a href="#final-report" className="border border-gray-200 px-3 py-1.5 text-xs font-semibold">View Final Report</a>
            <button type="button" className="border border-gray-200 px-3 py-1.5 text-xs font-semibold" onClick={() => window.print()}>
              Download Final Report
            </button>
          </>
        ) : null}
      </div>

      <section className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">1. Order Information</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

      <section className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">2. Weight Information</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="Actual Weight" value={`${data.actualWeight} ${unit}`} />
          <Info label="Accepted Weight" value={`${data.acceptedWeight} ${unit}`} />
          <Info label="Received Quantity" value={`${data.receivedQuantity} ${unit}`} />
          <Info label="Weight Verified" value={data.weightVerified ? "Yes" : "No"} />
        </div>
      </section>

      <section className="border border-gray-200 bg-white p-5 print:hidden">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">3. Quality Parameters</p>
        {!started ? <p className="text-xs text-gray-400">Start quality check to enter parameters.</p> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARAM_FIELDS.map((f) => (
              <label key={f.key} className="text-xs font-semibold">
                {f.label} *
                <select
                  disabled={locked}
                  className="mt-1 w-full border border-gray-200 px-3 py-1.5 text-xs"
                  value={form.qualityParameters[f.key] || ""}
                  onChange={(e) => setParam(f.key, e.target.value)}
                >
                  <option value="">Select</option>
                  {(options[f.key] || []).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="border border-gray-200 bg-white p-5 print:hidden">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">4. Quality Photos</p>
        <QualityPhotos photos={form.photos} onChange={savePhotos} disabled={locked || !started} />
      </section>

      <section className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">5. Grade Allocation</p>
        <div className="space-y-3">
          {GRADE_ROWS.map((row) => (
            <div key={row.key} className="border border-gray-100 px-3 py-3">
              <p className="text-xs font-bold text-gray-800">{row.title}</p>
              <label className="mt-2 block text-xs">
                Quantity
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    disabled={locked || !started}
                    className="w-40 border border-gray-200 px-3 py-1.5 text-xs"
                    value={form[row.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [row.key]: e.target.value }))}
                  />
                  <span className="text-xs text-gray-500">{unit}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">6. Rejected Quantity</p>
        <div className="border border-gray-100 px-3 py-3">
          <p className="text-xs font-bold text-gray-800">REJECTED</p>
          <label className="mt-2 block text-xs">
            Quantity
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.001"
                disabled={locked || !started}
                className="w-40 border border-gray-200 px-3 py-1.5 text-xs"
                value={form.rejectedQuantity}
                onChange={(e) => setForm((f) => ({ ...f, rejectedQuantity: e.target.value }))}
              />
              <span className="text-xs text-gray-500">{unit}</span>
            </div>
          </label>
          {split.r > 0 ? (
            <>
              <label className="mt-3 block text-xs">
                Reason *
                <select
                  disabled={locked}
                  className="mt-1 w-full max-w-sm border border-gray-200 px-3 py-1.5 text-xs"
                  value={form.rejectionReason}
                  onChange={(e) => setForm((f) => ({ ...f, rejectionReason: e.target.value }))}
                >
                  <option value="">Select reason</option>
                  {(data.rejectionReasons || []).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              {form.rejectionReason === "Other" ? (
                <label className="mt-3 block text-xs">
                  Other Reason *
                  <input
                    disabled={locked}
                    className="mt-1 w-full border border-gray-200 px-3 py-1.5 text-xs"
                    value={form.rejectionRemarks}
                    onChange={(e) => setForm((f) => ({ ...f, rejectionRemarks: e.target.value }))}
                  />
                </label>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <Info label="Total Received" value={`${split.total} ${unit}`} />
          <Info label="Allocated" value={`${split.allocated} ${unit}`} />
          <Info label="Remaining" value={`${split.remaining} ${unit}`} />
        </div>
        {split.remaining !== 0 ? (
          <p className="mt-2 text-[11px] text-amber-700">Remaining quantity must be 0 before grading can be confirmed.</p>
        ) : null}
        {!paramsComplete && started ? (
          <p className="mt-2 text-[11px] text-amber-700">Complete all mandatory quality parameters before assigning grades.</p>
        ) : null}
      </section>

      <section className="border border-gray-200 bg-white p-5 print:hidden">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">7. Quality Remarks</p>
        <textarea
          disabled={locked || !started}
          rows={3}
          className="w-full border border-gray-200 px-3 py-2 text-xs"
          placeholder="Additional observations"
          value={form.qualityRemarks}
          onChange={(e) => setForm((f) => ({ ...f, qualityRemarks: e.target.value }))}
        />
      </section>

      <section id="final-report" className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">8. Final Summary</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

      <section className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">9. Order Timeline</p>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(data.timeline || []).map((step) => (
            <li
              key={step.key}
              className={`border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide ${
                step.done ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="w-full max-w-md border border-gray-200 bg-white p-5">
            <p className="text-sm font-bold text-gray-900">Are you sure you want to assign these grades?</p>
            <div className="mt-3 space-y-1 text-xs text-gray-700">
              <p>Grade A Quantity: {split.a} {unit}</p>
              <p>Grade B Quantity: {split.b} {unit}</p>
              <p>Grade C Quantity: {split.c} {unit}</p>
              <p>Rejected Quantity: {split.r} {unit}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="border border-gray-200 px-3 py-1.5 text-xs" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" disabled={Boolean(busy)} className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={confirmGrading}>
                {busy === "confirm" ? "Confirming…" : "Confirm Grading"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
