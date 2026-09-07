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

const ACTION =
  "text-[10px] font-semibold text-[#217346] hover:underline";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "D";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

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

  const handleDelete = async (driver) => {
    const id = driver.driverId || driver.id;
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      await vendorApi.deleteDriver(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete driver");
    }
  };

  const available = drivers.filter((d) => d.status === "Active" || d.status === "Available").length;
  const onDuty = drivers.filter((d) => d.status === "On Duty" || d.status === "On Pickup").length;
  const inactive = drivers.filter((d) => d.status === "Inactive" || d.status === "Off Duty" || d.status === "Offline").length;

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
          { label: "Available", value: available, color: "text-green-600" },
          { label: "On Duty", value: onDuty, color: "text-blue-600" },
          { label: "Inactive", value: inactive },
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
          className="max-w-xs border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        >
          <option value="">All Status</option>
          {["Active", "On Duty", "Off Duty", "Inactive"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-gray-200 bg-white">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {["Driver", "Mobile", "Vehicle", "Area", "Tasks", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No drivers yet. Add a driver to start assignments.
                </td>
              </tr>
            ) : (
              drivers.map((d) => {
                const id = d.driverId || d.id;
                const active = Number(d.activePickups || 0);
                return (
                  <tr key={id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                          {initials(d.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{d.name || "—"}</p>
                          <p className="truncate font-mono text-[10px] text-gray-400">{id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.mobile ? (
                        <a href={`tel:${d.mobile}`} className="font-semibold text-[#217346] hover:underline">
                          {d.mobile}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="min-w-0 px-4 py-3">
                      <p className="truncate font-semibold text-gray-900">{d.vehicleNumber || "—"}</p>
                      <p className="truncate font-mono text-[10px] text-gray-400" title={d.vehicleId || ""}>
                        {d.vehicleId || d.vehicleType || "—"}
                      </p>
                    </td>
                    <td className="min-w-0 truncate px-4 py-3 text-gray-600" title={d.assignedArea || ""}>
                      {d.assignedArea || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {active > 0 ? (
                        <button
                          type="button"
                          className="font-semibold text-[#217346] hover:underline"
                          onClick={() => navigate(`/vendor/drivers/${id}`)}
                        >
                          {active} active
                        </button>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-600"}`}>
                        {d.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/vendor/drivers/${id}`} className={ACTION}>
                          View
                        </Link>
                        <Link to={`/vendor/drivers/${id}/edit`} className={ACTION}>
                          Edit
                        </Link>
                        <button type="button" onClick={() => handleStatus(d)} className="text-[10px] font-semibold text-amber-600 hover:underline">
                          {d.status === "Inactive" ? "Activate" : "Deactivate"}
                        </button>
                        <button type="button" onClick={() => handleDelete(d)} className="text-[10px] font-semibold text-red-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
