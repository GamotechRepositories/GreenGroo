import { useState, useEffect } from "react";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

const EMPTY_RULE = {
  ruleName: "Standard Full-Time Rule",
  attendanceStartTime: "09:00 AM",
  attendanceEndTime: "06:00 PM",
  requireLocationValidation: true,
  attendanceRadiusMeters: 200,
  minimumAttendanceDays: 26,
  notes: "",
};

export default function FullTimeRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_RULE);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await managerApi.getFullTimeRules();
      setRules(res.data?.rules || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await managerApi.createFullTimeRule({
        ...form,
        attendanceRadiusMeters: Number(form.attendanceRadiusMeters),
        minimumAttendanceDays: Number(form.minimumAttendanceDays),
      });
      setMessage("Full-Time rule created successfully!");
      setForm(EMPTY_RULE);
      setIsCreateOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await managerApi.deleteFullTimeRule(id);
      setMessage("Rule deleted.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete rule");
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

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Full-Time Attendance Rules</h2>
          <p className="text-[11px] text-slate-500">Configure attendance requirements for Full-Time drivers.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          {isCreateOpen ? "✕ Close Form" : "+ Create Rule"}
        </button>
      </div>

      {/* Create Form */}
      {isCreateOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">New Attendance Rule</h3>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rule Name</label>
                <input
                  value={form.ruleName}
                  onChange={(e) => setForm((p) => ({ ...p, ruleName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Attendance Radius (meters)</label>
                <input
                  type="number"
                  min="50"
                  value={form.attendanceRadiusMeters}
                  onChange={(e) => setForm((p) => ({ ...p, attendanceRadiusMeters: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start Time</label>
                <input
                  value={form.attendanceStartTime}
                  onChange={(e) => setForm((p) => ({ ...p, attendanceStartTime: e.target.value }))}
                  placeholder="e.g. 09:00 AM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">End Time</label>
                <input
                  value={form.attendanceEndTime}
                  onChange={(e) => setForm((p) => ({ ...p, attendanceEndTime: e.target.value }))}
                  placeholder="e.g. 06:00 PM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Minimum Attendance Days / Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.minimumAttendanceDays}
                  onChange={(e) => setForm((p) => ({ ...p, minimumAttendanceDays: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="reqLoc"
                  checked={form.requireLocationValidation}
                  onChange={(e) => setForm((p) => ({ ...p, requireLocationValidation: e.target.checked }))}
                  className="accent-emerald-600 h-4 w-4"
                />
                <label htmlFor="reqLoc" className="text-xs font-bold text-slate-700">Require Location Validation</label>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {submitting ? "Creating…" : "Create Rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="h-40 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-xs">
          <p className="text-sm font-bold text-slate-700">No rules configured yet</p>
          <p className="mt-1 text-xs text-slate-400">Click &quot;+ Create Rule&quot; to add attendance requirements for Full-Time drivers.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2 px-4">Rule Name</th>
                <th className="py-2 px-4">Hours</th>
                <th className="py-2 px-4">Radius (m)</th>
                <th className="py-2 px-4">Location Check</th>
                <th className="py-2 px-4">Min Days</th>
                <th className="py-2 px-4">Notes</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule._id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{rule.ruleName}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {rule.attendanceStartTime} – {rule.attendanceEndTime}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{rule.attendanceRadiusMeters}m</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${rule.requireLocationValidation ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {rule.requireLocationValidation ? "Required" : "Optional"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{rule.minimumAttendanceDays} days</td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-[160px] truncate">{rule.notes || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(rule._id)}
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
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
    </PageShell>
  );
}
