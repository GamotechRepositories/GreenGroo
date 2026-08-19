import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

const getTodayString = () => new Date().toISOString().slice(0, 10);

export default function IncentivesPage() {
  const { manager } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [data, setData] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

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

  const loadGigs = useCallback(async () => {
    setLoadingGigs(true);
    try {
      const res = await managerApi.getGigs(selectedDate);
      setGigs(res.data?.gigs || []);
    } catch (err) {
      console.error("Failed to load gigs", err);
    } finally {
      setLoadingGigs(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadIncentives();
    loadGigs();
  }, [loadIncentives, loadGigs]);

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm("Are you sure you want to delete this gig incentive?")) return;
    try {
      const res = await managerApi.deleteGig(gigId);
      showToast(res.data?.message || "Gig incentive deleted");
      await loadGigs();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete gig");
    }
  };

  const summary = data?.summary || {
    totalOrders: 0,
    totalEarnings: 0,
    totalTargetBonusEarned: 0,
    totalRidersWithEarnings: 0,
  };

  const riders = data?.perRiderBreakdown || [];

  return (
    <PageShell>
      {toast && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-2.5 text-xs font-bold text-amber-800 shadow-xs flex items-center gap-2">
          <span>🔥</span>
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* SINGLE COMPACT TOP ROW: DATE FILTER + 4 STAT CARDS + CREATE GIG ACTION */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6 items-stretch">
        {/* CARD 1: DATE FILTER */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Filter Date</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
          />
        </div>

        {/* CARD 2: TOTAL RIDER EARNINGS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rider Earnings</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-black text-slate-900">₹{(summary.totalEarnings || 0).toLocaleString()}</span>
            <span className="text-[10px] font-medium text-emerald-600">(All Riders)</span>
          </div>
        </div>

        {/* CARD 3: TOTAL BONUS PAYOUTS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bonus Payouts</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-black text-amber-600">₹{(summary.totalTargetBonusEarned || 0).toLocaleString()}</span>
            <span className="text-[10px] font-medium text-amber-600">(Rewards)</span>
          </div>
        </div>

        {/* CARD 4: TOTAL ORDERS FULFILLED */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orders Fulfilled</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-black text-blue-600">{summary.totalOrders || 0}</span>
            <span className="text-[10px] font-medium text-slate-400">(Deliveries)</span>
          </div>
        </div>

        {/* CARD 5: ACTIVE EARNING RIDERS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Riders</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-black text-purple-600">{summary.totalRidersWithEarnings || 0}</span>
            <span className="text-[10px] font-medium text-slate-400">(With Bonuses)</span>
          </div>
        </div>

        {/* CARD 6: CREATE GIG ACTION */}
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actions</p>
          <Link
            to="/incentives/create"
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition active:scale-98 whitespace-nowrap"
          >
            <span>+ Create Gig</span>
          </Link>
        </div>
      </div>

      {/* STORE GIGS TABLE CONTAINER */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        {loadingGigs ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400">Loading store gigs...</div>
        ) : gigs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <p className="text-2xl">🎁</p>
            <p className="text-xs font-bold text-slate-600">No active store gigs created for {selectedDate}.</p>
            <p className="text-[11px] text-slate-400">Click "+ Create Gig" above to add peak hour bonuses or target earnings incentives.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-white text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-2">GIG / INCENTIVE TITLE</th>
                  <th className="px-5 py-2">TYPE</th>
                  <th className="px-5 py-2">DATE & TIME WINDOW</th>
                  <th className="px-5 py-2">TARGET / CONDITION</th>
                  <th className="px-5 py-2">BONUS AMOUNT</th>
                  <th className="px-5 py-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gigs.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {g.title}
                      {g.description && <p className="text-[11px] font-normal text-slate-400 mt-0.5">{g.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                        g.type === "hours_bonus"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {g.type === "hours_bonus" ? "⏳ Peak Hours Bonus" : "💰 Target Earnings Bonus"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {g.dateString} <span className="text-slate-400 font-normal">({g.startTime} – {g.endTime})</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {g.tiers && g.tiers.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {g.tiers.map((t, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                              <span className="text-slate-400">Slab {i + 1}:</span>
                              <span>{g.type === "hours_bonus" ? `${t.minTarget} hrs` : `₹${t.minTarget}`}</span>
                              <span className="text-emerald-600">➔ +₹{t.bonusAmount}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        g.type === "hours_bonus" ? `Work ${g.targetHours} hrs during shift` : `Earn ₹${g.targetEarnings} in window`
                      )}
                    </td>
                    <td className="px-5 py-4 font-black text-emerald-600 text-sm">
                      Up to +₹{g.bonusAmount}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteGig(g.id)}
                        className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        Delete
                      </button>
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