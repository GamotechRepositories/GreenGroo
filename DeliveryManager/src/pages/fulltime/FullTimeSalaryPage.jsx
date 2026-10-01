import { useState, useEffect } from "react";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function FullTimeSalaryPage() {
  const [salary, setSalary] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await managerApi.getFullTimeConfig();
        const val = res.data?.fullTimeMonthlySalary ?? 0;
        setSalary(val);
        setInputValue(String(val));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load salary config");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await managerApi.setFullTimeConfig({ fullTimeMonthlySalary: Number(inputValue) });
      const updated = res.data?.fullTimeMonthlySalary ?? Number(inputValue);
      setSalary(updated);
      setInputValue(String(updated));
      setMessage(res.data?.message || "Monthly salary updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update salary");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 shadow-xs flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Current Salary Stat Card */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Monthly Salary</p>
          {loading ? (
            <div className="mt-1 h-6 w-24 rounded bg-slate-200 animate-pulse" />
          ) : (
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">₹{salary.toLocaleString("en-IN")}</span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applies To</p>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Full-Time Drivers
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            This salary is shown to all Full-Time riders in their app.
          </p>
        </div>
      </div>

      {/* Update Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Update Monthly Salary</h3>
        <p className="text-[11px] text-slate-500 mb-4">
          Set the fixed monthly salary for all Full-Time delivery partners in your hub.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Monthly Salary (₹)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting || loading}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {submitting ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
