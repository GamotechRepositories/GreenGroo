import { useState, useEffect } from "react";
import { getMyRewardPoints, getRewardSettings } from "../../api/api";

export default function RewardPointsModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("passbook"); // "passbook" | "terms"
  const [loading, setLoading] = useState(true);
  const [rewardData, setRewardData] = useState({
    points: 0,
    monetaryValue: 0,
    pointValueInRupees: 1.0,
    totalEarned: 0,
    totalSpent: 0,
    settings: null,
    data: [], // transactions
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const loadPoints = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getMyRewardPoints({ page, limit: 10 });
      setRewardData(data.data);
    } catch {
      // Fallback: fetch public settings if user has no transactions yet
      try {
        const { data: publicRes } = await getRewardSettings();
        setRewardData((prev) => ({
          ...prev,
          settings: publicRes.data,
        }));
      } catch (e) {
        console.error("Failed to load reward points:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPoints(1);
    }
  }, [open]);

  if (!open) return null;

  const points = rewardData.points || 0;
  const monetaryValue = rewardData.monetaryValue || (points * (rewardData.pointValueInRupees || 1.0));
  const settings = rewardData.settings || {};
  const terms = settings.termsAndConditions || [
    "Earn 10 Reward Points for every ₹100 spent on successful orders.",
    "1 Reward Point is equivalent to ₹1.00 discount on future orders.",
    "A minimum of 10 points is required to start redeeming.",
    "You can pay up to 50% of your cart subtotal using reward points per order.",
    "Reward points are credited automatically once your order is confirmed.",
    "If an order is cancelled or refunded, any reward points used will be restored, and points earned on that order will be revoked.",
    "Reward points are non-transferable and cannot be exchanged for cash.",
    "GreenGrocc reserves the right to modify or terminate the reward points program terms at any time.",
  ];

  const transactions = rewardData.data || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:px-4 animate-fade-in">
      <button
        type="button"
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        {/* Modal Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg shadow-sm">
              🪙
            </span>
            <div>
              <h3 className="text-base font-bold text-text-primary">GreenGrocc Rewards</h3>
              <p className="text-[11px] text-text-secondary">Earn points on every purchase & save</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {/* Balance Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-600 p-5 text-white shadow-lg shadow-emerald-700/20">
            {/* Decorative background glow */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                  <span>⭐</span> Active Points Balance
                </span>
                <span className="text-[11px] font-semibold text-emerald-100">
                  1 pt = ₹{(rewardData.pointValueInRupees || 1.0).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">
                  {points.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-semibold text-emerald-100">Points</span>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs">
                <span className="text-emerald-100">Discount Value:</span>
                <span className="font-bold text-yellow-300 text-sm">
                  ₹{Number(monetaryValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Earning Rate Banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3.5 text-amber-900">
            <span className="text-2xl">✨</span>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-bold">
                Earn {settings.earningRate?.pointsEarned || 10} Points on every ₹{settings.earningRate?.spendAmount || 100} spent!
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Redeem instantly on checkout for direct discounts on your groceries.
              </p>
            </div>
          </div>

          {/* Tabs: Passbook vs Terms & Conditions */}
          <div className="flex rounded-xl bg-mobile-surface p-1 border border-border-light">
            <button
              type="button"
              onClick={() => setActiveTab("passbook")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === "passbook"
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Points History ({rewardData.total || transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === "terms"
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Terms & Conditions
            </button>
          </div>

          {/* Tab 1: Passbook List */}
          {activeTab === "passbook" && (
            <div className="space-y-3">
              {/* Lifetime Stats */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border-light bg-white p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Earned</p>
                  <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                    +{rewardData.totalEarned || 0} pts
                  </p>
                </div>
                <div className="rounded-xl border border-border-light bg-white p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Redeemed</p>
                  <p className="text-sm font-extrabold text-text-primary mt-0.5">
                    -{rewardData.totalSpent || 0} pts
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-xs text-text-muted">
                  Loading reward transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-2xl border border-border-light bg-white p-8 text-center">
                  <span className="text-3xl block mb-2">🎁</span>
                  <p className="text-sm font-bold text-text-primary">No transactions yet</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Place your first order to start collecting reward points!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-light rounded-2xl border border-border-light bg-white overflow-hidden">
                  {transactions.map((tx) => {
                    const isPositive = tx.points > 0;
                    return (
                      <div key={tx._id} className="flex items-center justify-between p-3.5 hover:bg-mobile-surface/40 transition">
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                tx.type === "earned"
                                  ? "bg-amber-100 text-amber-800"
                                  : tx.type === "redeemed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.type === "refunded"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {tx.type}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-text-primary truncate">
                            {tx.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-extrabold ${
                              isPositive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isPositive ? `+${tx.points}` : tx.points}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            Bal: {tx.balanceAfter} pts
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Terms & Conditions */}
          {activeTab === "terms" && (
            <div className="rounded-2xl border border-border-light bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Reward Program Rules & T&C
              </h4>
              <ul className="space-y-2.5 text-xs leading-relaxed text-text-secondary">
                {terms.map((term, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="flex-1">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 border-t border-border-light p-4 bg-mobile-surface/60 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
