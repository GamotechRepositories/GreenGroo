import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, LogoIcon } from '../ui/Icon'
import Header from './Header'
import VendorBottomNav from './VendorBottomNav'
import { useVendorAuth } from '../../context/VendorAuthContext'
import { useInventoryRequests } from '../../hooks/useInventoryRequests'
import { vendorApi } from '../../api/vendorApi'
import RoleAnnouncements from '../RoleAnnouncements'

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
  {
    id: 'products',
    label: 'Products',
    icon: 'leaf',
    children: [
      { to: '/vendor/products', label: 'All Products', end: true },
      { to: '/vendor/products/add', label: 'Add Product' },
    ],
  },
  {
    id: 'pickup',
    label: 'Pickup',
    icon: 'truck',
    children: [
      { to: '/vendor/pickups/incoming', label: 'Incoming Pickups' },
      { to: '/vendor/pickups/centre', label: 'Pickups at Centre' },
      { to: '/vendor/pickups/all', label: 'All Pickups' },
    ],
  },
  {
    id: 'driver',
    label: 'Driver',
    icon: 'user',
    children: [
      { to: '/vendor/pickups/ready', label: 'Ready for Pickup' },
      { to: '/vendor/pickups/assigned', label: 'Assigned Pickups' },
      { to: '/vendor/pickups/today', label: "Today's Pickups" },
      { to: '/vendor/drivers', label: 'All Drivers', end: true },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Grading',
    icon: 'search',
    children: [
      { to: '/vendor/quality/pending', label: 'Pending Inspection' },
      { to: '/vendor/quality/inspection', label: 'Quality Inspection' },
      { to: '/vendor/quality/grading', label: 'Grading' },
      { to: '/vendor/quality/completed', label: 'Completed' },
    ],
  },
  { to: '/inventory-requests', label: 'Inventory Requests', icon: 'box' },
]

const footerItems = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/profile', label: 'My Profile', icon: 'user' },
]

function NavItem({ item, badge, onNavigate }) {
  if (item.children) {
    return <NavGroup item={item} onNavigate={onNavigate} />
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
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

function NavGroup({ item, onNavigate }) {
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
                onClick={onNavigate}
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
  const vendor = useVendorAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { requests } = useInventoryRequests(12000)
  const pendingCount = requests.filter((request) => request.status === 'pending').length
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-[#f8f9fa]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[45] bg-black/40 lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-64 flex-col bg-green-dark text-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-primary">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-white">GreenGroo</p>
            <p className="text-xs text-white/60">Vendor Panel</p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.to || item.id}
                item={item}
                onNavigate={closeMobile}
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
                  onClick={closeMobile}
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
                  vendor.logout()
                  navigate('/vendor/login', { replace: true })
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

      <div className="min-h-dvh pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size="sm" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">GreenGroo</p>
            <p className="truncate text-[11px] text-gray-500">Vendor Panel</p>
          </div>
        </header>
        <div className="px-4 pt-3 lg:px-6 lg:pt-4">
          <RoleAnnouncements
            roleKey="vendor"
            load={() => vendorApi.liveAnnouncements()}
            loadCalendar={() => vendorApi.liveCalendar()}
          />
        </div>
        <Outlet />
      </div>

      <VendorBottomNav />
    </div>
  )
}

export function PageShell({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="lg:hidden">
          <h1 className="text-lg font-bold leading-tight text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-xs leading-snug text-gray-500">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </>
  )
}
