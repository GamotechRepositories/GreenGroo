import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { VendorLayout } from '@/components/layout/VendorLayout'
import Dashboard from '@/pages/Dashboard'
import Products from '@/pages/Products'
import PlaceholderPage from '@/pages/PlaceholderPage'

const PLACEHOLDER_ROUTES = [
  { path: 'categories', title: 'Categories' },
  { path: 'inventory', title: 'Inventory' },
  { path: 'orders', title: 'Orders' },
  { path: 'customers', title: 'Customers' },
  { path: 'coupons', title: 'Coupons' },
  { path: 'returns', title: 'Returns' },
  { path: 'wallet', title: 'Wallet' },
  { path: 'analytics', title: 'Analytics' },
  { path: 'reports', title: 'Reports' },
  { path: 'marketing', title: 'Marketing' },
  { path: 'support', title: 'Support' },
  { path: 'settings', title: 'Settings' },
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<VendorLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          {PLACEHOLDER_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PlaceholderPage title={route.title} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
