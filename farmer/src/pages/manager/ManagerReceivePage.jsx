import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerPickup, receiveManagerPickup, getManagerPickupReceipt, startManagerQuality } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";
import StatusBadge from "../../components/ui/StatusBadge";
import { pickupLiveLabel } from "../../components/pickup/PickupTimeline";
import ReceivingPhotos from "../../components/pickup/ReceivingPhotos";
import QrScanModal from "../../components/pickup/QrScanModal";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../../utils/excelStyles";

const UNITS = ["Kg", "Quintal", "Ton"];
const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];
const STEPS = [
  { id: "scan", label: "Scan QR" },
  { id: "details", label: "Order details" },
  { id: "weight", label: "Weight" },
  { id: "photos", label: "Photos" },
];

function qrMatches(pickup, qr) {
  const raw = String(qr || "").trim();
  if (!raw || !pickup) return false;
  return (
    raw === pickup.qrPayload ||
    raw.includes(pickup.orderDisplayId || "") ||
    raw.includes(pickup.orderId || "")
  );
}

function orderGradeQty(pickup) {
  const map = {};
  (Array.isArray(pickup?.grades) ? pickup.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    map[label] = (map[label] || 0) + Number(g.quantity || 0);
  });
  if (!Object.keys(map).length) {
    map["Grade A"] = Number(pickup?.confirmedQuantity || pickup?.packedQuantity || pickup?.expectedQuantity || 0);
  }
  return map;
}

function weightGradeRows(pickup, previous = []) {
  const qty = orderGradeQty(pickup);
  const saved = {};
  (Array.isArray(pickup?.receiving?.grades) ? pickup.receiving.grades : []).forEach((g) => {
    const label = String(g.label || "").trim();
    if (label) saved[label] = g;
  });
  const prev = {};
  previous.forEach((g) => {
    const label = String(g.label || "").trim();
    if (label) prev[label] = g;
  });
  const labels = new Set(DEFAULT_GRADES);
  Object.keys(qty).forEach((label) => labels.add(label));
  Object.keys(saved).forEach((label) => labels.add(label));
  const extras = Array.from(labels).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  return [...DEFAULT_GRADES, ...extras].map((label) => {
    const fromSave = saved[label];
    const fromPrev = prev[label];
    const expected = fromSave?.expectedWeight != null && fromSave.expectedWeight !== ""
      ? fromSave.expectedWeight
      : qty[label] || 0;
    return {
      label,
      expectedWeight: expected,
      acceptedWeight: fromSave?.acceptedWeight ?? fromPrev?.acceptedWeight ?? "",
    };
  });
}

function num(value) {
  return Number(value || 0);
}

function Info({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId value={value} className="mt-0.5" textClassName="break-all font-mono text-xs font-semibold text-[#1F2937]" breakAll />
      ) : (
        <p className="mt-0.5 break-words text-xs font-semibold leading-snug text-[#1F2937]">{value || "—"}</p>
      )}
    </div>
  );
}

