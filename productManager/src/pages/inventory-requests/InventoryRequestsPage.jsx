import { useMemo, useState } from "react";
import { PageShell } from "../../components/layout/ProductManagerLayout";
import { staffApi } from "../../api/staffApi";
import { useInventoryRequests } from "../../hooks/useInventoryRequests";

const TABS = [
  { id: "all", label: "All Requests" },
  { id: "pending", label: "Pending Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-green-50 text-green-700 ring-green-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function InventoryRequestsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const { requests, loading, error, reload } = useInventoryRequests(8000);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");

  const filteredRequests = useMemo(() => {
    if (activeTab === "all") return requests;
    return requests.filter((request) => request.status === activeTab);
  }, [activeTab, requests]);

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const review = async (requestId, decision) => {
    setBusyId(`${requestId}-${decision}`);
    try {
      const res = await staffApi.reviewInventoryRequest(requestId, { decision });
      setToast(res.data.message || `Request ${decision}`);
      await reload();
    } catch (err) {
      setToast(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId("");
      setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <PageShell
      title="Inventory Requests"
      subtitle="Dark store restock requests appear here as soon as a Delivery Manager sends them"
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

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-green-primary bg-green-light/40 text-green-primary"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
                    {counts[tab.id]}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => reload()}
              className="mb-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Request ID</th>
                <th className="px-5 py-3 font-medium">Dark Store</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Requested</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    Loading requests…
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No dark-store restock requests in this tab yet. When a Delivery Manager taps Request Stock, it shows up here.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {request.requestNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{request.storeName}</p>
                      <p className="text-xs text-gray-500">
                        {request.managerName}
                        {request.area ? ` · ${request.area}` : ""}
                        {request.city ? `, ${request.city}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <p>{request.productName}</p>
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
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {request.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => review(request.id, "approved")}
                            className="rounded-lg bg-green-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-green-active disabled:opacity-50"
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
                      ) : (
                        <span className="text-xs text-gray-400">
                          {request.reviewNote || request.reviewedByName || "—"}
                        </span>
                      )}
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
