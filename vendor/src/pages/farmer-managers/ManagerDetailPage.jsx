import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const STATUS_BADGE = (status) => {
  const map = { Active: "bg-green-100 text-green-700", Inactive: "bg-gray-100 text-gray-600" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

export default function ManagerDetailPage() {
  const { managerId } = useParams();
  const [manager, setManager] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vendorApi.getManagerById(managerId).then((r) => r.data),
      vendorApi.getFarmers({ managerId }).then((r) => r.data),
    ])
      .then(([mgr, fs]) => { setManager(mgr); setFarmers(fs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [managerId]);

  if (loading) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!manager) return <p className="p-6 text-xs text-red-500">Manager not found</p>;

  return (
    <div className="space-y-5 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/farmer-managers" className="hover:text-[#217346]">Farmer Managers</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{manager.name}</span>
      </div>

      {/* Profile Card */}
      <div className="border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#E8F5E9] text-2xl font-bold text-[#217346]">
            {manager.initials || manager.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{manager.name}</h1>
              {STATUS_BADGE(manager.status)}
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{manager.mobile} · {manager.email || "—"}</p>
            <p className="mt-0.5 text-xs text-gray-400">{manager.location || "—"} · Joined: {manager.joiningDate || manager.createdAt ? new Date(manager.joiningDate || manager.createdAt).toLocaleDateString("en-IN") : "—"}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Farmers", value: manager.totalFarmers ?? 0 },
            { label: "Active Farmers", value: manager.activeFarmers ?? 0, color: "text-green-600" },
            { label: "Products", value: manager.totalProducts ?? 0 },
            { label: "Inventory", value: `${manager.totalInventory ?? 0} Kg` },
            { label: "Total Earnings", value: `₹${(manager.totalEarnings ?? 0).toLocaleString("en-IN")}`, color: "text-[#217346]" },
          ].map((s) => (
            <div key={s.label} className="border border-gray-100 bg-gray-50 p-3 text-center">
              <p className={`text-lg font-bold ${s.color || "text-gray-900"}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Farmers */}
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-bold text-gray-900">Assigned Farmers ({farmers.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Farmer", "Mobile", "Farm", "Products", "Earnings", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farmers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No farmers assigned</td></tr>
              ) : farmers.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                        {f.initials || f.name?.charAt(0)}
                      </div>
                      <span className="font-semibold">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{f.mobile}</td>
                  <td className="px-4 py-3">{f.farmName || "—"}</td>
                  <td className="px-4 py-3">{f.totalProducts ?? 0}</td>
                  <td className="px-4 py-3 font-semibold text-[#217346]">₹{(f.totalEarnings ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{STATUS_BADGE(f.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
