import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function VendorDarkStoresPage() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getDarkStoreRequests();
      setRequests(res.data?.requests || []);
      setStores(res.data?.darkStores || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dark stores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancelRequest = async (request) => {
    if (!window.confirm(`Cancel the request for "${request.storeName}"?`)) return;
    try {
      await vendorApi.cancelDarkStoreRequest(request.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel request");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Dark Stores</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Dark stores supplied by your collection centre. New dark stores need admin approval.
          </p>
        </div>
        <Link to="/vendor/dark-stores/request" className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white">
          + Request Dark Store
        </Link>
      </div>

      {location.state?.sent ? (
        <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Request sent to admin for approval. You will see the dark store here once it is approved.
        </div>
      ) : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <>
          <section className="border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#217346]">
              Approved Dark Stores ({stores.length})
            </h2>
            {stores.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">No approved dark store yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Store</th>
                      <th className="px-4 py-2">Location</th>
                      <th className="px-4 py-2">Manager</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-semibold text-gray-900">{store.storeName}</td>
                        <td className="px-4 py-2 text-gray-600">{[store.area, store.city, store.state].filter(Boolean).join(", ")}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {store.name || "—"}
                          <div className="text-[10px] text-gray-400">{[store.phone, store.email].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={store.isActive ? "font-semibold text-emerald-700" : "text-gray-400"}>
                            {store.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#217346]">
              My Requests ({requests.length}){pendingCount ? ` · ${pendingCount} waiting for approval` : ""}
            </h2>
            {requests.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">No requests sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Store</th>
                      <th className="px-4 py-2">Location</th>
                      <th className="px-4 py-2">Sent</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Admin remarks</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-t border-gray-100 align-top">
                        <td className="px-4 py-2">
                          <p className="font-semibold text-gray-900">{request.storeName}</p>
                          <p className="text-[10px] text-gray-400">{[request.managerName, request.phone].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{[request.area, request.city, request.state].filter(Boolean).join(", ")}</td>
                        <td className="px-4 py-2 text-gray-600">{formatDate(request.createdAt)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[request.status] || STATUS_STYLES.Cancelled}`}>
                            {request.status === "Pending" ? "Waiting for approval" : request.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{request.adminRemarks || "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {request.status === "Pending" ? (
                            <button type="button" onClick={() => cancelRequest(request)} className="text-[11px] font-semibold text-red-600 hover:underline">
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
