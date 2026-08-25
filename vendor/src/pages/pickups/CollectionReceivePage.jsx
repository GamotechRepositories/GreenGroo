import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const UNITS = ["Kg", "Quintal", "Ton"];
const STEPS = ["ARRIVED", "UNLOADING", "WEIGHT_CHECK", "RECEIVED"];

function toKg(value, unit) {
  const n = Number(value || 0);
  if (unit === "Quintal") return n * 100;
  if (unit === "Ton") return n * 1000;
  return n;
}

function fromKg(kg, unit) {
  if (unit === "Quintal") return kg / 100;
  if (unit === "Ton") return kg / 1000;
  return kg;
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function CollectionReceivePage() {
  const { pickupId } = useParams();
  const [pickup, setPickup] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
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

  const load = () => {
    vendorApi
      .getPickup(pickupId)
      .then((r) => {
        const p = r.data?.pickup || r.data;
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
      })
      .catch((err) => setError(err?.response?.data?.message || "Pickup not found"));
  };

  useEffect(() => {
    load();
  }, [pickupId]);

  const difference = useMemo(() => {
    const expected = Number(form.expectedWeight || 0);
    const actual = Number(form.actualWeight || 0);
    return actual - expected;
  }, [form.expectedWeight, form.actualWeight]);

  const converted = useMemo(() => {
    const kgExpected = toKg(form.expectedWeight, form.weightUnit);
    return {
      expectedKg: kgExpected,
      actualKg: toKg(form.actualWeight, form.weightUnit),
      acceptedKg: toKg(form.acceptedWeight, form.weightUnit),
    };
  }, [form]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const changeUnit = (next) => {
    const kgE = toKg(form.expectedWeight, form.weightUnit);
    const kgA = toKg(form.actualWeight, form.weightUnit);
    const kgC = toKg(form.acceptedWeight, form.weightUnit);
    setForm((f) => ({
      ...f,
      weightUnit: next,
      expectedWeight: fromKg(kgE, next),
      actualWeight: fromKg(kgA, next),
      acceptedWeight: fromKg(kgC, next),
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
    const expected = Number(form.expectedWeight || 0);
    const actual = Number(form.actualWeight || 0);
    const accepted = Number(form.acceptedWeight || 0);
    if (expected < 0 || actual < 0 || accepted < 0) {
      setError("Weight values cannot be negative");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await vendorApi.receivePickup(pickup.id, {
        ...form,
        receivingStatus: status || form.receivingStatus,
        difference,
      });
      setPickup(res.data);
      if ((status || form.receivingStatus) === "RECEIVED") {
        const rec = await vendorApi.getPickupReceipt(pickup.id);
        setReceipt(rec.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save receiving");
    } finally {
      setBusy(false);
    }
  };

  const printReceipt = () => window.print();

  if (!pickup && !error) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!pickup) return <p className="p-6 text-xs text-red-500">{error}</p>;

  const qrOk = form.qr.trim() && (form.qr.trim() === pickup.qrPayload || form.qr.includes(pickup.orderDisplayId) || form.qr.includes(pickup.orderId));

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 print:hidden">
        <Link to="/vendor/collection-centre" className="hover:text-[#217346]">Collection Centre</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{pickup.orderDisplayId}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Collection Centre Receiving</h1>
          <p className="text-sm text-gray-500">Order {pickup.orderDisplayId} · {pickup.farmerName}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase">{String(pickup.receiving?.status || pickup.status || "").replace(/_/g, " ")}</span>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 print:hidden">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2 print:col-span-3">
          <div className="border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Order</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Info label="Order ID" value={pickup.orderDisplayId} />
              <Info label="Farmer" value={pickup.farmerName} />
              <Info label="Product" value={pickup.productName} />
              <Info label="Expected Quantity" value={`${pickup.confirmedQuantity || pickup.packedQuantity || pickup.expectedQuantity} ${pickup.unit}`} />
              <Info label="Batch / Pickup ID" value={pickup.pickupId} />
              <Info label="Packages" value={pickup.packageCount} />
              <Info label="Driver" value={`${pickup.driverName || "—"} · ${pickup.vehicleNumber || ""}`} />
              <Info label="Pickup Date" value={pickup.pickupConfirmedAt ? new Date(pickup.pickupConfirmedAt).toLocaleString("en-IN") : pickup.scheduledDate} />
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-5 print:hidden">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">1. Scan QR & verify</p>
            <input
              className="w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
              placeholder="Paste or type greengroo:order:…"
              value={form.qr}
              onChange={(e) => set("qr", e.target.value)}
            />
            <p className={`mt-2 text-[11px] ${qrOk ? "text-green-700" : "text-red-600"}`}>
              {form.qr ? (qrOk ? "QR matches this order." : "QR does not match this order.") : `Expected: ${pickup.qrPayload}`}
            </p>
          </div>

          <div className="border border-gray-200 bg-white p-5 print:hidden">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Weight verification</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => changeUnit(u)}
                  className={`px-3 py-1 text-xs ${form.weightUnit === u ? "bg-[#217346] text-white" : "border border-gray-200"}`}
                >
                  {u}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Expected Weight</label>
                <input className="w-full border border-gray-200 px-3 py-1.5 text-xs" type="number" value={form.expectedWeight} onChange={(e) => set("expectedWeight", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Actual Weight</label>
                <input className="w-full border border-gray-200 px-3 py-1.5 text-xs" type="number" value={form.actualWeight} onChange={(e) => set("actualWeight", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Accepted Weight</label>
                <input className="w-full border border-gray-200 px-3 py-1.5 text-xs" type="number" value={form.acceptedWeight} onChange={(e) => set("acceptedWeight", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Difference</label>
                <p className={`border border-gray-200 px-3 py-1.5 text-xs font-bold ${difference < 0 ? "text-red-600" : "text-gray-900"}`}>
                  {difference > 0 ? "+" : ""}{difference} {form.weightUnit}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-gray-400">
              Difference = Actual − Expected. Base: {converted.expectedKg} Kg expected / {converted.actualKg} Kg actual.
            </p>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold">Package count</label>
              <input className="w-40 border border-gray-200 px-3 py-1.5 text-xs" type="number" value={form.packageCount} onChange={(e) => set("packageCount", e.target.value)} />
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-5 print:hidden">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Product photos</p>
            <input type="file" accept="image/*" onChange={onPhoto} className="text-xs" />
            <div className="mt-3 flex flex-wrap gap-2">
              {form.photos.map((src, i) => (
                <img key={i} src={src} alt="" className="h-16 w-16 object-cover border border-gray-200" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            {STEPS.filter((s) => s !== "RECEIVED").map((s) => (
              <button key={s} type="button" disabled={busy} className="border border-gray-200 px-3 py-1.5 text-xs" onClick={() => save(s)}>
                Mark {s.replace(/_/g, " ")}
              </button>
            ))}
            <button type="button" disabled={busy || !qrOk} className="bg-[#217346] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60" onClick={() => save("RECEIVED")}>
              Confirm Received
            </button>
            {pickup.receiving?.receiptId ? (
              <button type="button" className="border border-gray-200 px-3 py-1.5 text-xs" onClick={printReceipt}>
                Print Receipt
              </button>
            ) : null}
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-5" id="receipt">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Receiving Receipt</p>
          <Info label="Receipt ID" value={pickup.receiving?.receiptId || receipt?.receiptId || "Generated on confirm"} />
          <div className="mt-2"><Info label="Order" value={pickup.orderDisplayId} /></div>
          <div className="mt-2"><Info label="Farmer" value={pickup.farmerName} /></div>
          <div className="mt-2"><Info label="Product" value={pickup.productName} /></div>
          <div className="mt-2"><Info label="Expected" value={`${form.expectedWeight || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Actual" value={`${form.actualWeight || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Accepted" value={`${form.acceptedWeight || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Difference" value={`${difference} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Packages" value={form.packageCount} /></div>
          <div className="mt-2"><Info label="Driver" value={`${pickup.driverName} · ${pickup.vehicleNumber}`} /></div>
          <p className="mt-4 text-[10px] text-gray-400">Next: Quality Check & Grading (separate module).</p>
        </div>
      </div>
    </div>
  );
}
