import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { pickupLiveLabel } from "../../components/pickup/PickupTimeline";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";

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
      {isCopyableId(label, value) ? (
        <CopyId value={value} className="mt-0.5" textClassName="break-all font-mono text-xs font-semibold text-gray-900" breakAll />
      ) : (
        <p className="mt-0.5 text-xs font-semibold text-gray-900">{value || "—"}</p>
      )}
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
    grades: [],
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
          grades: weightGradeRows(p, f.grades),
          packageCount: p.packageCount || "",
          photos: p.receiving?.photos || [],
        }));
      })
      .catch((err) => setError(err?.response?.data?.message || "Pickup not found"));
  };

  useEffect(() => {
    load();
  }, [pickupId]);

  const totals = useMemo(() => {
    const expected = (form.grades || []).reduce((s, g) => s + num(g.expectedWeight), 0);
    const actual = (form.grades || []).reduce((s, g) => s + num(g.actualWeight), 0);
    const accepted = (form.grades || []).reduce((s, g) => s + num(g.acceptedWeight), 0);
    return { expected, actual, accepted, difference: actual - expected };
  }, [form.grades]);

  const converted = useMemo(() => {
    return {
      expectedKg: toKg(totals.expected, form.weightUnit),
      actualKg: toKg(totals.actual, form.weightUnit),
      acceptedKg: toKg(totals.accepted, form.weightUnit),
    };
  }, [form.weightUnit, totals]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setGrade = (label, patch) => {
    setForm((f) => ({
      ...f,
      grades: (f.grades || []).map((g) => (g.label === label ? { ...g, ...patch } : g)),
    }));
  };

  const changeUnit = (next) => {
    setForm((f) => ({
      ...f,
      weightUnit: next,
      grades: (f.grades || []).map((g) => ({
        ...g,
        expectedWeight: fromKg(toKg(g.expectedWeight, f.weightUnit), next),
        actualWeight: g.actualWeight === "" ? "" : fromKg(toKg(g.actualWeight, f.weightUnit), next),
        acceptedWeight: g.acceptedWeight === "" ? "" : fromKg(toKg(g.acceptedWeight, f.weightUnit), next),
      })),
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
    if (totals.expected < 0 || totals.actual < 0 || totals.accepted < 0) {
      setError("Weight values cannot be negative");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await vendorApi.receivePickup(pickup.id, {
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

  const qrRaw = form.qr.trim();
  const qrOk = Boolean(
    qrRaw &&
      (qrRaw === pickup.qrPayload ||
        qrRaw.includes(pickup.orderDisplayId) ||
        qrRaw.includes(pickup.orderId) ||
        (pickup.collectionBatchId && qrRaw.includes(pickup.collectionBatchId)))
  );

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 print:hidden">
        <Link to="/vendor/collection-centre" className="hover:text-[#217346]">Collection Centre</Link>
        <span>›</span>
        <CopyId value={pickup.orderDisplayId} textClassName="font-semibold text-gray-700" />
      </div>

      <span className="inline-flex max-w-full rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#217346]">
        {pickupLiveLabel(pickup)}
      </span>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Collection Centre Receiving</h1>
        <p className="text-sm text-gray-500">Order {pickup.orderDisplayId} · {pickup.farmerName}</p>
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
              <Info
                label="Lot / Batch ID"
                value={
                  pickup.collectionBatchId ? (
                    <Link to={`/vendor/batches/${encodeURIComponent(pickup.collectionBatchId)}`} className="text-[#217346]">
                      {pickup.collectionBatchId}
                    </Link>
                  ) : "—"
                }
              />
              <Info label="Pickup ID" value={pickup.pickupId} />
              <Info label="Packages" value={pickup.packageCount} />
              <Info label="Driver" value={`${pickup.driverName || "—"} · ${pickup.vehicleNumber || ""}`} />
              <Info label="Pickup Date" value={pickup.pickupConfirmedAt ? new Date(pickup.pickupConfirmedAt).toLocaleString("en-IN") : pickup.scheduledDate} />
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-5 print:hidden">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">1. Scan QR & verify</p>
            <input
              className="w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
              placeholder="Paste greengroo:order:… or greengroo:batch:…"
              value={form.qr}
              onChange={(e) => set("qr", e.target.value)}
            />
            <p className={`mt-2 text-[11px] ${qrOk ? "text-green-700" : "text-red-600"}`}>
              {form.qr ? (qrOk ? "QR matches this order." : "QR does not match this order.") : `Expected: ${pickup.qrPayload}`}
            </p>
          </div>

          <div className="border border-gray-200 bg-white p-5 print:hidden">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">2. Weight verification</p>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    <th className="border border-gray-200 px-2 py-2">Grade</th>
                    <th className="border border-gray-200 px-2 py-2">Expected</th>
                    <th className="border border-gray-200 px-2 py-2">Actual</th>
                    <th className="border border-gray-200 px-2 py-2">Accepted</th>
                    <th className="border border-gray-200 px-2 py-2">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.grades || []).map((g) => {
                    const diff = num(g.actualWeight) - num(g.expectedWeight);
                    return (
                      <tr key={g.label}>
                        <td className="border border-gray-200 px-2 py-1.5 font-semibold text-gray-900">{g.label}</td>
                        <td className="border border-gray-200 px-2 py-1.5 tabular-nums">{num(g.expectedWeight)} {form.weightUnit}</td>
                        <td className="border border-gray-200 px-1 py-1">
                          <input
                            className="w-full border border-gray-200 px-2 py-1.5 text-xs"
                            type="number"
                            min="0"
                            step="0.001"
                            value={g.actualWeight}
                            onChange={(e) => setGrade(g.label, { actualWeight: e.target.value })}
                          />
                        </td>
                        <td className="border border-gray-200 px-1 py-1">
                          <input
                            className="w-full border border-gray-200 px-2 py-1.5 text-xs"
                            type="number"
                            min="0"
                            step="0.001"
                            value={g.acceptedWeight}
                            onChange={(e) => setGrade(g.label, { acceptedWeight: e.target.value })}
                          />
                        </td>
                        <td className={`border border-gray-200 px-2 py-1.5 font-semibold tabular-nums ${diff < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {diff > 0 ? "+" : ""}{diff} {form.weightUnit}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td className="border border-gray-200 px-2 py-2">Total</td>
                    <td className="border border-gray-200 px-2 py-2 tabular-nums">{totals.expected} {form.weightUnit}</td>
                    <td className="border border-gray-200 px-2 py-2 tabular-nums">{totals.actual} {form.weightUnit}</td>
                    <td className="border border-gray-200 px-2 py-2 tabular-nums">{totals.accepted} {form.weightUnit}</td>
                    <td className={`border border-gray-200 px-2 py-2 tabular-nums ${totals.difference < 0 ? "text-red-600" : "text-gray-900"}`}>
                      {totals.difference > 0 ? "+" : ""}{totals.difference} {form.weightUnit}
                    </td>
                  </tr>
                </tbody>
              </table>
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
          <div className="mt-2"><Info label="Expected" value={`${totals.expected || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Actual" value={`${totals.actual || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Accepted" value={`${totals.accepted || "—"} ${form.weightUnit}`} /></div>
          <div className="mt-2"><Info label="Difference" value={`${totals.difference} ${form.weightUnit}`} /></div>
          {(form.grades || []).map((g) => (
            <div key={g.label} className="mt-2">
              <Info
                label={g.label}
                value={`Exp ${num(g.expectedWeight)} · Act ${num(g.actualWeight)} · Acc ${num(g.acceptedWeight)} ${form.weightUnit}`}
              />
            </div>
          ))}
          <div className="mt-2"><Info label="Packages" value={form.packageCount} /></div>
          <div className="mt-2"><Info label="Driver" value={`${pickup.driverName} · ${pickup.vehicleNumber}`} /></div>
          <p className="mt-4 text-[10px] text-gray-400">Next: Quality Check & Grading.</p>
          {pickup.receiving?.status === "RECEIVED" ? (
            <Link
              to={`/vendor/quality/${pickup.orderId || pickup.orderDisplayId}`}
              className="mt-3 inline-block bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Start Quality Check
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
