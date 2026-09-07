import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";
import { canRunFromList, driverNextStep } from "../../utils/driverFlow";

const COPY = {
  assigned: { title: "Assigned Pickups", sub: "Update status when you leave for the farm.", filter: "assigned", empty: "No assigned pickups." },
  progress: { title: "In Progress", sub: "On the way, at farm, confirming, or returning to the centre.", filter: "progress", empty: "No pickups in progress." },
  completed: { title: "Completed Pickups", sub: "Received at the collection centre.", filter: "completed", empty: "No completed pickups." },
  history: { title: "Pickup History", sub: "Finished pickups at the collection centre.", filter: "history", empty: "No pickup history yet." },
};

function statusLabel(pickup) {
  return pickup?.liveStatus || pickupStatusLabel(pickup?.status);
}

async function runStep(key, id) {
  if (key === "start") return driverApi.start(id);
  if (key === "arrive") return driverApi.arrive(id);
  if (key === "transit") return driverApi.transit(id);
  return null;
}

export default function DriverDashboardPage({ mode = "assigned" }) {
  const meta = COPY[mode] || COPY.assigned;
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, pickups: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    driverApi
      .getPickups({ filter: meta.filter })
      .then((r) => setData(r.data || { stats: {}, pickups: [] }))
      .catch(() => setData({ stats: {}, pickups: [] }))
      .finally(() => setLoading(false));

  usePolling(load, [meta.filter], 5000);

  const stats = data.stats || {};
  const rows = data.pickups || [];

  const handleStep = async (e, pickup, step) => {
    e.stopPropagation();
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
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
        <p className="text-sm text-gray-500">{meta.sub}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Assigned", value: stats.assigned ?? stats.pending ?? 0 },
          { label: "In Progress", value: stats.inProgress ?? 0, color: "text-blue-600" },
          { label: "Completed", value: stats.completed ?? 0, color: "text-[#217346]" },
          { label: "Total", value: stats.totalAssigned ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color || "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{meta.empty}</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((p) => {
            const step = driverNextStep(p);
            return (
              <button
                key={p.id}
                type="button"
                className="border border-gray-200 bg-white p-4 text-left hover:border-[#217346]"
                onClick={() => navigate(`/driver/pickups/${p.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-gray-900">{p.orderDisplayId}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase">{statusLabel(p)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{p.farmerName} · {p.farmerLocation || "—"}</p>
                <p className="mt-1 text-xs text-gray-600">{p.productName} · {p.packedQuantity || p.expectedQuantity} {p.unit} · {p.packageCount || 0} pkgs</p>
                {p.collectionBatchId ? (
                  <p className="mt-1 font-mono text-[10px] font-semibold text-[#217346]">{p.collectionBatchId}</p>
                ) : null}
                <p className="mt-1 text-xs font-semibold text-[#217346]">{statusLabel(p)}</p>
                {step ? (
                  <span
                    role="button"
                    tabIndex={0}
                    className="mt-3 inline-flex bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white"
                    onClick={(e) => handleStep(e, p, step)}
                  >
                    {busyId === p.id ? "Updating…" : step.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
