import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import { useDriverAuth } from "../../context/DriverAuthContext";
import { pickupLiveLabel, pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import CopyId from "../../components/ui/CopyId";
import { usePolling } from "../../hooks/usePolling";
import DriverDashboardCharts from "../../components/driver/DriverDashboardCharts";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";

function pickupWhen(p) {
  return new Date(p?.updatedAt || p?.pickupConfirmedAt || p?.assignedAt || p?.createdAt || 0).getTime() || 0;
}

function latestTen(pickups = []) {
  return [...pickups].sort((a, b) => pickupWhen(b) - pickupWhen(a)).slice(0, 10);
}

export default function DriverHomePage() {
  const { driver } = useDriverAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, pickups: [] });
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    driverApi
      .getPickups({ filter: "all" })
      .then((r) => setData(r.data || { stats: {}, pickups: [] }))
      .catch(() => setData({ stats: {}, pickups: [] }))
      .finally(() => setLoading(false));
  }, [], 5000);

  const stats = data.stats || {};
  const pickups = data.pickups || [];
  const recent = latestTen(pickups);
  const chartCounts = {
    assigned: stats.assigned ?? stats.pending ?? 0,
    inProgress: stats.inProgress ?? 0,
    completed: stats.completed ?? 0,
  };

  return (
    <div className="space-y-3 p-4 sm:space-y-5 sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#217346] sm:text-xs">Pickup Driver</p>
        <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">{driver?.name || "Driver"}</h1>
        <p className="hidden text-sm text-gray-500 sm:block">Overview of your assigned pickups and recent orders.</p>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {[
            { label: "Assigned", value: chartCounts.assigned, to: "/driver/assigned" },
            { label: "In Progress", value: chartCounts.inProgress, to: "/driver/progress", color: "text-blue-600" },
            { label: "Completed", value: chartCounts.completed, to: "/driver/completed", color: "text-[#217346]" },
            { label: "Total", value: stats.totalAssigned ?? pickups.length, to: "/driver/history" },
          ].map((s) => (
            <Link key={s.label} to={s.to} className={`${PANEL} min-w-0 p-3 sm:p-4`}>
              <p className="truncate text-[11px] text-gray-500 sm:text-xs">{s.label}</p>
              <p className={`mt-1 text-lg font-bold sm:text-xl ${s.color || "text-gray-900"}`}>{s.value}</p>
            </Link>
          ))}
        </div>
      )}

      {!loading ? (
        <DriverDashboardCharts
          pickups={pickups}
          counts={chartCounts}
          onStatus={(to) => navigate(to)}
        />
      ) : null}

      <div className={PANEL}>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-3 sm:px-4">
          <p className="text-sm font-semibold text-gray-900">Recent Orders</p>
          <span className="text-[11px] font-medium text-gray-500">Latest 10</span>
          <Link to="/driver/history" className="ml-auto text-[11px] font-semibold text-[#217346] sm:text-xs">
            View all
          </Link>
        </div>

        <div className="divide-y divide-gray-100 lg:hidden">
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No recent pickups</p>
          ) : (
            recent.map((p) => (
              <Link key={p.id} to={`/driver/pickups/${p.id}`} className="block px-3 py-3 sm:px-4">
                <div className="flex items-start justify-between gap-2">
                  <CopyId
                    value={p.orderDisplayId || p.orderId}
                    textClassName="font-mono text-[11px] font-semibold text-[#217346]"
                    breakAll
                  />
                  <span className="max-w-[46%] shrink-0 truncate rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#217346]">
                    {pickupLiveLabel(p) || pickupStatusLabel(p?.status)}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold text-gray-900">
                  {p.farmerName || "—"}
                  <span className="font-medium text-gray-500"> · {p.productName || "—"}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {p.packedQuantity || p.expectedQuantity || 0} {p.unit || "Kg"}
                  {p.collectionBatchId ? ` · ${p.collectionBatchId}` : ""}
                </p>
              </Link>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Order ID", "Farmer", "Product", "Qty", "Batch", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-400">
                    No recent pickups
                  </td>
                </tr>
              ) : (
                recent.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <Link to={`/driver/pickups/${p.id}`}>
                        <CopyId value={p.orderDisplayId || p.orderId} textClassName="font-mono text-[11px] text-[#217346]" />
                      </Link>
                    </td>
                    <td className="px-3 py-2">{p.farmerName || "—"}</td>
                    <td className="px-3 py-2">{p.productName || "—"}</td>
                    <td className="px-3 py-2">
                      {p.packedQuantity || p.expectedQuantity || 0} {p.unit || "Kg"}
                    </td>
                    <td className="px-3 py-2">
                      {p.collectionBatchId ? (
                        <CopyId value={p.collectionBatchId} textClassName="font-mono text-[11px] text-[#217346]" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px] font-semibold text-[#217346]">
                      {pickupLiveLabel(p) || pickupStatusLabel(p?.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
