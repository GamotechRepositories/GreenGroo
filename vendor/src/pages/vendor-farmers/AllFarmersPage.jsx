import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

export default function AllFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [assigningFarmerId, setAssigningFarmerId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      vendorApi.getFarmers({ q, status: statusFilter, managerId: managerFilter }).then((r) => r.data),
      vendorApi.getManagers().then((r) => r.data),
    ])
      .then(([fs, ms]) => { setFarmers(fs); setManagers(ms); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, statusFilter, managerFilter]);

  const handleAssignManager = async (farmerId, managerId) => {
    setAssigningFarmerId(farmerId);
    try {
      await vendorApi.assignFarmerManager(farmerId, managerId || "");
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to assign manager");
    } finally {
      setAssigningFarmerId(null);
    }
  };

  const handleDeleteFarmer = async (farmer) => {
    const confirmMsg = `Are you sure you want to delete farmer "${farmer.name}" (${farmer.mobile})?\nThis will remove all associated products, inventory, and records.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(farmer.id);
    try {
      await vendorApi.deleteFarmer(farmer.id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete farmer");
    } finally {
      setDeletingId(null);
    }
  };

  const STATUS_BADGE = (status) => {
    const map = {
      Active: "bg-green-100 text-green-700",
      Inactive: "bg-gray-100 text-gray-600",
      Pending: "bg-yellow-100 text-yellow-700",
    };
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Farmers</h1>
          <p className="text-sm text-gray-500 mt-0.5">All farmers under your vendor account — manage, assign managers, or remove</p>
        </div>
        <Link
          to="/vendor/all-farmers/add"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38]"
        >
          + Add Farmer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search farmer name or mobile…"
          className="max-w-xs border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-xs outline-none"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-xs outline-none"
        >
          <option value="">All Managers</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {["Farmer", "Mobile", "Farm", "Manager", "Products", "Earnings", "Status", "Assign Manager", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : farmers.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No farmers found</td></tr>
            ) : (
              farmers.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                        {f.initials || f.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.farmerCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{f.mobile}</td>
                  <td className="px-4 py-3">{f.farmName || "—"}</td>
                  <td className="px-4 py-3">{f.managerName || "Unassigned"}</td>
                  <td className="px-4 py-3">{f.totalProducts ?? 0}</td>
                  <td className="px-4 py-3 font-semibold text-[#217346]">₹{(f.totalEarnings ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{STATUS_BADGE(f.status)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={f.managerId || ""}
                      disabled={assigningFarmerId === f.id}
                      onChange={(e) => handleAssignManager(f.id, e.target.value)}
                      className="border border-gray-200 px-2 py-1 text-[10px] outline-none focus:border-[#217346] disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={deletingId === f.id}
                      onClick={() => handleDeleteFarmer(f)}
                      className="rounded bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === f.id ? "Deleting…" : "Delete"}
                    </button>
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
