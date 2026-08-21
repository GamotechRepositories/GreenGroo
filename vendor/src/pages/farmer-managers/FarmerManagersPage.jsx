import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
};

export default function FarmerManagersPage() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    setLoading(true);
    vendorApi.getManagers({ q, status: statusFilter })
      .then((r) => setManagers(r.data))
      .catch(() => setManagers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, statusFilter]);

  const handleStatusToggle = async (mgr) => {
    const next = mgr.status === "Active" ? "Inactive" : "Active";
    await vendorApi.setManagerStatus(mgr.id, next).catch(() => {});
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this manager? This cannot be undone.")) return;
    try {
      await vendorApi.deleteManager(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Farmer Managers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all farmer managers under your vendor account</p>
        </div>
        <Link
          to="/vendor/farmer-managers/add"
          className="inline-flex items-center gap-1.5 bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38]"
        >
          + Add Manager
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Managers", value: managers.length },
          { label: "Active", value: managers.filter((m) => m.status === "Active").length, color: "text-green-600" },
          { label: "Farmers Managed", value: managers.reduce((s, m) => s + (m.totalFarmers || 0), 0) },
          { label: "Total Earnings", value: `₹${managers.reduce((s, m) => s + (m.totalEarnings || 0), 0).toLocaleString("en-IN")}`, color: "text-[#217346]" },
        ].map((s) => (
          <div key={s.label} className="border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color || "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, email…"
          className="max-w-xs border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {["Manager", "Mobile", "Location", "Farmers", "Products", "Earnings", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : managers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No managers found</td></tr>
            ) : (
              managers.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#E8F5E9] text-xs font-bold text-[#217346]">
                        {m.initials || m.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{m.mobile}</td>
                  <td className="px-4 py-3">{m.location || "—"}</td>
                  <td className="px-4 py-3">{m.totalFarmers ?? 0}</td>
                  <td className="px-4 py-3">{m.totalProducts ?? 0}</td>
                  <td className="px-4 py-3 font-semibold text-[#217346]">
                    ₹{(m.totalEarnings ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendor/farmer-managers/${m.id}`}
                        className="text-[10px] font-semibold text-[#217346] hover:underline"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(m)}
                        className="text-[10px] font-semibold text-amber-600 hover:underline"
                      >
                        {m.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="text-[10px] font-semibold text-red-500 hover:underline"
                      >
                        Delete
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
