import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

export default function PendingDriversPage() {
  const { manager } = useAuth();
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.pendingRiders();
      const list = res.data.riders || [];
      setRiders(list);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRowClick = (riderId) => {
    navigate(`/drivers/pending/${riderId}`);
  };

  return (
    <PageShell
      title="Driver Verification Desk"
      subtitle={`Review background verification & bank accounts for ${manager?.area || "Store Area"}`}
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
            <Icon name="user" size="sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pending Applications ({riders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click on any row to open the complete document verification detail view
            </p>
          </div>
        </div>
      </div>

      {/* Tabular Roster Queue */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : riders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <p className="text-3xl mb-2">📋</p>
          <h3 className="text-base font-bold text-slate-800">Verification Queue Empty</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No new delivery partner applications awaiting document verification in this store area.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Driver Name</th>
                <th className="py-3.5 px-4">Mobile Phone</th>
                <th className="py-3.5 px-4">Bank Account Info</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Hub / Area</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riders.map((r) => {
                const riderId = r.id || r._id;
                const bank = r.bankDetails || {};
                const accountDisplay = bank.accountNumber
                  ? `${bank.accountNumber}${bank.bankName ? ` (${bank.bankName})` : ""}`
                  : "Not provided";
                const dateDisplay = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";

                return (
                  <tr
                    key={riderId}
                    onClick={() => handleRowClick(riderId)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">
                          🛵
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                            {r.name || "New Applicant"}
                          </div>
                          <div className="text-[11px] font-normal text-slate-500 capitalize">
                            Vehicle: <strong className="text-slate-700">{r.vehicleType || "Motorcycle"}</strong>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-800 font-semibold">
                      📞 {r.phone}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{accountDisplay}</span>
                        {bank.accountHolderName && (
                          <span className="block text-[11px] text-slate-400">
                            Holder: {bank.accountHolderName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      🗓️ {dateDisplay}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      📍 {r.area || manager?.area || "Hub"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(riderId);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-xs group-hover:bg-emerald-600"
                      >
                        <span>Review & Verify</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
