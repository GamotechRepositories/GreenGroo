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
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await managerApi.createRider(form);
      setMessage(res.data?.message || "Delivery boy created");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create delivery boy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Total Drivers" subtitle={`Approved riders · ${manager?.area}`}>
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl bg-white p-5 shadow-sm md:grid-cols-4"
      >
        <h2 className="md:col-span-4 text-base font-bold text-gray-900">
          Create delivery boy login
        </h2>
        <input
          name="name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <input
          name="phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="Phone"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="Temp password"
          minLength={6}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-primary px-4 py-2 text-sm font-semibold text-white hover:bg-green-active disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
        <p className="md:col-span-4 text-xs text-gray-500">
          New riders are linked to your area and stay pending until you verify them under
          New Driver Verify.
        </p>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          Approved drivers ({riders.length})
        </h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading drivers…</p>
      ) : riders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No approved drivers in this area yet. Check New Driver Verify for pending joins.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {riders.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{r.name || "Rider"}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.status === "online"
                      ? "bg-green-light text-green-primary"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{r.phone}</p>
              <p className="mt-1 text-xs text-gray-400">
                {r.vehicleType || "vehicle n/a"} · {r.area}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
