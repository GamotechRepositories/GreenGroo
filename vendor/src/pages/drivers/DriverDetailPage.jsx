import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { useLive } from "../../realtime/useLive";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import { pickupStatusLabel } from "../../components/pickup/PickupTimeline";

const FINISHED = new Set(["COMPLETED", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"]);
const CANCELLED = new Set(["CANCELLED", "REJECTED"]);
const AT_FARM = new Set(["DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"]);
const PICKED = new Set(["PICKED_UP", "PICKUP_CONFIRMED", "IN_TRANSIT", "ARRIVED_AT_CENTRE", ...FINISHED]);
const ORDER_STEPS = ["DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED", "PICKED_UP"];
const CENTRE_STEPS = ["IN_TRANSIT", "ARRIVED_AT_CENTRE", "COLLECTION_CENTRE_RECEIVED"];
const STEP_ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  PICKUP_CONFIRMED: "PICKED_UP",
  COMPLETED: "COLLECTION_CENTRE_RECEIVED",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
};
const NO_BATCH = "__no_batch__";

const DRIVER_STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Available: "bg-green-100 text-green-700",
  "On Duty": "bg-blue-100 text-blue-700",
  "On Pickup": "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-600",
  "Off Duty": "bg-amber-100 text-amber-700",
  Offline: "bg-amber-100 text-amber-700",
};

const BATCH_STATE = {
  progress: { label: "In progress", chip: "bg-blue-100 text-blue-700", strip: "bg-blue-50 text-blue-800" },
  centre: { label: "Going to centre", chip: "bg-indigo-100 text-indigo-700", strip: "bg-indigo-50 text-indigo-800" },
  waiting: { label: "Not started", chip: "bg-amber-100 text-amber-700", strip: "bg-amber-50 text-amber-800" },
  done: { label: "Completed", chip: "bg-emerald-100 text-emerald-700", strip: "bg-emerald-50 text-emerald-800" },
};

const stepKey = (status) => STEP_ALIAS[status] || status;

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
}

function qtyOf(p) {
  return Number(p.packedQuantity || p.expectedQuantity || p.orderedQuantity || 0);
}

function formatQty(p) {
  const n = qtyOf(p);
  return n ? `${n.toLocaleString("en-IN")} ${p.unit || "Kg"}` : "—";
}

function formatTotals(list) {
  const byUnit = {};
  list.forEach((p) => {
    const unit = p.unit || "Kg";
    byUnit[unit] = (byUnit[unit] || 0) + qtyOf(p);
  });
  return (
    Object.entries(byUnit)
      .filter(([, n]) => n > 0)
      .map(([unit, n]) => `${n.toLocaleString("en-IN")} ${unit}`)
      .join(" + ") || "—"
  );
}

