import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";

const EMPTY = { name: "", phone: "", password: "" };

export default function DriversPage() {
  const { manager } = useAuth();
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      setMessage(res.data?.message || "Delivery partner created successfully!");
      setForm(EMPTY);
      setIsCreateOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create delivery partner");
    } finally {
      setSubmitting(false);
    }
  };

  const onlineCount = riders.filter((r) => r.status === "online").length;
  const offlineCount = Math.max(0, riders.length - onlineCount);

  return (
    <PageShell>
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 shadow-xs flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      ) : null}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* SINGLE COMPACT TOP ROW: ONLINE COUNT + OFFLINE COUNT + TOTAL COUNT + ACTION */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* CARD 1: ONLINE DRIVERS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Online Drivers Today</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-base font-black text-emerald-600">{onlineCount}</span>
            <span className="text-[10px] font-medium text-emerald-600">(Active Now)</span>
          </div>
        </div>

        {/* CARD 2: OFFLINE DRIVERS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offline Drivers Today</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-base font-black text-slate-700">{offlineCount}</span>
            <span className="text-[10px] font-medium text-slate-400">(Inactive)</span>
          </div>
        </div>

        {/* CARD 3: TOTAL APPROVED DRIVERS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Approved Roster</p>
          <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-base font-black text-slate-900">{riders.length}</span>
            <span className="text-[10px] font-medium text-slate-400">(Bound to Hub)</span>
          </div>
        </div>

        {/* CARD 4: ACTIONS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actions</p>
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition active:scale-98 whitespace-nowrap"
          >
            <span>{isCreateOpen ? "✕ Close Form" : "+ Create Delivery Partner"}</span>
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE DRIVER CREATION DROPDOWN FORM */}
      {isCreateOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Delivery Partner Account</h3>
              <p className="text-[11px] text-slate-500">Register new rider credentials bound to {manager?.area || "Dark Store Hub"}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mobile Number
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                {submitting ? "Creating Credentials…" : "Create Partner Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DRIVER ROSTER TABLE */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : riders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <h3 className="text-base font-bold text-slate-800">No Approved Drivers</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No delivery partners approved for this location yet. Click "+ Create Delivery Partner" above to register credentials.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2 px-5">Driver Name</th>
                <th className="py-2 px-5">Mobile Phone</th>
                <th className="py-2 px-5">Vehicle Type</th>
                <th className="py-2 px-5">Hub / Area</th>
                <th className="py-2 px-5">Online Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riders.map((r) => {
                const isOnline = r.status === "online";
                return (
                  <tr key={r.id || r._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span>{r.name || "Delivery Partner"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {r.phone}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.vehicleType || "Scooter"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {r.area || manager?.area || "Hub"}
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
                        {isOnline ? "ONLINE" : (r.status || "OFFLINE").toUpperCase()}
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
