import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'
import { Icon } from '../../components/ui/Icon'

const stats = [
  {
    label: "Today's Earnings",
    value: '₹1,450',
    change: '12% from yesterday',
    trend: true,
    cardBg: 'bg-green-light/60',
    iconBg: 'bg-green-light',
    iconColor: 'text-green-primary',
    icon: 'bag',
  },
  {
    label: 'Completed Orders',
    value: '5',
    change: '2 from yesterday',
    trend: true,
    cardBg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: 'clipboard',
  },
  {
    label: 'Online Hours',
    value: '2h 45m',
    change: 'Today',
    trend: false,
    cardBg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: 'clock',
  },
  {
    label: 'Ratings',
    value: '4.8',
    change: 'Excellent',
    trend: false,
    cardBg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: 'star',
  },
]

const newOrders = [
  { id: 1, store: 'GreenMart Store', address: '123 Main Street, Downtown', distance: '2.4 km away', price: '₹120' },
  { id: 2, store: 'Fresh Foods', address: '456 Oak Avenue, Midtown', distance: '1.8 km away', price: '₹95' },
  { id: 3, store: 'Quick Shop', address: '789 Pine Road, Uptown', distance: '3.2 km away', price: '₹150' },
]

const chartData = [
  { day: 'Mon', height: '40%', active: false },
  { day: 'Tue', height: '55%', active: false },
  { day: 'Wed', height: '45%', active: false },
  { day: 'Thu', height: '70%', active: false },
  { day: 'Fri', height: '85%', active: true },
  { day: 'Sat', height: '60%', active: false },
  { day: 'Sun', height: '75%', active: false },
]

const notifications = [
  { title: 'New order is available', time: '2 min ago', icon: 'bag', iconBg: 'bg-green-light', iconColor: 'text-green-primary' },
  { title: 'Incentive Unlocked!', time: '1 hour ago', icon: 'gift', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { title: 'Order Completed', time: '3 hours ago', icon: 'check', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
]

function StatCard({ stat }) {
  return (
    <div className={`rounded-xl p-5 shadow-sm ${stat.cardBg}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className={`mt-1 text-xs ${stat.trend ? 'text-green-primary' : 'text-gray-500'}`}>
            {stat.trend ? `▲ ${stat.change}` : stat.change}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
          <Icon name={stat.icon} size="lg" />
        </div>
      </div>
    </div>
  )
}

function CardTitle({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-gray-900">{children}</h2>
      {action && (
        <button type="button" className="text-sm font-medium text-green-primary hover:underline">
          {action}
        </button>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Header />

        <main className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
              <CardTitle action="View all">New Orders (3)</CardTitle>
              <div className="space-y-3">
                {newOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-primary text-sm font-bold text-white">
                      {order.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{order.store}</p>
                        <span className="rounded bg-green-light px-2 py-0.5 text-[10px] font-semibold text-green-primary">
                          New
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-500">{order.address}</p>
                      <p className="text-xs text-gray-400">{order.distance}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-sm font-bold text-gray-900">{order.price}</p>
                      <button
                        type="button"
                        className="rounded-lg border border-green-primary px-4 py-1.5 text-sm font-semibold text-green-primary hover:bg-green-light"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <CardTitle>Today&apos;s Performance</CardTitle>
              <div className="flex flex-col items-center py-2">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#10893e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="39.6"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                    <p className="text-xs text-gray-500">Excellent</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-gray-500">
                  You are doing great! Keep delivering smiles 😊
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <CardTitle action="View details">Active Delivery</CardTitle>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">#GR124578</span>
                <span className="text-base font-bold text-green-primary">₹180</span>
              </div>
              <div className="relative space-y-5 pl-6">
                <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-gray-200" />
                <div className="relative flex gap-4">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-green-primary bg-white" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-green-primary">Pick Up</p>
                    <p className="text-sm font-semibold text-gray-900">Super Store</p>
                    <p className="text-sm text-gray-500">123 Market Street</p>
                  </div>
                </div>
                <div className="relative flex gap-4">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-green-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-green-primary">Drop Off</p>
                    <p className="text-sm font-semibold text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-500">456 Residential Area</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-dark py-3 text-sm font-semibold text-white hover:bg-green-primary"
              >
                <Icon name="mapPin" size="md" />
                Navigate
              </button>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <CardTitle action="View full map">Live Map</CardTitle>
              <div className="relative h-56 overflow-hidden rounded-xl bg-gradient-to-br from-green-light/40 via-blue-50 to-green-light/60">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 224" preserveAspectRatio="none">
                  <path
                    d="M60 180 Q120 140 180 120 T340 60"
                    fill="none"
                    stroke="#10893e"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                </svg>
                <div className="absolute bottom-14 left-10 flex h-7 w-7 items-center justify-center rounded-full bg-green-primary shadow-md">
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                </div>
                <div className="absolute right-14 top-12 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-md">
                  <Icon name="mapPin" size="sm" className="text-white" />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md">
                  <Icon name="scooter" size="md" className="text-green-primary" />
                </div>
                <div className="absolute inset-0 opacity-15">
                  <div className="grid h-full w-full grid-cols-6 grid-rows-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border border-gray-300" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Earnings Overview</h2>
                <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600">
                  <option>This Week</option>
                </select>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹7,850</p>
              <p className="text-sm text-green-primary">▲ 18% from last week</p>
              <div className="mt-5 flex items-end justify-between gap-2" style={{ height: '100px' }}>
                {chartData.map((bar) => (
                  <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-md ${bar.active ? 'bg-green-primary' : 'bg-green-primary/25'}`}
                      style={{ height: bar.height }}
                    />
                    <span className="text-xs text-gray-500">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-5 text-center shadow-sm">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-primary">
                <Icon name="trophy" size="xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹300</p>
              <p className="mt-1 text-sm text-gray-500">You have earned extra incentives</p>
              <button
                type="button"
                className="mt-4 rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                See Details
              </button>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <CardTitle>Notifications</CardTitle>
              <div className="space-y-4">
                {notifications.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor}`}>
                      <Icon name={item.icon} size="sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-green-banner p-5 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-primary">
                <Icon name="scooter" size="xl" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Deliver Safe, Earn More</p>
                <p className="text-sm text-gray-600">
                  Follow all safety guidelines and keep your ratings high!
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-green-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-primary"
            >
              Safety Guidelines
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
