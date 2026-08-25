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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/inventory-requests"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
        >
          <p className="text-sm text-amber-800">Pending restock requests</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{loading ? "…" : pending.length}</p>
          <p className="mt-1 text-xs text-amber-700">Waiting on Product Manager approval</p>
        </Link>
        <Link to="/inventory-requests" className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">All requests</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{loading ? "…" : requests.length}</p>
          <p className="mt-1 text-xs text-gray-400">From every dark store</p>
        </Link>
        <Link
          to="/inventory-requests"
          className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-gray-500">Approved</p>
          <p className="mt-1 text-3xl font-bold text-[#217346]">{loading ? "…" : approvedToday}</p>
          <p className="mt-1 text-xs text-gray-400">Stock added to the requesting store</p>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Dark store restock requests</h2>
            <p className="text-sm text-gray-500">
              Approve to add quantity to that store’s inventory
            </p>
          </div>
          <Link
            to="/inventory-requests"
            className="text-sm font-semibold text-[#217346] hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
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
