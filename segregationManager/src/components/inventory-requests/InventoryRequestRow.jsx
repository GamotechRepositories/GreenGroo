export default function InventoryRequestRow({ request, statusStyles }) {
  return (
    <tr className="hover:bg-gray-50/80">
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
  )
}
