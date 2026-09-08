import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerPickup, receiveManagerPickup, getManagerPickupReceipt } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";
import StatusBadge from "../../components/ui/StatusBadge";
import PickupTimeline, { pickupLiveLabel } from "../../components/pickup/PickupTimeline";
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
const STEPS = ["ARRIVED", "UNLOADING", "WEIGHT_CHECK", "RECEIVED"];
const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

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
      actualWeight: fromSave?.actualWeight ?? fromPrev?.actualWeight ?? "",
      acceptedWeight: fromSave?.acceptedWeight ?? fromPrev?.acceptedWeight ?? "",
    };
  });
}

function num(value) {
  return Number(value || 0);
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId value={value} className="mt-0.5" textClassName="break-all font-mono text-xs font-semibold text-[#1F2937]" breakAll />
      ) : (
        <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value || "—"}</p>
      )}
    </div>
  );
}

export default function ManagerReceivePage() {
  const { pickupId } = useParams();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    receivingStatus: "ARRIVED",
    weightUnit: "Kg",
    grades: [],
    packageCount: "",
    photos: [],
    qr: "",
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

  const totals = useMemo(() => {
    const expected = (form.grades || []).reduce((s, g) => s + num(g.expectedWeight), 0);
    const actual = (form.grades || []).reduce((s, g) => s + num(g.actualWeight), 0);
    const accepted = (form.grades || []).reduce((s, g) => s + num(g.acceptedWeight), 0);
    return { expected, actual, accepted, difference: actual - expected };
  }, [form.grades]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setGrade = (label, patch) => {
    setForm((f) => ({
      ...f,
      grades: (f.grades || []).map((g) => (g.label === label ? { ...g, ...patch } : g)),
    }));
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photos", [...form.photos, reader.result]);
    reader.readAsDataURL(file);
  };

  const save = async (status) => {
    setBusy(true);
    setError("");
    try {
      const data = await receiveManagerPickup(pickup.id || pickupId, {
        ...form,
        receivingStatus: status || form.receivingStatus,
        expectedWeight: totals.expected,
        actualWeight: totals.actual,
        acceptedWeight: totals.accepted,
        difference: totals.difference,
        grades: (form.grades || []).map((g) => ({
          label: g.label,
          expectedWeight: num(g.expectedWeight),
          actualWeight: num(g.actualWeight),
          acceptedWeight: num(g.acceptedWeight),
          difference: num(g.actualWeight) - num(g.expectedWeight),
        })),
      });
      applyPickup(data);
      if ((status || form.receivingStatus) === "RECEIVED") {
        await getManagerPickupReceipt(pickup.id || pickupId).catch(() => null);
        toast.success("Received at collection centre");
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

  const qrOk =
    form.qr.trim() &&
    (form.qr.trim() === pickup.qrPayload ||
      form.qr.includes(pickup.orderDisplayId || "") ||
      form.qr.includes(pickup.orderId || ""));
  const done = pickup.status === "COLLECTION_CENTRE_RECEIVED" || pickup.receiving?.status === "RECEIVED";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <StatusBadge status={pickup.status} />
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Collection Centre Receiving</h1>
        <p className={EXCEL_PAGE_SUB}>
          Next after driver on the way. Order {pickup.orderDisplayId} · {pickup.farmerName}
        </p>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Pickup Timeline</h2>
        <div className="p-3">
          <PickupTimeline status={pickup.status} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Order</h2>
        <div className="grid gap-3 p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Order ID" value={pickup.orderDisplayId} />
          <Info label="Farmer" value={pickup.farmerName} />
          <Info label="Product" value={pickup.productName} />
          <Info label="Expected Qty" value={`${pickup.confirmedQuantity || pickup.packedQuantity || pickup.expectedQuantity} ${pickup.unit}`} />
          <Info label="Packages" value={pickup.packageCount} />
          <Info label="Driver" value={`${pickup.driverName || "—"} · ${pickup.vehicleNumber || ""}`} />
          <Info label="Lot / Batch ID" value={pickup.collectionBatchId} />
          <Info label="Driver status" value={pickupLiveLabel(pickup)} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>1. Scan QR & verify</h2>
        <div className="space-y-2 p-3">
          <input className={EXCEL_INPUT} placeholder="Paste Farmer / order QR" value={form.qr} onChange={(e) => set("qr", e.target.value)} />
          <p className={`text-[11px] ${form.qr ? (qrOk ? "text-emerald-700" : "text-red-600") : "text-[#6B7280]"}`}>
            {form.qr ? (qrOk ? "QR matches this order." : "QR does not match this order.") : pickup.qrPayload ? `Expected: ${pickup.qrPayload}` : "Paste the order QR from the driver."}
          </p>
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>2. Weight verification</h2>
        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button key={u} type="button" onClick={() => set("weightUnit", u)} className={form.weightUnit === u ? EXCEL_BTN_PRIMARY : EXCEL_BTN}>
                {u}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAF8] text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                  <th className="border border-[#E5E7EB] px-2 py-2">Grade</th>
                  <th className="border border-[#E5E7EB] px-2 py-2">Expected</th>
                  <th className="border border-[#E5E7EB] px-2 py-2">Actual</th>
                  <th className="border border-[#E5E7EB] px-2 py-2">Accepted</th>
                  <th className="border border-[#E5E7EB] px-2 py-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                {(form.grades || []).map((g) => {
                  const diff = num(g.actualWeight) - num(g.expectedWeight);
                  return (
                    <tr key={g.label}>
                      <td className="border border-[#E5E7EB] px-2 py-1.5 font-semibold text-[#1F2937]">{g.label}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5 tabular-nums">{num(g.expectedWeight)} {form.weightUnit}</td>
                      <td className="border border-[#E5E7EB] px-1 py-1">
                        <input
                          className={`${EXCEL_INPUT} !min-h-8 !rounded-lg !px-2 !py-1.5 !text-xs`}
                          type="number"
                          min="0"
                          step="0.001"
                          value={g.actualWeight}
                          onChange={(e) => setGrade(g.label, { actualWeight: e.target.value })}
                        />
                      </td>
                      <td className="border border-[#E5E7EB] px-1 py-1">
                        <input
                          className={`${EXCEL_INPUT} !min-h-8 !rounded-lg !px-2 !py-1.5 !text-xs`}
                          type="number"
                          min="0"
                          step="0.001"
                          value={g.acceptedWeight}
                          onChange={(e) => setGrade(g.label, { acceptedWeight: e.target.value })}
                        />
                      </td>
                      <td className={`border border-[#E5E7EB] px-2 py-1.5 font-semibold tabular-nums ${diff < 0 ? "text-red-600" : "text-[#1F2937]"}`}>
                        {diff > 0 ? "+" : ""}{diff} {form.weightUnit}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[#F8FAF8] font-bold">
                  <td className="border border-[#E5E7EB] px-2 py-2">Total</td>
                  <td className="border border-[#E5E7EB] px-2 py-2 tabular-nums">{totals.expected} {form.weightUnit}</td>
                  <td className="border border-[#E5E7EB] px-2 py-2 tabular-nums">{totals.actual} {form.weightUnit}</td>
                  <td className="border border-[#E5E7EB] px-2 py-2 tabular-nums">{totals.accepted} {form.weightUnit}</td>
                  <td className={`border border-[#E5E7EB] px-2 py-2 tabular-nums ${totals.difference < 0 ? "text-red-600" : "text-[#1F2937]"}`}>
                    {totals.difference > 0 ? "+" : ""}{totals.difference} {form.weightUnit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="max-w-xs">
            <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Package count</label>
            <input className={EXCEL_INPUT} type="number" value={form.packageCount} onChange={(e) => set("packageCount", e.target.value)} />
          </div>
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>3. Photos</h2>
        <div className="p-3">
          <input type="file" accept="image/*" onChange={onPhoto} className="text-xs" />
          <div className="mt-3 flex flex-wrap gap-2">
            {form.photos.map((src, i) => (
              <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {STEPS.filter((s) => s !== "RECEIVED").map((s) => (
          <button key={s} type="button" disabled={busy || done} className={EXCEL_BTN} onClick={() => save(s)}>
            Mark {s.replace(/_/g, " ")}
          </button>
        ))}
        <button type="button" disabled={busy || done || !qrOk} className={EXCEL_BTN_PRIMARY} onClick={() => save("RECEIVED")}>
          {busy ? "Saving…" : "Confirm Received"}
        </button>
        {done ? (
          <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => navigate(`/farmer/manager/quality/${pickup.orderId || pickup.orderDisplayId}`)}>
            Start Quality Check
          </button>
        ) : null}
        <Link to="/farmer/manager/pickups/incoming" className={EXCEL_BTN}>Back</Link>
      </div>
    </div>
  );
}
