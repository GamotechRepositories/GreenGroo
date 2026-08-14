import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

const EMPTY = { name: "", phone: "", password: "" };

export default function DriversPage() {
  const { manager } = useAuth();
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await managerApi.riders();
      setRiders(res.data.riders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await managerApi.createRider(form);
      setMessage(res.data?.message || "Delivery partner login created successfully!");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create delivery partner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Approved Delivery Partners"
      subtitle={`Manage online riders & create account credentials for ${manager?.area || "Store Location"}`}
    >
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-xs flex items-center gap-3">
          <span>✅</span>
          <span>{message}</span>
        </div>
      ) : null}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Driver Registration Form */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
            <Icon name="user" size="sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Create Delivery Partner Account</h2>
            <p className="text-xs text-slate-500">Register new rider credentials bound to this dark store hub</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mobile Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Min 6 characters"
              minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            ℹ️ Rider account will be auto-linked to <strong>{manager?.area}</strong>. After creation, approve documents under <strong>Driver Verification</strong>.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition active:scale-95"
          >
            {submitting ? "Creating Credentials…" : "Create Partner Account"}
          </button>
        </div>
      </form>

      {/* Driver Roster Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900">
            Active Store Drivers ({riders.length})
          </h2>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
            {riders.filter((r) => r.status === "online").length} Online Now
          </span>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          🔄 Refresh Roster
        </button>
      </div>

      {/* Driver Roster Table */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : riders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <p className="text-3xl mb-2">🛵</p>
          <h3 className="text-base font-bold text-slate-800">No Approved Drivers</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No delivery partners approved for this location yet. Create an account above or check Driver Verification.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Driver Name</th>
                <th className="py-3.5 px-4">Mobile Phone</th>
                <th className="py-3.5 px-4">Vehicle Type</th>
                <th className="py-3.5 px-4">Hub / Area</th>
                <th className="py-3.5 px-4">Online Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riders.map((r) => {
                const isOnline = r.status === "online";
                return (
                  <tr key={r.id || r._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🛵</span>
                        <span>{r.name || "Delivery Partner"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      📞 {r.phone}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.vehicleType || "Scooter"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      📍 {r.area || manager?.area || "Hub"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                          isOnline
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {isOnline ? "ONLINE 🟢" : (r.status || "OFFLINE").toUpperCase()}
                      </span>
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
