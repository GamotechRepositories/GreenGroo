import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ManagerLayout";
import { managerApi } from "../../api/managerApi";

const getTodayString = () => new Date().toISOString().slice(0, 10);

export default function CreateGigPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Gig form state
  const [gigTitle, setGigTitle] = useState("");
  const [gigType, setGigType] = useState("earnings_target");
  const [gigDate, setGigDate] = useState(getTodayString());
  const [gigStartTime, setGigStartTime] = useState("05:00 PM");
  const [gigEndTime, setGigEndTime] = useState("07:00 PM");
  const [gigTargetHours, setGigTargetHours] = useState(2);
  const [gigTargetEarnings, setGigTargetEarnings] = useState(200);
  const [gigBonusAmount, setGigBonusAmount] = useState(18);
  const [gigDescription, setGigDescription] = useState("");
  const [gigTiers, setGigTiers] = useState([
    { minTarget: 200, bonusAmount: 18 },
    { minTarget: 400, bonusAmount: 60 },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const addGigTierRow = () => {
    if (gigTiers.length >= 5) {
      showToast("Maximum 5 incentive slabs allowed");
      return;
    }
    const lastTarget = gigTiers.length > 0 ? gigTiers[gigTiers.length - 1].minTarget : 200;
    const lastBonus = gigTiers.length > 0 ? gigTiers[gigTiers.length - 1].bonusAmount : 20;
    setGigTiers([
      ...gigTiers,
      { minTarget: lastTarget + 200, bonusAmount: lastBonus + 40 },
    ]);
  };

  const removeGigTierRow = (index) => {
    if (gigTiers.length <= 1) return;
    setGigTiers(gigTiers.filter((_, i) => i !== index));
  };

  const updateGigTierRow = (index, field, value) => {
    const updated = [...gigTiers];
    updated[index][field] = Number(value) || 0;
    setGigTiers(updated);
  };

  const handleCreateGig = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await managerApi.createGig({
        title: gigTitle,
        type: gigType,
        dateString: gigDate,
        startTime: gigStartTime,
        endTime: gigEndTime,
        targetHours: Number(gigTargetHours) || 3,
        targetEarnings: Number(gigTargetEarnings) || 500,
        bonusAmount: Number(gigBonusAmount) || 150,
        tiers: gigTiers,
        description: gigDescription,
      });

      showToast(res.data.message || "Gig incentive created successfully!");
      setTimeout(() => {
        navigate("/incentives");
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create gig");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center -mt-2 md:-mt-4 pb-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Create Store Gig / Driver Incentive</h2>
          <p className="text-xs text-slate-500 mt-0.5">Publish peak hour bonuses, target earnings, and tiered rewards</p>
        </div>

        {toast && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-3 text-xs font-bold text-amber-800 shadow-xs flex items-center gap-2">
            <span>🔥</span>
            <span>{toast}</span>
          </div>
        )}

        <form onSubmit={handleCreateGig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Gig Incentive Title
              </label>
              <input
                type="text"
                required
                value={gigTitle}
                onChange={(e) => setGigTitle(e.target.value)}
                placeholder="e.g. Evening Peak Rush Incentive"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Incentive Type
              </label>
              <select
                value={gigType}
                onChange={(e) => setGigType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                <option value="hours_bonus">⏳ Peak Hours Bonus (Hourly Shift Target)</option>
                <option value="earnings_target">💰 Target Earnings Bonus (Amount Target)</option>
                <option value="custom">🎯 Custom Tiered Slabs Target</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Active Date
              </label>
              <input
                type="date"
                required
                value={gigDate}
                onChange={(e) => setGigDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Start Time
              </label>
              <input
                type="text"
                required
                value={gigStartTime}
                onChange={(e) => setGigStartTime(e.target.value)}
                placeholder="05:00 PM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                End Time
              </label>
              <input
                type="text"
                required
                value={gigEndTime}
                onChange={(e) => setGigEndTime(e.target.value)}
                placeholder="09:00 PM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* TIERED INCENTIVE SLABS BUILDER (MULTIPLE TARGETS & INCENTIVES) */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>Incentive Slabs / Multiple Reward Tiers</span>
                </h4>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Add multiple targets and incentives (e.g. Earn ₹200 ➔ Bonus ₹18, Earn ₹400 ➔ Bonus ₹40, Earn ₹600 ➔ Bonus ₹60)
                </p>
              </div>
              <button
                type="button"
                onClick={addGigTierRow}
                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
              >
                + Add Tier Slab ({gigTiers.length}/5)
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {gigTiers.map((t, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs">
                  <span className="text-xs font-black text-emerald-800 w-16">Slab #{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        {gigType === "hours_bonus" ? "Target Hours (hrs)" : "Target Earnings Amount (₹)"}
                      </span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={t.minTarget}
                        onChange={(e) => updateGigTierRow(idx, "minTarget", e.target.value)}
                        placeholder={gigType === "hours_bonus" ? "2" : "200"}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                        Bonus Amount (₹)
                      </span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={t.bonusAmount}
                        onChange={(e) => updateGigTierRow(idx, "bonusAmount", e.target.value)}
                        placeholder="18"
                        className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {gigTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGigTierRow(idx)}
                      className="text-xs text-rose-600 font-bold p-2 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove Slab"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description / Notes for Drivers (Optional)
            </label>
            <textarea
              rows="3"
              value={gigDescription}
              onChange={(e) => setGigDescription(e.target.value)}
              placeholder="Explain gig details or conditions to delivery partners..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/incentives"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Publishing Gig..." : "Publish Store Gig & Incentive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
