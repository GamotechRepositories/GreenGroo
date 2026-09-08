import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import { pickupStatusLabel, pickupLiveLabel } from "../../components/pickup/PickupTimeline";
import BatchQrModal from "../../components/pickup/BatchQrModal";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import { usePolling } from "../../hooks/usePolling";
import { canRunFromList, driverNextStep } from "../../utils/driverFlow";

const COPY = {
  assigned: { title: "Assigned Pickups", sub: "Update status when you leave for the farm.", filter: "assigned", empty: "No assigned pickups." },
  progress: { title: "In Progress", sub: "On the way, at farm, confirming, or returning to the centre.", filter: "progress", empty: "No pickups in progress." },
  completed: { title: "Completed Pickups", sub: "Received at the collection centre.", filter: "completed", empty: "No completed pickups." },
  history: { title: "Pickup History", sub: "Finished pickups at the collection centre.", filter: "history", empty: "No pickup history yet." },
};

function statusLabel(pickup) {
  return pickupLiveLabel(pickup) || pickupStatusLabel(pickup?.status);
}

function StatusChip({ children }) {
  return (
    <span className="inline-flex max-w-full rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#217346]">
      {children}
    </span>
  );
}

function CardBtn({ children, onClick, variant = "primary" }) {
  const cls =
    variant === "primary"
      ? "bg-[#217346] text-white hover:bg-[#1a5c38]"
      : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50";
  return (
    <button
      type="button"
      className={`inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-xs font-semibold ${cls}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

async function runStep(key, id) {
  if (key === "start") return driverApi.start(id);
  if (key === "arrive") return driverApi.arrive(id);
  if (key === "transit") return driverApi.transit(id);
  if (key === "arriveCentre") return driverApi.arriveCentre(id);
  return null;
}

function groupDriverCards(pickups, groupByBatch) {
  if (!groupByBatch) return pickups.map((p) => ({ type: "order", pickup: p, id: p.id }));
  const seen = new Map();
  const cards = [];
  for (const p of pickups) {
    const bid = String(p.collectionBatchId || "").trim();
    if (!bid) {
      cards.push({ type: "order", pickup: p, id: p.id });
      continue;
    }
    if (!seen.has(bid)) {
      const group = { type: "batch", batchId: bid, pickups: [], id: bid };
      seen.set(bid, group);
      cards.push(group);
    }
    seen.get(bid).pickups.push(p);
  }
  return cards;
}

export default function DriverDashboardPage({ mode = "assigned" }) {
  const meta = COPY[mode] || COPY.assigned;
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, pickups: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [qrBatchId, setQrBatchId] = useState("");

  const load = () =>
    driverApi
      .getPickups({ filter: meta.filter })
      .then((r) => setData(r.data || { stats: {}, pickups: [] }))
      .catch(() => setData({ stats: {}, pickups: [] }))
      .finally(() => setLoading(false));

  usePolling(load, [meta.filter], 5000);

  const stats = data.stats || {};
  const rows = data.pickups || [];
  const cards = groupDriverCards(rows, mode !== "assigned");

  const handleStep = async (pickup, step) => {
    if (!step) return;
    if (!canRunFromList(step.key)) {
      navigate(`/driver/pickups/${pickup.id}`);
      return;
    }
    setBusyId(pickup.id);
    setError("");
    try {
      await runStep(step.key, pickup.id);
      await load();
      if (step.key === "start" || step.key === "arrive") {
        navigate(`/driver/pickups/${pickup.id}`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update status");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{meta.title}</h1>
        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{meta.sub}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Assigned", value: stats.assigned ?? stats.pending ?? 0 },
          { label: "In Progress", value: stats.inProgress ?? 0, color: "text-blue-600" },
          { label: "Completed", value: stats.completed ?? 0, color: "text-[#217346]" },
          { label: "Total", value: stats.totalAssigned ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-gray-200 bg-white p-3 sm:p-4">
            <p className="text-[11px] text-gray-500 sm:text-xs">{s.label}</p>
            <p className={`mt-1 text-lg font-bold sm:text-xl ${s.color || "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{meta.empty}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {cards.map((card) => {
            if (card.type === "batch") {
              const orders = card.pickups;
              const first = orders[0];
              const arrivePickup = orders.find((p) => p.status === "IN_TRANSIT") || first;
              const step = driverNextStep(arrivePickup);
              const openBatch = () =>
                navigate(`/driver/batches/${encodeURIComponent(card.batchId)}`, {
                  state: { batchId: card.batchId, pickups: orders },
                });
              return (
                <article key={card.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusChip>{statusLabel(first)}</StatusChip>
                      <p className="text-xs font-medium text-gray-500">
                        {orders.length} order{orders.length === 1 ? "" : "s"} in this batch
                      </p>
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Lot / Batch ID</p>
                    <CopyId
                      value={card.batchId}
                      className="mt-1"
                      textClassName="break-all font-mono text-[15px] font-bold leading-snug text-[#217346] sm:text-base"
                      breakAll
                    />
                    <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Driver ID</p>
                        <CopyId
                          value={first.driverId || first.driver?.id || first.driver?.driverId}
                          className="mt-0.5"
                          textClassName="break-all font-mono text-[11px] font-semibold text-gray-800"
                          breakAll
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Vehicle ID</p>
                        <CopyId
                          value={formatVehicleId(first.vehicleId || first.driver?.vehicleId, first.vehicleNumber || first.driver?.vehicleNumber)}
                          className="mt-0.5"
                          textClassName="break-all font-mono text-[11px] font-semibold text-gray-800"
                          breakAll
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-[#F8FAF8] p-3">
                    <CardBtn onClick={() => setQrBatchId(card.batchId)}>Show QR</CardBtn>
                    <CardBtn variant="secondary" onClick={openBatch}>View details</CardBtn>
                    {step && canRunFromList(step.key) ? (
                      <div className="col-span-2">
                        <CardBtn onClick={() => handleStep(arrivePickup, step)}>
                          {busyId === arrivePickup.id ? "Updating…" : step.label}
                        </CardBtn>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            }
            const p = card.pickup;
            const step = driverNextStep(p);
            return (
              <article key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="w-full p-4 text-left">
                  <div className="mb-2">
                    <StatusChip>{statusLabel(p)}</StatusChip>
                  </div>
                  <button
                    type="button"
                    className="w-full text-left hover:opacity-90"
                    onClick={() => navigate(`/driver/pickups/${p.id}`)}
                  >
                    <span className="min-w-0 break-all text-sm font-bold text-gray-900">{p.orderDisplayId}</span>
                  </button>
                  <div className="mt-1">
                    <CopyId
                      value={p.orderDisplayId}
                      textClassName="break-all font-mono text-[11px] font-semibold text-[#217346]"
                      breakAll
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                    {p.farmerName} · {p.farmerLocation || "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {p.productName} · {p.packedQuantity || p.expectedQuantity} {p.unit} · {p.packageCount || 0} pkgs
                  </p>
                  {p.collectionBatchId ? (
                    <CopyId
                      value={p.collectionBatchId}
                      className="mt-2"
                      textClassName="break-all font-mono text-[10px] font-semibold text-[#217346]"
                      breakAll
                    />
                  ) : null}
                </div>
                <div className={`grid gap-2 border-t border-gray-100 bg-[#F8FAF8] p-3 ${p.collectionBatchId && step ? "grid-cols-2" : "grid-cols-1"}`}>
                  {p.collectionBatchId ? (
                    <CardBtn onClick={() => setQrBatchId(p.collectionBatchId)}>Show QR</CardBtn>
                  ) : null}
                  {step ? (
                    <CardBtn
                      variant={p.collectionBatchId ? "secondary" : "primary"}
                      onClick={() => handleStep(p, step)}
                    >
                      {busyId === p.id ? "Updating…" : step.label}
                    </CardBtn>
                  ) : (
                    <CardBtn variant="secondary" onClick={() => navigate(`/driver/pickups/${p.id}`)}>
                      Open
                    </CardBtn>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <BatchQrModal
        batchId={qrBatchId}
        record={
          qrBatchId
            ? { batchId: qrBatchId, pickups: rows.filter((p) => p.collectionBatchId === qrBatchId) }
            : null
        }
        onClose={() => setQrBatchId("")}
      />
    </div>
  );
}
