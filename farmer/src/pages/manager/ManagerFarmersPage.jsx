import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, deleteManagerFarmer } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_BTN_DANGER } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Pending: "bg-yellow-100 text-yellow-700",
  Suspended: "bg-red-100 text-red-700",
};

export default function ManagerFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadFarmers = () => {
    setLoading(true);
    getManagerFarmers()
      .then(setFarmers)
      .catch(() => setFarmers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const displayedFarmers = farmers.filter((f) => {
    if (statusFilter && f.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      f.name?.toLowerCase().includes(needle) ||
      f.mobile?.includes(needle) ||
      f.farmName?.toLowerCase().includes(needle) ||
      f.farmerCode?.toLowerCase().includes(needle)
    );
  });

  const handleDelete = async (farmer) => {
    const ok = window.confirm(`Are you sure you want to delete farmer "${farmer.name}" (${farmer.mobile})?\nAll products, orders, and records for this farmer will be removed.`);
    if (!ok) return;

    setDeletingId(farmer.id);
    try {
      await deleteManagerFarmer(farmer.id);
      toast.success(`Farmer "${farmer.name}" deleted`);
      loadFarmers();
    } catch (err) {
      toast.error(err?.message || "Failed to delete farmer");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>My Farmers</h1>
          <p className={EXCEL_PAGE_SUB}>Farmers assigned to you</p>
        </div>
        <Link
          to="/farmer/manager/farmers/add"
          className={`${EXCEL_BTN_PRIMARY} inline-block px-3 py-1.5 text-xs`}
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
          className={`${EXCEL_INPUT} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={EXCEL_INPUT}
          style={{ maxWidth: 140 }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className={EXCEL_PANEL}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F2F2F2] text-left">
                {["Farmer", "Mobile", "Farm Name", "Location", "Products", "Stock", "Orders", "Earnings", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-[#6B7280]">Loading…</td></tr>
              ) : displayedFarmers.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-[#6B7280]">No farmers found</td></tr>
              ) : (
                displayedFarmers.map((f) => (
                  <tr key={f.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#D4D4D4] bg-[#F2F2F2] text-[10px] font-bold text-[#217346]">
                          {f.initials || f.name?.charAt(0)}
                        </span>
                        <Link to={`/farmer/manager/farmers/${f.id}`} className="font-semibold hover:text-[#217346]">
                          {f.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{f.mobile}</td>
                    <td className="px-3 py-2.5">{f.farmName || "—"}</td>
                    <td className="px-3 py-2.5">{f.farmLocation || "—"}</td>
                    <td className="px-3 py-2.5">{f.totalProducts ?? 0}</td>
                    <td className="px-3 py-2.5">{f.totalStock ?? 0} Kg</td>
                    <td className="px-3 py-2.5">{f.totalOrders ?? 0}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#217346]">₹{(f.totalEarnings ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[f.status] || "bg-gray-100 text-gray-600"}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/farmer/manager/farmers/${f.id}`}
                          className={`${EXCEL_BTN} inline-block`}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === f.id}
                          onClick={() => handleDelete(f)}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === f.id ? "…" : "Delete"}
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
    </div>
  );
}
