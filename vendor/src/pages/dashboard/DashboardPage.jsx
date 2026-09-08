import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ProductManagerLayout";
import { staffApi } from "../../api/staffApi";

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function DashboardPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await staffApi.inventoryRequests();
      setRequests(res.data.requests || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load restock requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const pending = requests.filter((request) => request.status === "pending");
  const approvedToday = requests.filter((request) => request.status === "approved").length;

  const review = async (requestId, decision) => {
    setBusyId(`${requestId}-${decision}`);
    try {
      const res = await staffApi.reviewInventoryRequest(requestId, { decision });
      setToast(res.data.message || `Request ${decision}`);
      await load();
    } catch (err) {
      setToast(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId("");
      window.setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <PageShell
      title="Product Manager Dashboard"
      subtitle="Restock requests from dark stores appear here as soon as a Delivery Manager sends them"
    >
      {toast ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        <Link
          to="/inventory-requests"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm sm:p-5"
        >
          <p className="text-[11px] leading-tight text-amber-800 sm:text-sm">Pending restock</p>
          <p className="mt-1 text-2xl font-bold text-amber-900 sm:text-3xl">{loading ? "…" : pending.length}</p>
          <p className="mt-1 hidden text-xs text-amber-700 sm:block">Waiting on Product Manager approval</p>
        </Link>
        <Link to="/inventory-requests" className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
          <p className="text-[11px] leading-tight text-gray-500 sm:text-sm">All requests</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{loading ? "…" : requests.length}</p>
          <p className="mt-1 hidden text-xs text-gray-400 sm:block">From every dark store</p>
        </Link>
        <Link
          to="/inventory-requests"
          className="col-span-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:col-span-1 sm:p-5"
        >
          <p className="text-[11px] leading-tight text-gray-500 sm:text-sm">Approved</p>
          <p className="mt-1 text-2xl font-bold text-[#217346] sm:text-3xl">{loading ? "…" : approvedToday}</p>
          <p className="mt-1 hidden text-xs text-gray-400 sm:block">Stock added to the requesting store</p>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 sm:text-base">Dark store restock requests</h2>
            <p className="hidden text-sm text-gray-500 sm:block">
              Approve to add quantity to that store’s inventory
            </p>
          </div>
          <Link
            to="/inventory-requests"
            className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm"
          >
            View all
          </Link>
        </div>

        <div className="divide-y divide-gray-100 lg:hidden">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Loading restock requests…</p>
          ) : pending.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No pending requests from dark stores yet.</p>
          ) : (
            pending.map((request) => (
              <article key={request.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] font-semibold text-gray-900">{request.productName}</p>
                  <p className="shrink-0 text-[12px] font-bold text-gray-800">
                    {request.quantity} {request.unit}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">
                  {request.storeName}
                  {request.managerName ? ` · ${request.managerName}` : ""}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-gray-400">{request.requestNumber}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => review(request.id, "approved")}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[#217346] text-[11px] font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === `${request.id}-approved` ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => review(request.id, "rejected")}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 disabled:opacity-50"
                  >
                    {busyId === `${request.id}-rejected` ? "…" : "Reject"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Dark store</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading restock requests…
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No pending requests from dark stores yet.
                  </td>
                </tr>
              ) : (
                pending.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-4 font-medium text-gray-900">{request.requestNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{request.storeName}</p>
                      <p className="text-xs text-gray-500">
                        {request.managerName}
                        {request.area ? ` · ${request.area}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800">{request.productName}</p>
                      <p className="text-xs font-mono text-gray-400">{request.sku}</p>
                      {request.note ? (
                        <p className="mt-1 text-xs text-gray-500">{request.note}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {request.quantity} {request.unit}
                      <p className="text-xs text-gray-400">had {request.currentStock}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatWhen(request.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => review(request.id, "approved")}
                          className="rounded-lg bg-[#217346] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a5c38] disabled:opacity-50"
                        >
                          {busyId === `${request.id}-approved` ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => review(request.id, "rejected")}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {busyId === `${request.id}-rejected` ? "…" : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
