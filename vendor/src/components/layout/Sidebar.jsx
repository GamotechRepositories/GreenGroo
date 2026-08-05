import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingBag,
  Users,
  TicketPercent,
  RotateCcw,
  Wallet,
  BarChart3,
  FileBarChart,
  Megaphone,
  Headphones,
  Settings,
  X,
  Leaf,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/returns', label: 'Returns', icon: RotateCcw },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/support', label: 'Support', icon: Headphones },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-text-primary/30 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-sidebar shadow-[var(--shadow-soft)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="soft-green-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
              <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-text-primary">GreenGrocc</p>
              <p className="text-[11px] font-medium text-text-secondary">Vendor Hub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-secondary transition hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Menu
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-secondary hover:bg-cream hover:text-text-primary',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] transition-colors',
                            isActive ? 'text-white' : 'text-gray-600 group-hover:text-primary',
                          )}
                          strokeWidth={2}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="soft-green-gradient rounded-xl p-4 text-white shadow-sm">
            <p className="text-sm font-bold">Boost your sales</p>
            <p className="mt-1 text-xs font-medium text-white/85">
              Run a weekend flash deal and reach more nearby shoppers.
            </p>
            <button
              type="button"
              className="mt-3 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-primary transition hover:bg-white"
            >
              Create Campaign
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
