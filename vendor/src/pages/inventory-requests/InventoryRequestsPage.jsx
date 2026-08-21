import { useMemo, useState } from 'react'
import { PageShell } from '../../components/layout/ProductManagerLayout'

const TABS = [
  { id: 'all', label: 'All Requests' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const REQUESTS = [
  {
    id: 'REQ-1042',
    store: 'GreenRow Koramangala',
    manager: 'Ravi Kumar',
    product: 'Tomatoes — Grade A',
    quantity: '120 kg',
    requestedAt: '2026-08-10 09:15',
    status: 'pending',
    note: 'Restock for weekend demand',
  },
  {
    id: 'REQ-1041',
    store: 'GreenRow Indiranagar',
    manager: 'Priya Sharma',
    product: 'Spinach — Grade B',
    quantity: '45 kg',
    requestedAt: '2026-08-10 08:40',
    status: 'pending',
    note: 'Urgent — shelf running empty',
  },
  {
    id: 'REQ-1038',
    store: 'GreenRow Whitefield',
    manager: 'Anil Mehta',
    product: 'Carrots — Grade A',
    quantity: '80 kg',
    requestedAt: '2026-08-09 17:20',
    status: 'approved',
    note: 'Regular weekly replenishment',
  },
  {
    id: 'REQ-1035',
    store: 'GreenRow HSR Layout',
    manager: 'Sneha Reddy',
    product: 'Potatoes — Grade C',
    quantity: '200 kg',
    requestedAt: '2026-08-09 14:05',
    status: 'rejected',
    note: 'Insufficient Grade C stock available',
  },
  {
    id: 'REQ-1032',
    store: 'GreenRow Jayanagar',
    manager: 'Karthik N',
    product: 'Onions — Grade A',
    quantity: '150 kg',
    requestedAt: '2026-08-09 11:30',
    status: 'approved',
    note: 'Approved for dispatch tomorrow',
  },
]

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-green-50 text-green-700 ring-green-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
}

export default function InventoryRequestsPage() {
  const [activeTab, setActiveTab] = useState('all')

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return REQUESTS
    return REQUESTS.filter((request) => request.status === activeTab)
  }, [activeTab])

  const counts = useMemo(
    () => ({
      all: REQUESTS.length,
      pending: REQUESTS.filter((r) => r.status === 'pending').length,
      approved: REQUESTS.filter((r) => r.status === 'approved').length,
      rejected: REQUESTS.filter((r) => r.status === 'rejected').length,
    }),
    [],
  )

  return (
    <PageShell
      title="Inventory Requests"
      subtitle="Review and manage stock requests from delivery managers"
    >
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 pt-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-green-primary bg-green-light/40 text-green-primary'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Request ID</th>
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Requested</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No requests in this tab yet.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-4 font-medium text-gray-900">{request.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{request.store}</p>
                      <p className="text-xs text-gray-500">{request.manager}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{request.product}</td>
                    <td className="px-5 py-4 text-gray-700">{request.quantity}</td>
                    <td className="px-5 py-4 text-gray-500">{request.requestedAt}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-green-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-green-active"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{request.note}</span>
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
  )
}
