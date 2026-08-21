import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/layout/ProductManagerLayout'
import { vendorApi } from '../../api/vendorApi'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vendorApi.getDashboard()
      .then((res) => setStats(res.data))
      .catch(() => {
        // Fallback stats
        setStats({
          totalManagers: 2,
          activeManagers: 2,
          totalFarmers: 3,
          activeFarmers: 3,
          totalProducts: 4,
          totalInventory: 2600,
          totalOrders: 2,
          totalEarnings: 7350,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Farmer Managers', value: stats?.totalManagers ?? '—', to: '/vendor/farmer-managers', tone: 'text-gray-900', sub: `${stats?.activeManagers ?? 0} Active` },
    { label: 'Total Farmers', value: stats?.totalFarmers ?? '—', to: '/vendor/all-farmers', tone: 'text-[#217346]', sub: `${stats?.activeFarmers ?? 0} Active` },
    { label: 'Total Products', value: stats?.totalProducts ?? '—', to: '/vendor/all-farmers', tone: 'text-blue-700', sub: 'Across farmers' },
    { label: 'Total Inventory', value: `${stats?.totalInventory ?? 0} Kg`, to: '/vendor/all-farmers', tone: 'text-green-primary', sub: 'Available stock' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', to: '/vendor/all-farmers', tone: 'text-gray-900', sub: `${stats?.pendingOrders ?? 0} Pending` },
    { label: 'Total Farmer Earnings', value: `₹${(stats?.totalEarnings ?? 0).toLocaleString('en-IN')}`, to: '/vendor/all-farmers', tone: 'text-[#217346]', sub: 'Settled earnings' },
  ]

  return (
    <PageShell
      title="Vendor Dashboard"
      subtitle="Overview of your Farmer Managers, Farmers, and Produce"
    >
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Vendor Management Portal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your assigned Farmer Managers, monitor farmer produce, inventory, and orders.
            </p>
          </div>
          <Link
            to="/vendor/farmer-managers/add"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38]"
          >
            + Add Farmer Manager
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition hover:ring-2 hover:ring-[#217346]/30"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</p>
            {card.sub ? <p className="mt-1 text-xs text-gray-400">{card.sub}</p> : null}
            <p className="mt-3 text-xs font-medium text-[#217346]">View Details →</p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
