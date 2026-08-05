import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/orders': 'Orders',
  '/customers': 'Customers',
  '/coupons': 'Coupons',
  '/returns': 'Returns',
  '/wallet': 'Wallet',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/marketing': 'Marketing',
  '/support': 'Support',
  '/settings': 'Settings',
}

export function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const pageTitle = PAGE_TITLES[pathname] || 'Vendor'

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
