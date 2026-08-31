import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";

const COPY = {
  assigned: { title: "Assigned Pickups", sub: "Pickups assigned to you. Start pickup to travel to the farm.", filter: "assigned", empty: "No assigned pickups." },
  progress: { title: "In Progress", sub: "On the way, reached farm, confirming, or returning to the centre.", filter: "progress", empty: "No pickups in progress." },
  completed: { title: "Completed Pickups", sub: "Orders you have picked up.", filter: "completed", empty: "No completed pickups." },
  history: { title: "Pickup History", sub: "Full history of your pickups.", filter: "history", empty: "No pickup history yet." },
};

function statusLabel(pickup) {
  return pickup?.liveStatus || pickupStatusLabel(pickup?.status);
}

export default function DriverDashboardPage({ mode = "assigned" }) {
  const meta = COPY[mode] || COPY.assigned;
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, pickups: [] });
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    driverApi
      .getPickups({ filter: meta.filter })
      .then((r) => setData(r.data || { stats: {}, pickups: [] }))
      .catch(() => setData({ stats: {}, pickups: [] }))
      .finally(() => setLoading(false));
  }, [meta.filter], 5000);

  const stats = data.stats || {};
  const rows = data.pickups || [];

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
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{meta.empty}</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((p) => (
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
              <p className="mt-1 text-xs font-semibold text-[#217346]">{p.liveStatus || pickupStatusLabel(p.status)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
