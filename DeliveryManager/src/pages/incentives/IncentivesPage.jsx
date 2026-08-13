import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

export default function IncentivesPage() {
  const { manager } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIncentives = useCallback(async () => {
    try {
      const res = await managerApi.getStoreIncentives();
      setData(res.data?.data || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load store incentive summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncentives();
  }, [loadIncentives]);

  const summary = data?.summary || {
    totalOrders: 0,
    totalEarnings: 0,
    totalTargetBonusEarned: 0,
    totalRidersWithEarnings: 0,
  };

  const riders = data?.perRiderBreakdown || [];

  return (
    <PageShell
      title="Store Incentives & Rider Earnings"
      subtitle={`Performance analytics & bonus payouts for ${manager?.storeName || "Dark Store"}`}
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Top Incentive Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Rider Earnings
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              ₹{(summary.totalEarnings || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Earned across all riders</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
            <Icon name="wallet" size="lg" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Bonus Payouts
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">
              ₹{(summary.totalTargetBonusEarned || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-amber-600 font-semibold">Target achievement rewards</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold">
            <Icon name="trophy" size="lg" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Orders Fulfilled
            </p>
            <p className="mt-1 text-2xl font-extrabold text-blue-600">
              {summary.totalOrders || 0}
            </p>
            <p className="mt-1 text-[11px] text-blue-600 font-semibold">Completed store deliveries</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold">
            <Icon name="orders" size="lg" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Active Earning Riders
            </p>
            <p className="mt-1 text-2xl font-extrabold text-purple-600">
              {summary.totalRidersWithEarnings || 0}
            </p>
            <p className="mt-1 text-[11px] text-purple-600 font-semibold">Riders with incentives</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 font-bold">
            <Icon name="truck" size="lg" />
          </div>
        </div>
      </div>

      {/* Per Rider Incentive Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rider Performance & Bonus Leaderboard</h2>
            <p className="text-xs text-slate-500">Breakdown of orders completed, total earnings, and target bonuses</p>
          </div>
          <button
            type="button"
            onClick={loadIncentives}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            🔄 Refresh Breakdown
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-xs text-slate-500">Loading incentive summary…</p>
        ) : riders.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm font-bold text-slate-700">No incentive records found yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Rider earnings and target bonus summaries will automatically populate here as riders complete store orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Orders Completed</th>
                  <th className="py-3 px-4">Base Earnings</th>
                  <th className="py-3 px-4">Target Bonus</th>
                  <th className="py-3 px-4 text-right">Total Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riders.map((r, i) => (
                  <tr key={r.riderId || i} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          #{i + 1}
                        </span>
                        <span className="font-bold text-slate-900">{r.riderName || "Rider"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{r.riderPhone || "N/A"}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.totalOrders} orders</td>
                    <td className="py-3 px-4 font-medium text-slate-700">₹{((r.totalEarnings || 0) - (r.targetBonusEarned || 0)).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                        🎁 +₹{(r.targetBonusEarned || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 text-sm">
                      ₹{(r.totalEarnings || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}