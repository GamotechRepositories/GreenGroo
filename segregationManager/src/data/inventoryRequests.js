export const INVENTORY_REQUEST_TABS = [
  { id: 'all', label: 'All Requests' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

export const INVENTORY_REQUESTS = [
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

export const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-green-50 text-green-700 ring-green-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
}
