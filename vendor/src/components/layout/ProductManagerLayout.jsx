import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Sprout,
  Tractor,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import Header from './Header'
import VendorTopNavbar from './VendorTopNavbar'
import VendorBottomNav from './VendorBottomNav'
import { useVendorAuth } from '../../context/VendorAuthContext'
import { useInventoryRequests } from '../../hooks/useInventoryRequests'
import { vendorApi } from '../../api/vendorApi'
import RoleAnnouncements from '../RoleAnnouncements'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    id: 'farmer-manager',
    label: 'Farmer Managers',
    icon: Users,
    children: [
      { to: '/vendor/farmer-managers', label: 'All Managers' },
      { to: '/vendor/farmer-managers/add', label: 'Add Manager' },
    ],
  },
  { to: '/vendor/all-farmers', label: 'Farmers', icon: Tractor },
  {
    id: 'crops',
    label: 'Crops',
    icon: Sprout,
    children: [
      { to: '/vendor/crops', label: 'All Crops', end: true },
      { to: '/vendor/crops/add', label: 'Add Crop' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    children: [
      { to: '/vendor/products', label: 'All Products', end: true },
      { to: '/vendor/products/add', label: 'Add Product' },
    ],
  },
  {
    id: 'pickup',
    label: 'Pickup',
    icon: Truck,
    children: [
      { to: '/vendor/pickups/incoming', label: 'Incoming Pickups' },
      { to: '/vendor/pickups/centre', label: 'Pickups at Centre' },
      { to: '/vendor/pickups/all', label: 'All Pickups' },
    ],
  },
  {
    id: 'driver',
    label: 'Driver',
    icon: IdCard,
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
    icon: BadgeCheck,
    children: [
      { to: '/vendor/quality/pending', label: 'Pending Inspection' },
      { to: '/vendor/quality/inspection', label: 'Quality Inspection' },
      { to: '/vendor/quality/grading', label: 'Grading' },
      { to: '/vendor/quality/completed', label: 'Completed' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: ClipboardList,
    children: [
      { to: '/vendor/inventory', label: 'All Inventory', end: true },
      { to: '/vendor/inventory/history', label: 'History' },
    ],
  },
  { to: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: Wallet,
    children: [
      { to: '/vendor/earnings', label: 'Earning Statements', end: true },
      { to: '/vendor/earnings/payments', label: 'All Payments' },
    ],
  },
  { to: '/vendor/documents', label: 'Documents', icon: FileText },
  { to: '/inventory-requests', label: 'Inventory Requests', icon: Package },
]

const footerItems = [
  { to: '/leave', label: 'Apply Leave', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'My Profile', icon: UserRound },
]

function NavGroup({ item, collapsed, onNavigate }) {
  const location = useLocation()
  const path = location.pathname
  const isChildActive = Boolean(
    item.children?.some((child) => path.startsWith(String(child.to || '').split('?')[0]))
  )
  const [open, setOpen] = useState(isChildActive)
  const Icon = item.icon || Package

  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [location.pathname, isChildActive])

  if (collapsed) {
    return (
      <NavLink
        to={item.children?.[0]?.to || '#'}
        title={item.label}
        onClick={onNavigate}
        className={() =>
          `group relative mx-1.5 mb-0.5 flex items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
            isChildActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
          }`
        }
      >
        <Icon
          className={`h-4.5 w-4.5 shrink-0 ${isChildActive ? 'text-emerald-700' : 'text-slate-500'}`}
          strokeWidth={isChildActive ? 2.25 : 1.75}
        />
      </NavLink>
    )
  }

  return (
    <div className="mx-1.5 mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
          isChildActive ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <Icon
          className={`h-4.5 w-4.5 shrink-0 ${isChildActive ? 'text-emerald-700' : 'text-slate-500'}`}
          strokeWidth={isChildActive ? 2.25 : 1.75}
        />
        <span className="flex-1 text-left leading-tight truncate">{item.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="ml-3.5 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded-md px-2 py-1.5 text-xs transition ${
                  isActive
                    ? 'bg-white font-semibold text-emerald-700 shadow-xs border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

function NavItem({ item, collapsed, badge, onNavigate }) {
  if (item.children) {
    return <NavGroup item={item} collapsed={collapsed} onNavigate={onNavigate} />
  }

  const Icon = item.icon || Package

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
          collapsed ? 'justify-center px-2' : ''
        } ${
          isActive
            ? 'bg-emerald-50 text-emerald-800 font-semibold'
            : 'text-slate-700 hover:bg-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}`}
            strokeWidth={isActive ? 2.25 : 1.75}
          />
          {!collapsed ? (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                  {badge}
                </span>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export default function ProductManagerLayout() {
  const vendor = useVendorAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { requests } = useInventoryRequests(12000)
  const pendingCount = requests.filter((request) => request.status === 'pending').length
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  const compact = collapsed && !mobileOpen

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const onNavigate = () => {
    closeMobile()
    if (window.innerWidth < 1024) setCollapsed(false)
  }

  return (
    <div className="flex min-h-dvh bg-[#f3f6f4] text-slate-900">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden print:hidden"
          onClick={closeMobile}
        />
      ) : null}

      {/* Slim Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:z-0 lg:shadow-none print:hidden ${
          compact ? 'w-[64px]' : 'w-[218px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 px-2.5">
          {!compact ? (
            <div className="min-w-0 flex-1 px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white shadow-xs">
                  GG
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold leading-tight text-slate-900">GreenGroo</p>
                  <p className="truncate text-[10px] leading-tight text-slate-400">Vendor Panel</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white shadow-xs">
                GG
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:inline-flex"
            aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
            title={compact ? 'Expand' : 'Collapse'}
          >
            {compact ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavItem
              key={item.to || item.id}
              item={item}
              collapsed={compact}
              onNavigate={onNavigate}
              badge={item.to === '/inventory-requests' ? pendingCount : 0}
            />
          ))}

          {/* Footer Items */}
          <div className="mt-3 border-t border-slate-200/80 pt-2 pb-5">
            {footerItems.map((item) => {
              const Icon = item.icon || Package
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={compact ? item.label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                      compact ? 'justify-center px-2' : ''
                    } ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}`}
                        strokeWidth={isActive ? 2.25 : 1.75}
                      />
                      {!compact ? <span className="truncate">{item.label}</span> : null}
                    </>
                  )}
                </NavLink>
              )
            })}

            <button
              type="button"
              onClick={() => {
                vendor.logout()
                navigate('/vendor/login', { replace: true })
              }}
              title={compact ? 'Logout' : undefined}
              className={`group relative mx-1.5 mb-0.5 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition ${
                compact ? 'justify-center px-2' : ''
              }`}
            >
              <LogOut className="h-4.5 w-4.5 shrink-0 text-slate-500 group-hover:text-red-600" strokeWidth={1.75} />
              {!compact ? <span className="truncate">Logout</span> : null}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top Navbar with Searchbar */}
        <VendorTopNavbar onOpenMobileMenu={() => setMobileOpen(true)} />

        {/* Announcements & Page Content */}
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <RoleAnnouncements
            roleKey="vendor"
            load={() => vendorApi.liveAnnouncements()}
            loadCalendar={() => vendorApi.liveCalendar()}
          />
          <Outlet />
        </main>
      </div>

      <div className="print:hidden">
        <VendorBottomNav />
      </div>
    </div>
  )
}

export function PageShell({ title, subtitle, children }) {
  return (
    <>
      {title || subtitle ? <Header title={title} subtitle={subtitle} /> : null}
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-4 lg:p-5">
        {title || subtitle ? (
          <div className="lg:hidden">
            {title ? <h1 className="text-lg font-bold leading-tight text-gray-900">{title}</h1> : null}
            {subtitle ? <p className="mt-0.5 text-xs leading-snug text-gray-500">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </>
  )
}
