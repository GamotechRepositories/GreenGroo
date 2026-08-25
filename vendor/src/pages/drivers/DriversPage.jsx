import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  "On Duty": "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-600",
  "Off Duty": "bg-amber-100 text-amber-700",
  Available: "bg-green-100 text-green-700",
  "On Pickup": "bg-blue-100 text-blue-700",
  Offline: "bg-amber-100 text-amber-700",
};

export default function DriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    setLoading(true);
    vendorApi
      .getDrivers({ q, status: statusFilter })
      .then((r) => setDrivers(r.data || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [q, statusFilter]);

  const handleStatus = async (driver) => {
    const next = driver.status === "Inactive" ? "Active" : "Inactive";
    await vendorApi.setDriverStatus(driver.id, next).catch(() => {});
    load();
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Drivers</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage delivery drivers assigned from the vendor panel</p>
        </div>
        <Link
          to="/vendor/drivers/add"
          className="inline-flex items-center gap-1.5 bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38]"
        >
          + Add Driver
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Drivers", value: drivers.length },
          { label: "Available", value: drivers.filter((d) => d.status === "Active" || d.status === "Available").length, color: "text-green-600" },
          { label: "On Duty", value: drivers.filter((d) => d.status === "On Duty" || d.status === "On Pickup").length, color: "text-blue-600" },
          { label: "Inactive", value: drivers.filter((d) => d.status === "Inactive" || d.status === "Off Duty" || d.status === "Offline").length },
        ].map((s) => (
          <div key={s.label} className="border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color || "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, vehicle…"
          className="w-64 border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        >
          <option value="">All statuses</option>
          {["Active", "On Duty", "Off Duty", "Inactive"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {["Driver", "Driver ID", "Mobile", "Vehicle", "Tasks", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No drivers yet. Add a driver to start assignments.</td></tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold text-gray-900">{d.name}</td>
                  <td className="px-3 py-2 text-gray-600">{d.id}</td>
                  <td className="px-3 py-2">{d.mobile}</td>
                  <td className="px-3 py-2">{d.vehicleNumber || "—"}</td>
                  <td className="px-3 py-2">
                    {(d.tasks || []).length === 0 ? (
                      <span className="text-gray-400">No tasks</span>
                    ) : (
                      <div className="space-y-1">
                        {d.tasks.slice(0, 4).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className="block text-left text-[#217346] hover:underline"
                            onClick={() => navigate(`/vendor/pickups/${t.id}`)}
                          >
                            {t.orderId || t.pickupId} · {t.productName || "Pickup"} · {String(t.status || "").replace(/_/g, " ")}
                          </button>
                        ))}
                        {d.tasks.length > 4 ? (
                          <button type="button" className="text-[10px] text-gray-500" onClick={() => navigate(`/vendor/drivers/${d.id}`)}>
                            +{d.tasks.length - 4} more
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-600"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="border border-gray-200 px-2 py-1 hover:bg-gray-50" onClick={() => navigate(`/vendor/drivers/${d.id}`)}>View</button>
                      <button type="button" className="border border-gray-200 px-2 py-1 hover:bg-gray-50" onClick={() => navigate(`/vendor/drivers/${d.id}/edit`)}>Edit</button>
                      <button type="button" className="border border-gray-200 px-2 py-1 hover:bg-gray-50" onClick={() => handleStatus(d)}>
                        {d.status === "Inactive" ? "Activate" : "Deactivate"}
                      </button>
                    </div>
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
