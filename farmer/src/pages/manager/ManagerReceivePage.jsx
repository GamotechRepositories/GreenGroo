import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerPickup, receiveManagerPickup, getManagerPickupReceipt } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import PickupTimeline from "../../components/pickup/PickupTimeline";
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value || "—"}</p>
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
    expectedWeight: "",
    actualWeight: "",
    acceptedWeight: "",
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
      expectedWeight: p.receiving?.expectedWeight || p.confirmedQuantity || p.packedQuantity || p.expectedQuantity || "",
      actualWeight: p.receiving?.actualWeight || "",
      acceptedWeight: p.receiving?.acceptedWeight || "",
      packageCount: p.packageCount || "",
      photos: p.receiving?.photos || [],
    }));
  };

  usePolling(() => {
    getManagerPickup(pickupId)
      .then(applyPickup)
      .catch((err) => setError(err.message || "Pickup not found"));
  }, [pickupId], 5000);

  const difference = useMemo(() => Number(form.actualWeight || 0) - Number(form.expectedWeight || 0), [form.expectedWeight, form.actualWeight]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
        difference,
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Collection Centre Receiving</h1>
          <p className={EXCEL_PAGE_SUB}>
            Next after driver on the way. Order {pickup.orderDisplayId} · {pickup.farmerName}
          </p>
        </div>
        <StatusBadge status={pickup.receiving?.status || pickup.status} />
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
          <Info label="Driver status" value={pickup.liveStatus || pickup.status} />
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Expected Weight</label>
              <input className={EXCEL_INPUT} type="number" value={form.expectedWeight} onChange={(e) => set("expectedWeight", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Actual Weight</label>
              <input className={EXCEL_INPUT} type="number" value={form.actualWeight} onChange={(e) => set("actualWeight", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Accepted Weight</label>
              <input className={EXCEL_INPUT} type="number" value={form.acceptedWeight} onChange={(e) => set("acceptedWeight", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#4B5563]">Difference</label>
              <p className={`rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold ${difference < 0 ? "text-red-600" : "text-slate-900"}`}>
                {difference > 0 ? "+" : ""}{difference} {form.weightUnit}
              </p>
            </div>
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
