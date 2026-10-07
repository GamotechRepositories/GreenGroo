import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { useLive } from "../../realtime/useLive";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import { pickupLiveLabel, pickupStatusLabel } from "../../components/pickup/PickupTimeline";

const FINISHED = ["COMPLETED", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"];

function qtyOf(p) {
  return Number(p.packedQuantity || p.expectedQuantity || p.orderedQuantity || 0);
}

function formatTotals(list) {
  const byUnit = {};
  list.forEach((p) => {
    const unit = p.unit || "Kg";
    byUnit[unit] = (byUnit[unit] || 0) + qtyOf(p);
  });
  const parts = Object.entries(byUnit)
    .filter(([, n]) => n > 0)
    .map(([unit, n]) => `${n.toLocaleString("en-IN")} ${unit}`);
  return parts.join(" + ") || "—";
}

function groupBatches(pickups) {
  const map = new Map();
  pickups.forEach((p) => {
    const bid = String(p.collectionBatchId || "").trim();
    if (!bid) return;
    if (!map.has(bid)) map.set(bid, []);
    map.get(bid).push(p);
  });
  return Array.from(map, ([batchId, list]) => ({
    batchId,
    pickups: list,
    farmers: [...new Set(list.map((p) => p.farmerName).filter(Boolean))],
    products: [...new Set(list.map((p) => p.productName).filter(Boolean))],
    finished: list.every((p) => FINISHED.includes(p.status)),
    status: pickupLiveLabel(list[0]),
  }));
}

const AT_FARM = new Set(["DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"]);
const PICKED = new Set([
  "PICKED_UP",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "ARRIVED_AT_CENTRE",
  "COLLECTION_CENTRE_RECEIVED",
  "RECEIVED_AT_COLLECTION_CENTRE",
  "COMPLETED",
]);

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
}

