import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { pickupStatusLabel } from "../../components/pickup/PickupTimeline";

const COPY = {
  assigned: {
    title: "Assigned Pickups",
    sub: "Scheduled pickups with a driver assigned.",
    filter: "assigned",
    empty: "No assigned pickups.",
  },
  assignments: {
    title: "Assigned Pickups",
    sub: "Orders ready for pickup. Assign an available driver.",
    filter: "ready",
    empty: "No orders are waiting for driver assignment.",
  },
  today: {
    title: "Today's Pickups",
    sub: "Pickups scheduled for today.",
    filter: "today",
    empty: "No pickups scheduled today.",
  },
  active: {
    title: "Active Pickups",
    sub: "Pickups currently assigned to drivers.",
    filter: "active",
    empty: "No active pickups right now.",
  },
  history: {
    title: "Pickup History",
    sub: "Completed and received pickups.",
    filter: "history",
    empty: "No completed pickups yet.",
  },
  centre: {
    title: "Collection Centre",
    sub: "Incoming pickups for receiving, weight check and receipt.",
    filter: "centre",
    empty: "No pickups at the collection centre yet.",
  },
};

export default function VendorPickupsPage({ mode = "assignments" }) {
  const meta = COPY[mode] || COPY.assignments;
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vendorApi
      .getPickups({ filter: meta.filter })
      .then((r) => setRows(r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [meta.filter]);

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{meta.sub}</p>
      </div>
      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {["Order ID", "Farmer", "Location", "Product", "Qty", "Packages", "Pickup", "Centre", "Driver", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">{meta.empty}</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold">{p.orderDisplayId}</td>
                  <td className="px-3 py-2">{p.farmerName}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate">{p.farmerLocation || "—"}</td>
                  <td className="px-3 py-2">{p.productName}</td>
                  <td className="px-3 py-2">{p.packedQuantity || p.expectedQuantity} {p.unit}</td>
                  <td className="px-3 py-2">{p.packageCount || 0}</td>
                  <td className="px-3 py-2">{p.scheduledDate || "—"} {p.scheduledTime || ""}</td>
                  <td className="px-3 py-2">{p.collectionCentreName || "—"}</td>
                  <td className="px-3 py-2">{p.driverName || "Unassigned"}</td>
                  <td className="px-3 py-2">{p.liveStatus || pickupStatusLabel(p.status)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-[#217346] font-semibold"
                      onClick={() => navigate(mode === "centre" ? `/vendor/collection-centre/${p.id}` : `/vendor/pickups/${p.id}`)}
                    >
                      {mode === "assignments" && (p.status === "READY_FOR_PICKUP") ? "Assign Driver" : "Open"}
                    </button>
                    {mode === "centre" && (p.receiving?.status === "RECEIVED" || p.status === "COLLECTION_CENTRE_RECEIVED") ? (
                      <button
                        type="button"
                        className="ml-3 font-semibold text-[#217346]"
                        onClick={() => navigate(`/vendor/quality/${p.orderId}`)}
                      >
                        Quality Check
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
