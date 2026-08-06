import { Icon, LogoIcon } from '../ui/Icon'

const navItems = [
  { label: 'Home', active: true, icon: 'home' },
  { label: 'New Orders', badge: 3, icon: 'orders' },
  { label: 'My Orders', icon: 'clipboard' },
  { label: 'Active Delivery', icon: 'truck' },
  { label: 'Earnings', icon: 'wallet' },
  { label: 'Wallet', icon: 'wallet' },
  { label: 'Incentives', icon: 'trophy' },
  { label: 'Attendance', icon: 'calendar' },
  { label: 'Performance', icon: 'chart' },
  { label: 'Notifications', badge: 5, icon: 'bell' },
  { label: 'Profile', icon: 'user' },
  { label: 'Documents', icon: 'file' },
  { label: 'Vehicle Details', icon: 'vehicle' },
  { label: 'Support', icon: 'support' },
  { label: 'Settings', icon: 'settings' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-green-dark text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-primary">
          <LogoIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">GreenRow</p>
          <p className="text-xs text-white/60">Delivery Partner</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  item.active
                    ? 'bg-green-primary font-medium text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon name={item.icon} size="sm" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-primary px-1.5 text-[11px] font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          type="button"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          <Icon name="power" size="sm" />
          Go Offline
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <img
            src="https://i.pravatar.cc/80?img=12"
            alt="Rahul Sharma"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Rahul Sharma</p>
            <p className="text-xs text-white/60">⭐ 4.8 · ID: GRP125690</p>
          </div>
          <Icon name="chevronDown" size="sm" className="text-white/50" />
        </div>
      </div>
    </aside>
  )
}
