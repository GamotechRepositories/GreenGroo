import { Link } from 'react-router-dom'
import { PageShell } from '../../components/layout/ProductManagerLayout'

const cards = [
  { label: 'Incoming products', value: '24', to: '/incoming-products', tone: 'text-gray-900' },
  { label: 'Pending inspection', value: '8', to: '/quality-inspection', tone: 'text-orange-600' },
  { label: 'Inventory requests', value: '5', to: '/inventory-requests', tone: 'text-blue-700' },
  { label: 'Ready to sell', value: '142', to: '/inventory/ready-to-sell', tone: 'text-green-primary' },
  { label: 'Under processing', value: '31', to: '/inventory/under-processing', tone: 'text-gray-900' },
  { label: 'Low stock alerts', value: '12', to: '/inventory', tone: 'text-red-600' },
]

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Product segregation & inventory overview"
    >
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Product Segregation Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor incoming produce, grading, inventory status, and store requests from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-green-primary/30"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</p>
            <p className="mt-2 text-xs font-medium text-green-primary">Open →</p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