function timeOf(p) {
  const t = new Date(p.assignedAt || p.createdAt || p.updatedAt || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function stopState(p) {
  if (PICKED.has(p.status)) return { state: "done", label: "Picked up" };
  if (AT_FARM.has(p.status)) return { state: "current", label: pickupLiveLabel(p) || "Reached the farm" };
  if (p.status === "DISPATCHED") return { state: "current", label: "On the way" };
  return { state: "pending", label: "Waiting" };
}

function centreState(trip) {
  if (trip.every((p) => FINISHED.includes(p.status))) return { state: "done", label: "Received" };
  if (trip.some((p) => p.status === "ARRIVED_AT_CENTRE")) return { state: "current", label: "At collection centre" };
  if (trip.some((p) => p.status === "IN_TRANSIT")) return { state: "current", label: "On the way" };
  return { state: "pending", label: "Waiting" };
}

const CENTRE_STEPS = new Set(["IN_TRANSIT", "ARRIVED_AT_CENTRE", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE", "COMPLETED"]);

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
  list.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  return list.filter((e, i) => i === 0 || e.status !== list[i - 1].status);
}

function centreHistory(trip) {
  const first = {};
  trip.forEach((p) =>
    historyOf(p).forEach((e) => {
      if (!CENTRE_STEPS.has(e.status)) return;
      const key = e.status === "RECEIVED_AT_COLLECTION_CENTRE" ? "COLLECTION_CENTRE_RECEIVED" : e.status;
      if (!first[key] || new Date(e.at) < new Date(first[key])) first[key] = e.at;
    })
  );
  return Object.entries(first)
    .map(([status, at]) => ({ status, at }))
    .sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
}

function shortTime(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function lastTripPickups(all) {
  const done = all
    .filter((p) => p.collectionBatchId && FINISHED.includes(p.status))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const batchId = done[0]?.collectionBatchId;
  return batchId ? all.filter((p) => p.collectionBatchId === batchId) : [];
}

function buildTrip(all, active) {
  const batchIds = new Set(active.map((p) => p.collectionBatchId).filter(Boolean));
  const activeIds = new Set(active.map((p) => p.id));
  let trip = all.filter((p) => activeIds.has(p.id) || (p.collectionBatchId && batchIds.has(p.collectionBatchId)));
  const isPrevious = !trip.length;
  if (isPrevious) trip = lastTripPickups(all);
  trip = trip.sort((a, b) => timeOf(a) - timeOf(b));
  if (!trip.length) return null;

  const stops = trip.map((p, i) => ({
    ...stopState(p),
    pickup: p,
    title: `${ordinal(i + 1)} order`,
    history: historyOf(p).filter((e) => !CENTRE_STEPS.has(e.status)),
  }));
  const centre = { ...centreState(trip), history: centreHistory(trip) };
  const nextIdx = stops.findIndex((s) => s.state !== "done");
  const pickedCount = stops.filter((s) => s.state === "done").length;
  const total = stops.length;

  let headline;
  if (nextIdx === -1) {
    if (centre.state === "done") headline = `Trip complete — all ${total} order${total === 1 ? "" : "s"} received at collection centre`;
    else if (centre.label === "At collection centre") headline = `All ${total} order${total === 1 ? "" : "s"} picked up → Reached collection centre`;
    else if (centre.state === "current") headline = `All ${total} order${total === 1 ? "" : "s"} picked up → On the way to collection centre`;
    else headline = `All ${total} order${total === 1 ? "" : "s"} picked up`;
  } else {
    const next = stops[nextIdx];
    const who = next.pickup.farmerName ? ` (${next.pickup.farmerName})` : "";
    const before = pickedCount ? `${pickedCount === 1 ? "1st order" : `${pickedCount} orders`} picked up → ` : "";
    if (next.pickup.status === "DISPATCHED") headline = `${before}On the way to ${next.title}${who}`;
    else if (next.state === "current") headline = `${before}At ${next.title} farm${who} — ${next.label}`;
    else if (pickedCount) headline = `${before}Next: ${next.title}${who}`;
    else headline = `${total} order${total === 1 ? "" : "s"} assigned — trip not started yet`;
  }

  return {
    stops: [...stops, { ...centre, title: "Collection centre", centre: true }],
    headline: isPrevious ? `Last trip · ${headline}` : headline,
    isPrevious,
    batchId: trip.find((p) => p.collectionBatchId)?.collectionBatchId || "",
    total,
    pickedCount,
  };
}

const ORDER_STEPS = ["DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED", "PICKED_UP"];
const CENTRE_FLOW = ["IN_TRANSIT", "ARRIVED_AT_CENTRE", "COLLECTION_CENTRE_RECEIVED"];
const STEP_ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  PICKUP_CONFIRMED: "PICKED_UP",
  COMPLETED: "COLLECTION_CENTRE_RECEIVED",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
};

function stepKey(status) {
  return STEP_ALIAS[status] || status;
}

function stepTimes(p) {
  const times = {};
  historyOf(p).forEach((e) => {
    const key = stepKey(e.status);
    if (!times[key]) times[key] = e.at;
  });
  return times;
}

function orderStepRows(p, title) {
  const times = stepTimes(p);
  const picked = PICKED.has(p.status);
  const idx = ORDER_STEPS.indexOf(stepKey(p.status));
  return ORDER_STEPS.map((step, i) => {
    const state = picked || i < idx ? "done" : i === idx ? "current" : "pending";
    let label = pickupStatusLabel(step);
    if (step === "DISPATCHED" || step === "DRIVER_ARRIVED") label = `${label} · ${title}`;
    return { key: `${p.id}-${step}`, label, state, at: times[step] };
  });
}

function centreStepRows(trip) {
  const times = {};
  centreHistory(trip).forEach((e) => {
    const key = stepKey(e.status);
    if (!times[key]) times[key] = e.at;
  });
  const allDone = trip.every((p) => FINISHED.includes(p.status));
  const idx = allDone ? CENTRE_FLOW.length : Math.max(-1, ...trip.map((p) => CENTRE_FLOW.indexOf(stepKey(p.status))));
  return CENTRE_FLOW.map((step, i) => ({
    key: `centre-${step}`,
    label: pickupStatusLabel(step),
    state: i < idx ? "done" : i === idx ? "current" : "pending",
    at: times[step],
  }));
}

function TripSteps({ trip, onOpen }) {
  const orders = trip.stops.filter((s) => !s.centre);
  const groups = [
    ...orders.map((s) => ({
      id: s.pickup.id,
      title: s.title,
      pickup: s.pickup,
      rows: orderStepRows(s.pickup, s.title),
    })),
    { id: "centre", title: "Collection centre", rows: centreStepRows(orders.map((s) => s.pickup)) },
  ];
  const flat = groups.flatMap((g) => g.rows);
  const nextState = (key) => {
    const i = flat.findIndex((r) => r.key === key);
    return flat[i + 1]?.state;
  };
  const dot = (state) =>
    state === "done"
      ? "border-[#217346] bg-[#217346] text-white"
      : state === "current"
        ? "border-blue-600 bg-white ring-4 ring-blue-600/15"
        : "border-[#C7E3CF] bg-white";
  const text = (state) => (state === "done" ? "text-[#217346]" : state === "current" ? "text-blue-700" : "text-gray-400");

  return (
    <div className="px-5 py-4">
      {groups.map((g, gi) => {
        const lastGroup = gi === groups.length - 1;
        return (
          <section key={g.id} id={`trip-${g.id}`} className="scroll-mt-4">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded bg-[#F3F8F4] px-2.5 py-1.5">
              <p className="text-xs font-bold text-gray-900">{g.title}</p>
              {g.pickup ? (
                <>
                  <span className="text-[11px] text-gray-600">
                    {g.pickup.farmerName || "Farmer"} · {g.pickup.productName || "—"}
                    {qtyOf(g.pickup) ? ` · ${qtyOf(g.pickup).toLocaleString("en-IN")} ${g.pickup.unit || "Kg"}` : ""}
                  </span>
                  <CopyId value={g.pickup.orderDisplayId || g.pickup.orderId} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
                  <button type="button" onClick={() => onOpen(g.pickup.id)} className="ml-auto text-[11px] font-semibold text-[#217346]">
                    Open ›
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-gray-600">after the last order is picked up</span>
              )}
            </div>
            <ol className={lastGroup ? "" : "pb-3"}>
              {g.rows.map((r, ri) => {
                const lastRow = lastGroup && ri === g.rows.length - 1;
                const lineOn = nextState(r.key) && nextState(r.key) !== "pending";
                return (
                  <li key={r.key} className={`relative flex gap-3 pl-1 ${lastRow ? "" : "pb-3"}`}>
                    {!lastRow ? (
                      <span className={`absolute left-[13px] top-[20px] h-[calc(100%-6px)] w-[3px] ${lineOn ? "bg-[#217346]" : "bg-[#D7EBDD]"}`} />
                    ) : null}
                    <span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[3px] text-[9px] font-bold ${dot(r.state)}`}>
                      {r.state === "done" ? "✓" : r.state === "current" ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold leading-tight ${text(r.state)}`}>{r.label}</p>
                      <p className="text-[10px] text-gray-400">{r.state === "pending" ? "Pending" : shortTime(r.at) || "—"}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function TripTimeline({ trip, onSelect }) {
  return (
    <div className="overflow-x-auto px-3 pb-3 pt-5">
      <div className="flex min-w-max">
        {trip.stops.map((s, i) => {
          const key = s.pickup?.id || "centre";
          const next = trip.stops[i + 1];
          const lineOn = next && next.state !== "pending";
          const circle =
            s.state === "done"
              ? "border-[#217346] bg-[#217346] text-white"
              : s.state === "current"
                ? "border-[#217346] bg-white ring-4 ring-[#217346]/15"
                : "border-[#C7E3CF] bg-white";
          const labelColor = s.state === "done" ? "text-[#217346]" : s.state === "current" ? "text-blue-700" : "text-gray-400";
          const lastAt = s.history?.length ? shortTime(s.history[s.history.length - 1].at) : "";
          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelect(key)}
              className="relative flex w-40 flex-col items-center rounded-lg px-1.5 pb-2 text-center hover:bg-gray-50"
            >
              {next ? (
                <span className={`absolute left-1/2 top-[11px] h-[3px] w-full ${lineOn ? "bg-[#217346]" : "bg-[#D7EBDD]"}`} />
              ) : null}
              <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] text-[11px] font-bold ${circle}`}>
                {s.state === "done" ? "✓" : s.state === "current" ? <span className="h-2 w-2 rounded-full bg-[#217346]" /> : null}
              </span>
              <span className={`mt-2 text-[11px] font-bold ${s.state === "pending" ? "text-gray-500" : "text-gray-900"}`}>{s.title}</span>
              <span className="max-w-[8.5rem] truncate text-[10px] text-gray-500">
                {s.pickup ? `${s.pickup.farmerName || "Farmer"} · ${s.pickup.productName || "—"}` : "Drop all orders"}
              </span>
              <span className={`mt-0.5 text-[10px] font-semibold ${labelColor}`}>{s.label}</span>
              {lastAt ? <span className="text-[9px] text-gray-400">{lastAt}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-gray-900" }) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Available: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  "On Duty": "bg-blue-100 text-blue-700",
  "Off Duty": "bg-amber-100 text-amber-700",
  "On Pickup": "bg-blue-100 text-blue-700",
  Offline: "bg-amber-100 text-amber-700",
};

export default function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const summary = useMemo(() => {
    const all = Array.isArray(driver?.pickups) ? driver.pickups : [];
    const active = all.filter((p) => !FINISHED.includes(p.status) && !["CANCELLED", "REJECTED"].includes(p.status));
    const completed = Array.isArray(driver?.completedPickups) ? driver.completedPickups : all.filter((p) => FINISHED.includes(p.status));
    const batches = groupBatches(all);
    return {
      all,
      active,
      completed,
      batches,
      activeBatches: batches.filter((b) => !b.finished),
      unbatched: active.filter((p) => !p.collectionBatchId),
      current: active[0] || null,
      trip: buildTrip(all, active),
    };
  }, [driver]);

  if (loading) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!driver) return <p className="p-6 text-xs text-red-500">{error || "Driver not found"}</p>;

  const rows = (list) =>
    list?.length ? (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            {["Order", "Lot / Batch ID", "Farmer", "Product", "Qty", "Status", ""].map((h) => (
              <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b border-gray-50">
              <td className="px-3 py-2 font-semibold">
                <CopyId value={p.orderDisplayId} textClassName="font-semibold text-gray-900" />
              </td>
              <td className="px-3 py-2">
                <CopyId value={p.collectionBatchId} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
              </td>
              <td className="px-3 py-2">{p.farmerName}</td>
              <td className="px-3 py-2">{p.productName}</td>
              <td className="px-3 py-2">{qtyOf(p) || "—"} {p.unit}</td>
              <td className="px-3 py-2">{pickupLiveLabel(p) || "—"}</td>
              <td className="px-3 py-2">
                <button type="button" className="text-[#217346]" onClick={() => navigate(`/vendor/pickups/${p.id}`)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="px-4 py-6 text-xs text-gray-400">None</p>
    );

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/drivers" className="hover:text-[#217346]">All Drivers</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{driver.name}</span>
      </div>

      <div className="border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{driver.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[driver.status] || "bg-gray-100 text-gray-600"}`}>
                {driver.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{driver.mobile} · {driver.vehicleNumber || "No vehicle"} · {driver.vehicleType}</p>
            <p className="mt-1 text-xs text-gray-500">
              Driver ID{" "}
              <CopyId value={driver.id} className="align-middle" textClassName="font-mono text-xs font-semibold text-gray-700" />
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Vehicle ID{" "}
              <CopyId value={formatVehicleId(driver.vehicleId, driver.vehicleNumber)} className="align-middle" textClassName="font-mono text-xs font-semibold text-gray-700" />
            </p>
            <p className="mt-1 text-xs text-gray-400">License: {driver.licenseNumber || "—"}</p>
            {driver.address ? <p className="mt-1 text-xs text-gray-500">Address: {driver.address}</p> : null}
          </div>
          <div className="flex gap-2">
            <Link to={`/vendor/drivers/${driver.id}/edit`} className="border border-gray-200 px-3 py-1.5 text-xs">Edit</Link>
            <button type="button" onClick={toggle} className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white">
              {driver.status === "Inactive" ? "Activate" : "Deactivate"}
            </button>
            <button type="button" onClick={handleDelete} className="border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        <Stat label="Active Orders" value={summary.active.length} color="text-blue-700" />
        <Stat label="Active Batches" value={summary.activeBatches.length} color="text-[#217346]" />
        <Stat label="Completed Orders" value={summary.completed.length} color="text-emerald-700" />
        <Stat label="Total Batches" value={summary.batches.length} />
        <Stat label="Total Orders" value={summary.all.length} />
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{summary.trip?.isPrevious ? "Previous Trip" : "Trip Progress"}</p>
            {summary.trip?.batchId ? (
              <CopyId value={summary.trip.batchId} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
            ) : null}
          </div>
          {summary.trip ? (
            <p className={`mt-0.5 text-xs font-semibold ${summary.trip.isPrevious ? "text-emerald-700" : "text-blue-700"}`}>{summary.trip.headline}</p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">No active trip. Assign orders from Ready for Pickup to start one.</p>
          )}
        </div>
        {summary.trip ? (
          <>
            <TripTimeline
              trip={summary.trip}
              onSelect={(key) => document.getElementById(`trip-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
            <div className="border-t border-gray-100">
              <TripSteps trip={summary.trip} onOpen={(id) => navigate(`/vendor/pickups/${id}`)} />
            </div>
          </>
        ) : null}
      </div>

      <div className="border border-gray-200 bg-white px-5 py-4">
        <p className="text-sm font-bold text-gray-900">Current Status</p>
        {summary.current ? (
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Working on</p>
              <p className="mt-0.5 font-semibold text-blue-700">{pickupLiveLabel(summary.current)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order</p>
              <CopyId value={summary.current.orderDisplayId || summary.current.orderId} textClassName="font-semibold text-gray-900" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Farmer · Product</p>
              <p className="mt-0.5 font-semibold text-gray-900">
                {summary.current.farmerName || "—"} · {summary.current.productName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Lot / Batch ID</p>
              {summary.current.collectionBatchId ? (
                <CopyId value={summary.current.collectionBatchId} textClassName="font-mono text-[11px] font-semibold text-[#217346]" />
              ) : (
                <p className="mt-0.5 text-gray-500">Not batched yet</p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            {["Inactive", "Off Duty", "Offline"].includes(driver.status) ? "Driver is not working right now." : "Free — no active orders assigned."}
          </p>
        )}
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Batches ({summary.batches.length})</p>
          <p className="text-[11px] text-gray-400">
            Orders grouped by Lot / Batch ID.
            {summary.unbatched.length ? ` ${summary.unbatched.length} active order${summary.unbatched.length === 1 ? " is" : "s are"} not batched yet.` : ""}
          </p>
        </div>
        {summary.batches.length ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Lot / Batch ID", "Orders", "Farmers", "Products", "Total Qty", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.batches.map((b) => (
                <tr key={b.batchId} className="border-b border-gray-50">
                  <td className="px-3 py-2">
                    <CopyId value={b.batchId} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
                  </td>
                  <td className="px-3 py-2 font-semibold">{b.pickups.length}</td>
                  <td className="px-3 py-2">{b.farmers.join(", ") || "—"}</td>
                  <td className="px-3 py-2">{b.products.join(", ") || "—"}</td>
                  <td className="px-3 py-2">{formatTotals(b.pickups)}</td>
                  <td className="px-3 py-2">
                    <span className={b.finished ? "text-emerald-700" : "font-semibold text-blue-700"}>{b.finished ? "Completed" : b.status || "—"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-[#217346]"
                      onClick={() => navigate(`/vendor/pickups/batches/${encodeURIComponent(b.batchId)}`, { state: { batchId: b.batchId, pickups: b.pickups, from: "all" } })}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-6 text-xs text-gray-400">No batches yet. A batch ID is created when the driver picks up the orders.</p>
        )}
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Assigned Tasks ({summary.active.length})</p>
          <p className="text-[11px] text-gray-400">These same pickups appear on this driver&apos;s login under My Tasks.</p>
        </div>
        {rows(summary.active)}
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Completed Pickups ({summary.completed.length})</p>
        </div>
        {rows(summary.completed)}
      </div>
    </div>
  );
}