function toTime(value) {
  const t = new Date(value || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function shortTime(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function shortDate(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function historyOf(p) {
  const raw = (p.pickupTimeline?.length ? p.pickupTimeline : p.timeline) || [];
  let list = raw.filter((e) => e?.status).map((e) => ({ status: e.status, at: e.at }));
  if (!list.length) {
    list = [
      ["DRIVER_ASSIGNED", p.assignedAt],
      ["DISPATCHED", p.dispatchStartedAt || p.startedAt],
      ["DRIVER_ARRIVED", p.arrivedAt],
      ["ORDER_VERIFIED", p.orderVerifiedAt],
      ["QR_VERIFIED", p.qrVerifiedAt],
      ["PICKED_UP", p.pickupConfirmedAt],
      ["IN_TRANSIT", p.inTransitAt],
    ]
      .filter(([, at]) => at)
      .map(([status, at]) => ({ status, at }));
  }
  return list.sort((a, b) => toTime(a.at) - toTime(b.at));
}

function stepTimes(list) {
  const times = {};
  list.forEach((p) =>
    historyOf(p).forEach((e) => {
      const key = stepKey(e.status);
      if (!times[key] || toTime(e.at) < toTime(times[key])) times[key] = e.at;
    })
  );
  return times;
}

function orderState(p) {
  if (FINISHED.has(p.status)) return { tone: "done", label: "Received at centre" };
  if (PICKED.has(p.status)) return { tone: "done", label: "Picked up" };
  if (AT_FARM.has(p.status)) return { tone: "current", label: `At farm · ${pickupStatusLabel(p.status)}` };
  if (p.status === "DISPATCHED") return { tone: "current", label: "On the way to farm" };
  if (CANCELLED.has(p.status)) return { tone: "muted", label: "Cancelled" };
  return { tone: "pending", label: "Waiting" };
}

const TONE_CHIP = {
  done: "bg-emerald-50 text-emerald-700",
  current: "bg-blue-50 text-blue-700",
  pending: "bg-gray-100 text-gray-500",
  muted: "bg-rose-50 text-rose-600",
};

function buildBatch(batchId, list) {
  const orders = [...list].sort((a, b) => toTime(a.assignedAt || a.createdAt) - toTime(b.assignedAt || b.createdAt));
  const live = orders.filter((p) => !CANCELLED.has(p.status));
  const total = live.length;
  const picked = live.filter((p) => PICKED.has(p.status)).length;
  const allReceived = total > 0 && live.every((p) => FINISHED.has(p.status));
  const atCentre = live.some((p) => p.status === "ARRIVED_AT_CENTRE");
  const toCentre = live.some((p) => p.status === "IN_TRANSIT");
  const started = live.some((p) => p.status !== "DRIVER_ASSIGNED" && p.status !== "PICKUP_SCHEDULED");
  const plural = (n) => `${n} order${n === 1 ? "" : "s"}`;

  let state = "waiting";
  let now;
  if (allReceived) {
    state = "done";
    now = `All ${plural(total)} received at collection centre`;
  } else if (picked === total && total > 0) {
    state = "centre";
    now = atCentre ? `All ${plural(total)} picked up → Reached collection centre` : toCentre ? `All ${plural(total)} picked up → On the way to collection centre` : `All ${plural(total)} picked up`;
  } else {
    const nextIdx = orders.findIndex((p) => !CANCELLED.has(p.status) && !PICKED.has(p.status));
    const next = orders[nextIdx];
    const pos = live.indexOf(next) + 1;
    const who = next?.farmerName ? ` (${next.farmerName})` : "";
    const before = picked ? `${picked === 1 ? "1st order" : plural(picked)} picked up → ` : "";
    if (next?.status === "DISPATCHED") {
      state = "progress";
      now = `${before}On the way to ${ordinal(pos)} order${who}`;
    } else if (next && AT_FARM.has(next.status)) {
      state = "progress";
      now = `${before}At ${ordinal(pos)} order farm${who} · ${pickupStatusLabel(next.status)}`;
    } else if (picked || started) {
      state = "progress";
      now = `${before}Next: ${ordinal(pos)} order${who}`;
    } else {
      now = `${plural(total)} assigned · driver has not started yet`;
    }
  }

  const dates = orders.map((p) => toTime(p.assignedAt || p.createdAt)).filter(Boolean);
  return {
    batchId,
    orders,
    live,
    total,
    picked,
    state,
    now,
    date: dates.length ? new Date(Math.min(...dates)) : null,
    updated: Math.max(0, ...orders.map((p) => toTime(p.updatedAt))),
    farmers: [...new Set(orders.map((p) => p.farmerName).filter(Boolean))],
  };
}

function groupByBatch(pickups) {
  const map = new Map();
  pickups.forEach((p) => {
    const key = String(p.collectionBatchId || "").trim() || NO_BATCH;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  });
  const order = { progress: 0, centre: 1, waiting: 2, done: 3 };
  return Array.from(map, ([id, list]) => buildBatch(id, list)).sort(
    (a, b) => order[a.state] - order[b.state] || b.updated - a.updated
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StepRow({ label, state, at, last }) {
  const dot =
    state === "done"
      ? "border-[#217346] bg-[#217346] text-white"
      : state === "current"
        ? "border-blue-600 bg-white ring-4 ring-blue-600/15"
        : "border-[#C7E3CF] bg-white";
  const text = state === "done" ? "text-[#217346]" : state === "current" ? "text-blue-700" : "text-gray-400";
  return (
    <li className={`relative flex gap-3 ${last ? "" : "pb-2.5"}`}>
      {!last ? <span className={`absolute left-[9px] top-[20px] h-[calc(100%-8px)] w-[2px] ${state === "done" ? "bg-[#217346]" : "bg-[#D7EBDD]"}`} /> : null}
      <span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[3px] text-[9px] font-bold ${dot}`}>
        {state === "done" ? "✓" : state === "current" ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
        <p className={`text-xs font-semibold ${text}`}>{label}</p>
        <p className="text-[10px] text-gray-400">{state === "pending" ? "Pending" : shortTime(at) || "—"}</p>
      </div>
    </li>
  );
}

function stepsFor(list, steps) {
  const times = stepTimes(list);
  const reached = list.map((p) => (PICKED.has(p.status) && steps === ORDER_STEPS ? steps.length : steps.indexOf(stepKey(p.status))));
  const allDone = steps === CENTRE_STEPS ? list.length > 0 && list.every((p) => FINISHED.has(p.status)) : false;
  const idx = allDone ? steps.length : Math.max(-1, ...reached);
  return steps.map((step, i) => ({ step, state: i < idx ? "done" : i === idx ? "current" : "pending", at: times[step] }));
}

function BatchHistory({ batch }) {
  return (
    <div className="grid gap-4 border-t border-gray-100 bg-[#FAFCFA] px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
      {batch.live.map((p, i) => {
        const rows = stepsFor([p], ORDER_STEPS);
        return (
          <div key={p.id}>
            <p className="mb-2 text-[11px] font-bold text-gray-800">
              {ordinal(i + 1)} order <span className="font-normal text-gray-500">· {p.farmerName || "Farmer"}</span>
            </p>
            <ol>
              {rows.map((r, ri) => (
                <StepRow key={r.step} label={pickupStatusLabel(r.step)} state={r.state} at={r.at} last={ri === rows.length - 1} />
              ))}
            </ol>
          </div>
        );
      })}
      {batch.live.length ? (
        <div>
          <p className="mb-2 text-[11px] font-bold text-gray-800">
            Collection centre <span className="font-normal text-gray-500">· after all orders</span>
          </p>
          <ol>
            {stepsFor(batch.live, CENTRE_STEPS).map((r, ri, arr) => (
              <StepRow key={r.step} label={pickupStatusLabel(r.step)} state={r.state} at={r.at} last={ri === arr.length - 1} />
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ batch }) {
  const pct = batch.total ? Math.round((batch.picked / batch.total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#217346]" style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-[10px] font-semibold text-gray-500">
        Picked up {batch.picked}/{batch.total}
      </span>
    </div>
  );
}

function BatchTitle({ batch, size = "text-sm" }) {
  if (batch.batchId === NO_BATCH) return <p className={`${size} font-bold text-gray-700`}>Not in a batch yet</p>;
  return <CopyId value={batch.batchId} textClassName={`font-mono ${size} font-bold text-[#217346]`} />;
}

function BatchSummaryCard({ batch, onOpen }) {
  const look = BATCH_STATE[batch.state];
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex cursor-pointer flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#217346] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Batch</p>
          <BatchTitle batch={batch} />
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${look.chip}`}>{look.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#F8FAF8] px-2 py-1.5">
          <p className="text-[10px] text-gray-500">Orders</p>
          <p className="text-sm font-bold text-gray-900">{batch.total}</p>
        </div>
        <div className="rounded-lg bg-[#F8FAF8] px-2 py-1.5">
          <p className="text-[10px] text-gray-500">Farmers</p>
          <p className="text-sm font-bold text-gray-900">{batch.farmers.length}</p>
        </div>
        <div className="rounded-lg bg-[#F8FAF8] px-2 py-1.5">
          <p className="text-[10px] text-gray-500">Quantity</p>
          <p className="truncate text-xs font-bold text-gray-900" title={formatTotals(batch.live)}>
            {formatTotals(batch.live)}
          </p>
        </div>
      </div>

      <div className={`rounded-lg px-3 py-2 text-[11px] font-semibold leading-snug ${look.strip}`}>{batch.now}</div>
      <ProgressBar batch={batch} />

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-400">{batch.date ? shortDate(batch.date) : ""}</span>
        <span className="font-semibold text-[#217346]">View details ›</span>
      </div>
    </article>
  );
}

function Fact({ label, children }) {
  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAF8] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5 break-words text-xs font-semibold text-gray-900">{children || "—"}</div>
    </div>
  );
}

function BatchDetailModal({ batch, driver, onClose, onOpenPickup, onOpenBatch }) {
  const look = BATCH_STATE[batch.state];
  const noBatch = batch.batchId === NO_BATCH;
  const times = stepTimes(batch.live);
  const pickedTimes = batch.live.map((p) => stepTimes([p]).PICKED_UP).filter(Boolean);
  const lastPicked = pickedTimes.length ? pickedTimes.sort((a, b) => toTime(b) - toTime(a))[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6" onClick={onClose}>
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Batch details</p>
            <BatchTitle batch={batch} size="text-base" />
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${look.chip}`}>{look.label}</span>
          <div className="ml-auto flex items-center gap-2">
            {!noBatch ? (
              <button type="button" onClick={onOpenBatch} className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#217346]">
                Open batch page
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded px-2 py-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${look.strip}`}>{batch.now}</div>
          <ProgressBar batch={batch} />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Driver">
              {driver.name}
              <span className="block text-[11px] font-normal text-gray-500">
                {driver.mobile} · {driver.vehicleNumber || "No vehicle"}
              </span>
            </Fact>
            <Fact label="Orders / Farmers">
              {batch.total} order{batch.total === 1 ? "" : "s"} · {batch.farmers.length} farmer{batch.farmers.length === 1 ? "" : "s"}
            </Fact>
            <Fact label="Total quantity">{formatTotals(batch.live)}</Fact>
            <Fact label="Assigned on">{batch.date ? shortTime(batch.date) : "—"}</Fact>
            <Fact label="Last pickup">{lastPicked ? shortTime(lastPicked) : "Not picked yet"}</Fact>
            <Fact label="Left for centre">{times.IN_TRANSIT ? shortTime(times.IN_TRANSIT) : "—"}</Fact>
            <Fact label="Reached centre">{times.ARRIVED_AT_CENTRE ? shortTime(times.ARRIVED_AT_CENTRE) : "—"}</Fact>
            <Fact label="Received at centre">{times.COLLECTION_CENTRE_RECEIVED ? shortTime(times.COLLECTION_CENTRE_RECEIVED) : "—"}</Fact>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["#", "Order", "Farmer", "Location", "Product", "Qty", "Status", ""].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batch.orders.map((p) => {
                  const s = orderState(p);
                  const pos = batch.live.indexOf(p) + 1;
                  return (
                    <tr key={p.id} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 font-bold text-gray-400">{pos ? ordinal(pos) : "—"}</td>
                      <td className="px-3 py-2">
                        <CopyId value={p.orderDisplayId || p.orderId} textClassName="font-mono text-[11px] font-semibold text-gray-900" />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-gray-900">{p.farmerName || "—"}</p>
                        {p.farmerMobile ? (
                          <a href={`tel:${p.farmerMobile}`} className="text-[11px] text-[#217346]">
                            {p.farmerMobile}
                          </a>
                        ) : null}
                      </td>
                      <td className="max-w-[14rem] px-3 py-2 text-gray-600">{p.farmerLocation || p.pickupLocation || "—"}</td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-gray-900">{p.productName || "—"}</p>
                        <p className="text-[11px] text-gray-500">{[p.variety, p.grade].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{formatQty(p)}</td>
                      <td className="px-3 py-2">
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE_CHIP[s.tone]}`}>{s.label}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => onOpenPickup(p.id)} className="text-[11px] font-semibold text-[#217346]">
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <p className="border-b border-gray-100 px-4 py-2 text-xs font-bold text-gray-800">Step-by-step status</p>
            <BatchHistory batch={batch} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    vendorApi
      .getDriverById(driverId)
      .then((r) => setDriver(r.data))
      .catch((err) => {
        if (!silent) setError(err?.response?.data?.message || "Driver not found");
      })
      .finally(() => setLoading(false));
  };

  useLive(({ silent } = {}) => load(silent), [driverId]);

  const batches = useMemo(() => groupByBatch(Array.isArray(driver?.pickups) ? driver.pickups : []), [driver]);
  const activeBatches = batches.filter((b) => b.state !== "done");
  const doneBatches = batches.filter((b) => b.state === "done");
  const activeOrders = activeBatches.reduce((n, b) => n + b.live.filter((p) => !FINISHED.has(p.status)).length, 0);
  const doneOrders = batches.reduce((n, b) => n + b.live.filter((p) => FINISHED.has(p.status)).length, 0);
  const currentTab = tab || (activeBatches.length ? "active" : "done");
  const shown = currentTab === "active" ? activeBatches : currentTab === "done" ? doneBatches : batches;
  const selectedBatch = batches.find((b) => b.batchId === selectedBatchId) || null;

  useEffect(() => {
    if (!selectedBatchId) return undefined;
    const onKey = (e) => e.key === "Escape" && setSelectedBatchId("");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBatchId]);

  const openBatchPage = (b) =>
    navigate(`/vendor/pickups/batches/${encodeURIComponent(b.batchId)}`, { state: { batchId: b.batchId, pickups: b.orders, from: "all" } });

  const toggle = async () => {
    const next = driver.status === "Inactive" ? "Active" : "Inactive";
    await vendorApi.setDriverStatus(driver.id, next).catch(() => {});
    load();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      await vendorApi.deleteDriver(driver.id);
      navigate("/vendor/drivers");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete driver");
    }
  };

  if (loading) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!driver) return <p className="p-6 text-xs text-red-500">{error || "Driver not found"}</p>;

  const vehicleId = formatVehicleId(driver.vehicleId, driver.vehicleNumber);
  const initials = String(driver.name || "D")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const tabs = [
    { id: "active", label: "Active", count: activeBatches.length },
    { id: "done", label: "Completed", count: doneBatches.length },
    { id: "all", label: "All", count: batches.length },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/drivers" className="hover:text-[#217346]">All Drivers</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{driver.name}</span>
      </div>

      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-sm font-bold text-[#217346]">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{driver.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DRIVER_STATUS_COLORS[driver.status] || "bg-gray-100 text-gray-600"}`}>
              {driver.status}
            </span>
          </div>
          <div className="mt-1 grid gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              Mobile{" "}
              {driver.mobile ? (
                <a href={`tel:${driver.mobile}`} className="font-semibold text-[#217346]">{driver.mobile}</a>
              ) : (
                "—"
              )}
            </p>
            <p>
              Vehicle <span className="font-semibold text-gray-900">{[driver.vehicleNumber, driver.vehicleType].filter(Boolean).join(" · ") || "—"}</span>
            </p>
            <p>
              License <span className="font-semibold text-gray-900">{driver.licenseNumber || "—"}</span>
            </p>
            <p className="flex items-center gap-1">
              Driver ID <CopyId value={driver.id} textClassName="font-mono text-[11px] font-semibold text-gray-800" />
            </p>
            <p className="flex items-center gap-1">
              Vehicle ID {vehicleId ? <CopyId value={vehicleId} textClassName="font-mono text-[11px] font-semibold text-gray-800" /> : "—"}
            </p>
            {driver.assignedArea ? (
              <p>
                Area <span className="font-semibold text-gray-900">{driver.assignedArea}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/vendor/drivers/${driver.id}/edit`} className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold">
            Edit
          </Link>
          <button type="button" onClick={toggle} className="rounded bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white">
            {driver.status === "Inactive" ? "Activate" : "Deactivate"}
          </button>
          <button type="button" onClick={handleDelete} className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat label="Active batches" value={activeBatches.filter((b) => b.batchId !== NO_BATCH).length} color="text-blue-700" />
        <Stat label="Active orders" value={activeOrders} color="text-blue-700" />
        <Stat label="Completed batches" value={doneBatches.filter((b) => b.batchId !== NO_BATCH).length} color="text-emerald-700" />
        <Stat label="Completed orders" value={doneOrders} color="text-emerald-700" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm font-bold text-gray-900">Batches</p>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${currentTab === t.id ? "bg-[#217346] text-white" : "border border-gray-200 bg-white text-gray-600"}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => (
            <BatchSummaryCard key={b.batchId} batch={b} onOpen={() => setSelectedBatchId(b.batchId)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-xs text-gray-500">
          {currentTab === "active"
            ? ["Inactive", "Off Duty", "Offline"].includes(driver.status)
              ? "Driver is not working right now."
              : "No active batches. Assign a batch from Ready for Pickup."
            : "No batches yet."}
        </div>
      )}

      {selectedBatch ? (
        <BatchDetailModal
          batch={selectedBatch}
          driver={driver}
          onClose={() => setSelectedBatchId("")}
          onOpenPickup={(id) => navigate(`/vendor/pickups/${id}`)}
          onOpenBatch={() => openBatchPage(selectedBatch)}
        />
      ) : null}
    </div>
  );
}
