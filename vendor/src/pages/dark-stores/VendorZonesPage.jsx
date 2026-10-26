import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const FIELD = "w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]";
const LABEL = "mb-1 block text-xs font-semibold text-gray-700";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

const EMPTY = { name: "", state: "Maharashtra", cities: "", description: "" };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function VendorZonesPage() {
  const [zones, setZones] = useState([]);
  const [requests, setRequests] = useState([]);
  const [unzoned, setUnzoned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getZones();
      setZones(res.data?.zones || []);
      setRequests(res.data?.requests || []);
      setUnzoned(res.data?.unzonedDarkStores || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitZone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await vendorApi.createZone(form);
      setForm(EMPTY);
      setShowForm(false);
      setNotice("Zone sent to admin for approval. It will be listed here once approved.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send zone request");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelZone = async (zone) => {
    if (!window.confirm(`Cancel the request for zone "${zone.name}"?`)) return;
    try {
      await vendorApi.cancelZone(zone.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel zone request");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Zones</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Create a zone, get it approved by admin, then request dark stores inside it. Each dark store also needs admin approval.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c37]"
        >
          {showForm ? "Close" : "+ Create Zone"}
        </button>
      </div>

      {notice ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</div> : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      {showForm ? (
        <form onSubmit={submitZone} className="space-y-3 border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">New Zone</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Zone Name *</label>
              <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pune West" maxLength={80} required />
            </div>
            <div>
              <label className={LABEL}>State *</label>
              <input className={FIELD} value={form.state} onChange={(e) => set("state", e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Cities covered</label>
              <input className={FIELD} value={form.cities} onChange={(e) => set("cities", e.target.value)} placeholder="Pune, Pimpri-Chinchwad (comma separated)" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Note for Admin</label>
              <textarea className={`${FIELD} min-h-[56px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Areas covered, expected demand, etc." maxLength={500} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
              {submitting ? "Sending…" : "Send for Approval"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 text-xs">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#217346]">Approved Zones ({zones.length})</h2>
            {zones.length === 0 ? (
              <p className="border border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-400">
                No approved zone yet. Create a zone and wait for admin approval before requesting dark stores.
              </p>
            ) : (
              zones.map((zone) => (
                <div key={zone.id} className="border border-gray-200 bg-white">
                  <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{zone.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {[zone.state, (zone.cities || []).join(", ")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Link
                      to={`/vendor/dark-stores/request?zone=${encodeURIComponent(zone.id)}`}
                      className="self-start border border-[#217346] px-3 py-1.5 text-[11px] font-semibold text-[#217346] hover:bg-emerald-50 sm:self-auto"
                    >
                      + Request Dark Store
                    </Link>
                  </div>
                  {zone.darkStores.length === 0 && zone.pendingStoreRequests.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-gray-400">No dark stores in this zone yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 text-xs">
                      {zone.darkStores.map((store) => (
                        <li key={store.id} className="flex items-center justify-between px-4 py-2">
                          <div>
                            <p className="font-semibold text-gray-900">{store.storeName}</p>
                            <p className="text-[10px] text-gray-400">{[store.area, store.city].filter(Boolean).join(", ")}</p>
                          </div>
                          <span className={store.isActive ? "font-semibold text-emerald-700" : "text-gray-400"}>
                            {store.isActive ? "Active" : "Inactive"}
                          </span>
                        </li>
                      ))}
                      {zone.pendingStoreRequests.map((request) => (
                        <li key={request.id} className="flex items-center justify-between px-4 py-2">
                          <div>
                            <p className="font-semibold text-gray-700">{request.storeName}</p>
                            <p className="text-[10px] text-gray-400">{[request.area, request.city].filter(Boolean).join(", ")}</p>
                          </div>
                          <span className={`border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES.Pending}`}>Waiting for approval</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
            {unzoned.length ? (
              <p className="text-[11px] text-gray-500">
                {unzoned.length} older dark store{unzoned.length === 1 ? " is" : "s are"} not linked to a zone. See{" "}
                <Link to="/vendor/dark-stores" className="font-semibold text-[#217346] hover:underline">My Dark Stores</Link>.
              </p>
            ) : null}
          </section>

          <section className="border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#217346]">
              Zone Requests ({requests.length}){pendingCount ? ` · ${pendingCount} waiting for approval` : ""}
            </h2>
            {requests.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">No zone requests sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Zone</th>
                      <th className="px-4 py-2">Cities</th>
                      <th className="px-4 py-2">Sent</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Admin remarks</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((zone) => (
                      <tr key={zone.id} className="border-t border-gray-100 align-top">
                        <td className="px-4 py-2">
                          <p className="font-semibold text-gray-900">{zone.name}</p>
                          <p className="text-[10px] text-gray-400">{zone.state}</p>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{(zone.cities || []).join(", ") || "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{formatDate(zone.createdAt)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[zone.status] || STATUS_STYLES.Cancelled}`}>
                            {zone.status === "Pending" ? "Waiting for approval" : zone.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{zone.adminRemarks || "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {zone.status === "Pending" ? (
                            <button type="button" onClick={() => cancelZone(zone)} className="text-[11px] font-semibold text-red-600 hover:underline">
                              Cancel
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
