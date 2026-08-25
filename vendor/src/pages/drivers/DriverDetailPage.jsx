import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

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

  const load = () => {
    setLoading(true);
    vendorApi
      .getDriverById(driverId)
      .then((r) => setDriver(r.data))
      .catch((err) => setError(err?.response?.data?.message || "Driver not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [driverId]);

  const toggle = async () => {
    const next = driver.status === "Inactive" ? "Active" : "Inactive";
    await vendorApi.setDriverStatus(driver.id, next).catch(() => {});
    load();
  };

  if (loading) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!driver) return <p className="p-6 text-xs text-red-500">{error || "Driver not found"}</p>;

  const rows = (list) =>
    list?.length ? (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            {["Order", "Farmer", "Product", "Qty", "Status", ""].map((h) => (
              <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b border-gray-50">
              <td className="px-3 py-2 font-semibold">{p.orderDisplayId}</td>
              <td className="px-3 py-2">{p.farmerName}</td>
              <td className="px-3 py-2">{p.productName}</td>
              <td className="px-3 py-2">{p.packedQuantity || p.expectedQuantity} {p.unit}</td>
              <td className="px-3 py-2">{p.status?.replace(/_/g, " ")}</td>
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
            <p className="mt-1 text-xs text-gray-400">Driver ID: {driver.id} · License: {driver.licenseNumber || "—"}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/vendor/drivers/${driver.id}/edit`} className="border border-gray-200 px-3 py-1.5 text-xs">Edit</Link>
            <button type="button" onClick={toggle} className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white">
              {driver.status === "Inactive" ? "Activate" : "Deactivate"}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Assigned Tasks</p>
          <p className="text-[11px] text-gray-400">These same pickups appear on this driver&apos;s login under My Tasks.</p>
        </div>
        {rows((driver.pickups || driver.activePickups || []).filter((p) => !["COMPLETED", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"].includes(p.status)))}
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Completed Pickups</p>
        </div>
        {rows(driver.completedPickups)}
      </div>
    </div>
  );
}
