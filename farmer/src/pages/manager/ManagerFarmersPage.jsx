import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, deleteManagerFarmer } from "../../api/farmerApi";
import CopyId from "../../components/ui/CopyId";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Pending: "bg-yellow-100 text-yellow-700",
  Suspended: "bg-red-100 text-red-700",
};

function farmerCodeOf(f) {
  return f.farmerCode || f.farmerId || f.id || "";
}

function FarmerMobileCard({ f, deletingId, onDelete }) {
  return (
    <article className={`${EXCEL_PANEL} p-3`}>
      <div className="flex items-start gap-2.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#E8F5E9] text-sm font-bold text-[#217346]">
          {f.initials || f.name?.charAt(0) || "F"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/farmer/manager/farmers/${f.id}`}
              className="min-w-0 truncate text-[13px] font-bold text-[#217346]"
            >
              {f.name || "Farmer"}
            </Link>
            <span
              className={`max-w-[42%] shrink-0 truncate rounded px-2 py-0.5 text-[10px] font-semibold ${
                STATUS_COLORS[f.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {f.status || "—"}
            </span>
          </div>
          <CopyId
            value={farmerCodeOf(f)}
            className="mt-0.5"
            textClassName="font-mono text-[10px] text-emerald-700"
            breakAll
          />
          <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">{f.mobile || "—"}</p>
          <p className="truncate text-[11px] text-[#6B7280]">
            {[f.farmName, f.farmLocation].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
        <div className="rounded-lg bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] text-[#6B7280]">Products</p>
          <p className="text-[12px] font-bold text-slate-900">{f.totalProducts ?? 0}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] text-[#6B7280]">Stock</p>
          <p className="truncate text-[12px] font-bold text-slate-900">{f.totalStock ?? 0} Kg</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] text-[#6B7280]">Orders</p>
          <p className="text-[12px] font-bold text-slate-900">{f.totalOrders ?? 0}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] text-[#6B7280]">Earnings</p>
          <p className="truncate text-[12px] font-bold text-[#217346]">
            ₹{(f.totalEarnings ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <Link
          to={`/farmer/manager/farmers/${f.id}`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
        >
          View
        </Link>
        <button
          type="button"
          disabled={deletingId === f.id}
          onClick={() => onDelete(f)}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-red-50 text-[11px] font-semibold text-red-600 disabled:opacity-50"
        >
          {deletingId === f.id ? "…" : "Delete"}
        </button>
      </div>
    </article>
  );
}

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
      f.farmerCode?.toLowerCase().includes(needle) ||
      String(f.farmerId || f.id || "").toLowerCase().includes(needle)
    );
  });

  const handleDelete = async (farmer) => {
    const ok = window.confirm(
      `Are you sure you want to delete farmer "${farmer.name}" (${farmer.mobile})?\nAll products, orders, and records for this farmer will be removed.`
    );
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>My Farmers</h1>
          <p className={EXCEL_PAGE_SUB}>{displayedFarmers.length} farmers assigned to you</p>
        </div>
        <Link
          to="/farmer/manager/farmers/add"
          className={`${EXCEL_BTN_PRIMARY} h-10 w-full px-3 text-xs sm:h-auto sm:w-auto sm:py-1.5`}
        >
          + Add Farmer
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, or ID…"
          className={`${EXCEL_INPUT} w-full sm:max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${EXCEL_INPUT} w-full sm:max-w-[140px]`}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Loading…</p>
      ) : displayedFarmers.length === 0 ? (
        <div className={`${EXCEL_PANEL} px-4 py-10 text-center text-sm text-[#6B7280]`}>No farmers found</div>
      ) : (
        <>
          <div className="space-y-2.5 lg:hidden">
            {displayedFarmers.map((f) => (
              <FarmerMobileCard key={f.id} f={f} deletingId={deletingId} onDelete={handleDelete} />
            ))}
          </div>

          <div className={`${EXCEL_PANEL} hidden lg:block`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F2F2] text-left">
                    {["Farmer", "Mobile", "Farm Name", "Location", "Products", "Stock", "Orders", "Earnings", "Status", "Actions"].map(
                      (h) => (
                        <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedFarmers.map((f) => (
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
                      <td className="px-3 py-2.5 font-semibold text-[#217346]">
                        ₹{(f.totalEarnings ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_COLORS[f.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/farmer/manager/farmers/${f.id}`} className={`${EXCEL_BTN} inline-block`}>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
