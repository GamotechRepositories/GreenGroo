import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, LogoIcon } from '../ui/Icon'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'
<<<<<<< Updated upstream
import { useVendorAuth } from '../../context/VendorAuthContext'
=======
import { useInventoryRequests } from '../../hooks/useInventoryRequests'
>>>>>>> Stashed changes

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  {
    id: 'farmer-manager',
    label: 'Farmer Managers',
    icon: 'user',
    children: [
      { to: '/vendor/farmer-managers', label: 'All Managers' },
      { to: '/vendor/farmer-managers/add', label: 'Add Manager' },
    ],
  },
  { to: '/vendor/all-farmers', label: 'Farmers', icon: 'tractor' },
<<<<<<< Updated upstream
  {
    id: 'delivery-drivers',
    label: 'Delivery / Pickup',
    icon: 'truck',
    children: [
      { to: '/vendor/drivers', label: 'Drivers', end: true },
      { to: '/vendor/pickups/assigned', label: 'Assigned Pickups' },
      { to: '/vendor/pickups/today', label: "Today's Pickups" },
      { to: '/vendor/pickups/active', label: 'Active Pickups' },
      { to: '/vendor/pickups/history', label: 'Pickup History' },
      { to: '/vendor/collection-centre', label: 'Collection Centre' },
    ],
  },
=======
  { to: '/inventory-requests', label: 'Inventory Requests', icon: 'box' },
>>>>>>> Stashed changes
]

const footerItems = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/profile', label: 'My Profile', icon: 'user' },
]

function NavItem({ item, badge }) {
  if (item.children) {
    return <NavGroup item={item} />
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive
              ? 'bg-green-primary font-medium text-white'
              : 'text-white/80 hover:bg-white/10'
          }`
        }
      >
        <Icon name={item.icon} size="sm" />
        <span className="flex-1 text-left">{item.label}</span>
        {badge > 0 ? (
          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
            {badge}
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}

function NavGroup({ item }) {
  const location = useLocation()
  const isChildActive = item.children.some((child) =>
    location.pathname.startsWith(child.to),
  )
  const [open, setOpen] = useState(isChildActive)

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isChildActive
            ? 'bg-white/10 font-medium text-white'
            : 'text-white/80 hover:bg-white/10'
        }`}
      >
        <Icon name={item.icon} size="sm" />
        <span className="flex-1 text-left">{item.label}</span>
        <Icon
          name="chevronDown"
          size="sm"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3 ml-4">
          {item.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-green-primary font-medium text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default function ProductManagerLayout() {
  const { logout } = useAuth()
  const vendor = useVendorAuth()
  const navigate = useNavigate()
  const { requests } = useInventoryRequests(12000)
  const pendingCount = requests.filter((request) => request.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-green-dark text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-primary">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">GreenGroo</p>
            <p className="text-xs text-white/60">Product Manager</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.to || item.id}
                item={item}
                badge={item.to === '/inventory-requests' ? pendingCount : 0}
              />
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <ul className="space-y-0.5">
            {footerItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-green-primary font-medium text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon name={item.icon} size="sm" />
                  <span className="flex-1 text-left">{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  if (vendor.isAuthenticated) {
                    vendor.logout()
                    navigate('/vendor/login', { replace: true })
                    return
                  }
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
              >
                <Icon name="power" size="sm" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">
        <Outlet />
      </div>
    </div>
  )
}

export function PageShell({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="space-y-5 p-6">{children}</main>
    </>
  )
}
