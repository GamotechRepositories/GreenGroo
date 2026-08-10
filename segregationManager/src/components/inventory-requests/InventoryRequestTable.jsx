import { STATUS_STYLES } from '../../data/inventoryRequests'
import InventoryRequestRow from './InventoryRequestRow'

export default function InventoryRequestTable({ requests }) {
  return (
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
          {requests.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                No requests in this tab yet.
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <InventoryRequestRow
                key={request.id}
                request={request}
                statusStyles={STATUS_STYLES}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
