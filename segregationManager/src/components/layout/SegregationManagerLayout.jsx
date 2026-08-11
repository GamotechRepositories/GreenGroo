import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, LogoIcon } from '../ui/Icon'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/catalog', label: 'Product Catalog', icon: 'box' },
  { to: '/categories', label: 'Product Categories', icon: 'grid' },
  { to: '/farmer-submissions', label: 'Farmer Submissions', icon: 'tractor' },
  { to: '/incoming-products', label: 'Incoming Products', icon: 'download' },
  { to: '/quality-inspection', label: 'Quality Inspection', icon: 'search' },
  {
    id: 'grading',
    label: 'Product Grading',
    icon: 'tag',
    children: [
      { to: '/grading/grade-a', label: 'Grade A' },
      { to: '/grading/grade-b', label: 'Grade B' },
      { to: '/grading/grade-c', label: 'Grade C' },
      { to: '/grading/rejected', label: 'Rejected' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'clipboard',
    children: [
      { to: '/inventory', label: 'All Inventory', end: true },
      { to: '/inventory/ready-to-sell', label: 'Ready to Sell' },
      { to: '/inventory/under-processing', label: 'Under Processing' },
      { to: '/inventory/reserved', label: 'Reserved' },
      { to: '/inventory/expired-damaged', label: 'Expired / Damaged' },
    ],
  },
  { to: '/inventory-requests', label: 'Inventory Requests', icon: 'inbox' },
  { to: '/product-managers', label: 'Product Managers', icon: 'user' },
  { to: '/stock-transfers', label: 'Stock Transfers', icon: 'transfer' },
  { to: '/pricing', label: 'Product Cost & Pricing', icon: 'currency' },
  { to: '/reports', label: 'Inventory Reports', icon: 'chart' },
  { to: '/history', label: 'Inventory History', icon: 'clock' },
]

const footerItems = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/profile', label: 'My Profile', icon: 'user' },
]

function NavItem({ item }) {
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
        <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
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

export default function SegregationManagerLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-green-dark text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-primary">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">GreenGroo</p>
            <p className="text-xs text-white/60">Product Segregation Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem key={item.to || item.id} item={item} />
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