function StepPills({ step, done }) {
  const current = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="flex flex-wrap gap-1.5">
      {STEPS.map((s, i) => {
        const active = s.id === step;
        const complete = done || i < current;
        return (
          <span
            key={s.id}
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              active
                ? "bg-emerald-700 text-white"
                : complete
                  ? "bg-[#E8F5E9] text-[#217346]"
                  : "bg-slate-100 text-[#6B7280]"
            }`}
          >
            {i + 1}. {s.label}
          </span>
        );
      })}
    </div>
  );
}

function OrderDetailsGrid({ pickup }) {
  const unit = pickup.unit || "Kg";
  const grades = Array.isArray(pickup.grades) ? pickup.grades : [];
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 p-3 text-xs lg:grid-cols-3">
      <Info label="Order ID" value={pickup.orderDisplayId} className="col-span-2 lg:col-span-1" />
      <Info label="Farmer Name" value={pickup.farmerName} />
      <Info label="Farmer Mobile" value={pickup.farmerMobile} />
      <Info label="Farmer Location" value={pickup.farmerLocation} className="col-span-2 lg:col-span-1" />
      <Info label="Product" value={pickup.productName} />
      <Info label="Variety" value={pickup.variety} />
      <Info label="Grade" value={pickup.grade} />
      <Info label="Ordered Qty" value={`${pickup.orderedQuantity || "—"} ${unit}`} />
      <Info label="Packed Qty" value={`${pickup.packedQuantity || pickup.confirmedQuantity || pickup.expectedQuantity || "—"} ${unit}`} />
      <Info label="Expected Qty" value={`${pickup.confirmedQuantity || pickup.packedQuantity || pickup.expectedQuantity || "—"} ${unit}`} />
      <Info label="Packages" value={pickup.packageCount} />
      <Info label="Driver" value={pickup.driverName || "—"} />
      <Info label="Driver ID" value={pickup.driverId} />
      <Info label="Vehicle" value={pickup.vehicleNumber || "—"} />
      <Info label="Lot / Batch ID" value={pickup.collectionBatchId} className="col-span-2 lg:col-span-1" />
      <Info label="Driver status" value={pickupLiveLabel(pickup)} className="col-span-2 lg:col-span-1" />
      {grades.map((g, i) => (
        <Info
          key={`${g.label || g.name || i}`}
          label={g.label || g.name || `Grade ${i + 1}`}
          value={`${g.quantity || 0} ${g.unit || unit}`}
        />
      ))}
    </div>
  );
}

export default function ManagerReceivePage() {
  const { pickupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scannedQr = String(location.state?.qr || "").trim();
  const [pickup, setPickup] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [step, setStep] = useState(scannedQr ? "details" : "scan");
  const [form, setForm] = useState({
    receivingStatus: "ARRIVED",
    weightUnit: "Kg",
    grades: [],
    packageCount: "",
    photos: [],
    qr: scannedQr,
  });

  const applyPickup = (p) => {
    setPickup(p);
    const unit = p.receiving?.weightUnit || p.unit || "Kg";
    setForm((f) => ({
      ...f,
      receivingStatus: p.receiving?.status || "ARRIVED",
      weightUnit: unit,
      grades: f.grades?.length ? f.grades : weightGradeRows(p, f.grades),
      packageCount: f.packageCount || p.packageCount || "",
      photos: f.photos?.length ? f.photos : p.receiving?.photos || [],
    }));
  };

  usePolling(() => {
    getManagerPickup(pickupId)
      .then(applyPickup)
      .catch((err) => setError(err.message || "Pickup not found"));
  }, [pickupId], 5000);

  const qrOk = qrMatches(pickup, form.qr);
  const done = pickup?.status === "COLLECTION_CENTRE_RECEIVED" || pickup?.receiving?.status === "RECEIVED";

  useEffect(() => {
    if (!pickup || done) return;
    if (qrOk && step === "scan") setStep("details");
  }, [pickup, qrOk, done, step]);

  useEffect(() => {
    if (done) setStep("photos");
  }, [done]);

  const totals = useMemo(() => {
    const expected = (form.grades || []).reduce((s, g) => s + num(g.expectedWeight), 0);
    const accepted = (form.grades || []).reduce((s, g) => s + num(g.acceptedWeight), 0);
    return { expected, accepted, difference: accepted - expected };
  }, [form.grades]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setGrade = (label, patch) => {
    setForm((f) => ({
      ...f,
      grades: (f.grades || []).map((g) => (g.label === label ? { ...g, ...patch } : g)),
    }));
  };

  const save = async (status) => {
    setBusy(true);
    setError("");
    try {
      const data = await receiveManagerPickup(pickup.id || pickupId, {
        ...form,
        receivingStatus: status || form.receivingStatus,
        expectedWeight: totals.expected,
        actualWeight: totals.accepted,
        acceptedWeight: totals.accepted,
        difference: totals.difference,
        grades: (form.grades || []).map((g) => ({
          label: g.label,
          expectedWeight: num(g.expectedWeight),
          actualWeight: num(g.acceptedWeight),
          acceptedWeight: num(g.acceptedWeight),
          difference: num(g.acceptedWeight) - num(g.expectedWeight),
        })),
      });
      applyPickup(data);
      if ((status || form.receivingStatus) === "RECEIVED") {
        await getManagerPickupReceipt(pickup.id || pickupId).catch(() => null);
        const qualityId = data.orderId || data.orderDisplayId || pickup.orderId || pickup.orderDisplayId;
        toast.success("Received at collection centre");
        if (qualityId) {
          await startManagerQuality(qualityId).catch(() => null);
          navigate(`/farmer/manager/quality/${encodeURIComponent(qualityId)}`, { state: { autoStart: true } });
        }
      } else {
        toast.success(`Marked ${String(status || "").replace(/_/g, " ")}`);
      }
    } catch (err) {
      setError(err.message || "Failed to save receiving");
      toast.error(err.message || "Failed to save receiving");
    } finally {
      setBusy(false);
    }
  };

  if (!pickup && !error) return <p className="text-xs text-[#6B7280]">Loading incoming pickup…</p>;
  if (!pickup) return <p className="text-xs text-red-600">{error}</p>;

  const weightReady = (form.grades || []).some((g) => String(g.acceptedWeight ?? "").trim() !== "");
  const photosReady = (form.photos || []).length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <StatusBadge status={pickup.status} />
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Collection Centre Receiving</h1>
        <p className={EXCEL_PAGE_SUB}>
          Scan QR, check order details, verify weight, take live photos, then confirm received.
        </p>
      </div>
      <StepPills step={step} done={done} />
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      {step === "scan" ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>1. Scan QR & verify</h2>
          <div className="space-y-2 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className={`${EXCEL_INPUT} flex-1`}
                placeholder="Paste Farmer / order QR"
                value={form.qr}
                onChange={(e) => set("qr", e.target.value)}
              />
              <button
                type="button"
                disabled={done}
                className={`${EXCEL_BTN_PRIMARY} shrink-0 sm:min-w-[7.5rem]`}
                onClick={() => setScanOpen(true)}
              >
                Scan QR
              </button>
            </div>
            <p className={`text-[11px] ${form.qr ? (qrOk ? "text-emerald-700" : "text-red-600") : "text-[#6B7280]"}`}>
              {form.qr
                ? qrOk
                  ? "QR matches this order. Opening order details…"
                  : "QR does not match this order."
                : "Scan the order QR from the driver to continue."}
            </p>
            <Link to="/farmer/manager/pickups/incoming" className={EXCEL_BTN}>Back</Link>
          </div>
        </section>
      ) : null}

      {step === "details" ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>2. Order details</h2>
          <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-emerald-700">QR verified. Check all order details, then verify weight.</p>
          <OrderDetailsGrid pickup={pickup} />
          <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
            <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setStep("weight")}>
              Verify Weight
            </button>
            <button type="button" className={EXCEL_BTN} onClick={() => setStep("scan")}>
              Scan again
            </button>
          </div>
        </section>
      ) : null}

      {step === "weight" ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>3. Weight verification</h2>
          <div className="space-y-3 p-3">
            <div className="flex flex-wrap gap-2">
              {UNITS.map((u) => (
                <button key={u} type="button" onClick={() => set("weightUnit", u)} className={form.weightUnit === u ? EXCEL_BTN_PRIMARY : EXCEL_BTN}>
                  {u}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-[10px] md:min-w-[420px] md:table-auto md:text-xs">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[24%]" />
                  <col className="w-[28%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#F8FAF8] text-[9px] font-bold uppercase tracking-wide text-[#6B7280] md:text-[10px]">
                    <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Grade</th>
                    <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Expected</th>
                    <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Accepted</th>
                    <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.grades || []).map((g) => {
                    const diff = num(g.acceptedWeight) - num(g.expectedWeight);
                    return (
                      <tr key={g.label}>
                        <td className="border border-[#E5E7EB] px-1 py-1 font-semibold leading-tight text-[#1F2937] md:px-2 md:py-1.5">{g.label}</td>
                        <td className="border border-[#E5E7EB] px-1 py-1 tabular-nums md:px-2 md:py-1.5">
                          {num(g.expectedWeight)}
                          <span className="hidden md:inline"> {form.weightUnit}</span>
                        </td>
                        <td className="border border-[#E5E7EB] p-0.5 md:px-1 md:py-1">
                          <input
                            className={`${EXCEL_INPUT} !min-h-8 !rounded-md !px-1 !py-1 !text-[11px] md:!rounded-lg md:!px-2 md:!py-1.5 md:!text-xs`}
                            type="number"
                            min="0"
                            step="0.001"
                            inputMode="decimal"
                            value={g.acceptedWeight}
                            onChange={(e) => setGrade(g.label, { acceptedWeight: e.target.value })}
                          />
                        </td>
                        <td className={`border border-[#E5E7EB] px-1 py-1 font-semibold tabular-nums md:px-2 md:py-1.5 ${diff < 0 ? "text-red-600" : "text-[#1F2937]"}`}>
                          {diff > 0 ? "+" : ""}
                          {diff}
                          <span className="hidden md:inline"> {form.weightUnit}</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#F8FAF8] font-bold">
                    <td className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Total</td>
                    <td className="border border-[#E5E7EB] px-1 py-1.5 tabular-nums md:px-2 md:py-2">
                      {totals.expected}
                      <span className="hidden md:inline"> {form.weightUnit}</span>
                    </td>
                    <td className="border border-[#E5E7EB] px-1 py-1.5 tabular-nums md:px-2 md:py-2">
                      {totals.accepted}
                      <span className="hidden md:inline"> {form.weightUnit}</span>
                    </td>
                    <td className={`border border-[#E5E7EB] px-1 py-1.5 tabular-nums md:px-2 md:py-2 ${totals.difference < 0 ? "text-red-600" : "text-[#1F2937]"}`}>
                      {totals.difference > 0 ? "+" : ""}
                      {totals.difference}
                      <span className="hidden md:inline"> {form.weightUnit}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="max-w-xs">
              <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Package count</label>
              <input className={EXCEL_INPUT} type="number" value={form.packageCount} onChange={(e) => set("packageCount", e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!weightReady} className={EXCEL_BTN_PRIMARY} onClick={() => setStep("photos")}>
                Next: Live Photo
              </button>
              <button type="button" className={EXCEL_BTN} onClick={() => setStep("details")}>
                Back
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {step === "photos" ? (
        <>
          <section className={EXCEL_PANEL}>
            <h2 className={EXCEL_PANEL_HEAD}>4. Live photo</h2>
            <div className="p-3">
              <ReceivingPhotos photos={form.photos} onChange={(photos) => set("photos", photos)} disabled={done} />
            </div>
          </section>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || done || !qrOk || !photosReady}
              className={EXCEL_BTN_PRIMARY}
              onClick={() => save("RECEIVED")}
            >
              {busy ? "Saving…" : "Confirm Received"}
            </button>
            {done ? (
              <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => navigate(`/farmer/manager/quality/${pickup.orderId || pickup.orderDisplayId}`)}>
                Start Quality Check
              </button>
            ) : (
              <button type="button" className={EXCEL_BTN} onClick={() => setStep("weight")}>
                Back
              </button>
            )}
            <Link to="/farmer/manager/pickups/incoming" className={EXCEL_BTN}>Incoming Pickups</Link>
          </div>
        </>
      ) : null}

      <QrScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Scan order QR"
        hint="Align the order QR inside the frame"
        actionLabel="Use"
        onScan={(value) => {
          set("qr", String(value || "").trim());
          setScanOpen(false);
        }}
      />
    </div>
  );
}

