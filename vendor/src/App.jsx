import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { VendorProvider } from '@/context/VendorContext'
import { VendorLayout } from '@/components/layout/VendorLayout'
import { ModulePage } from '@/components/shared/ModulePage'
import { getAllRoutes } from '@/config/navigation'
import Dashboard from '@/pages/Dashboard'

const moduleRoutes = getAllRoutes().filter((r) => !r.isDashboard)

export default function App() {
  return (
    <VendorProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<VendorLayout />}>
            <Route index element={<Dashboard />} />
            {moduleRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path.replace(/^\//, '')}
                element={
                  <ModulePage
                    title={route.label}
                    parent={route.parent}
                    permission={route.permission}
                  />
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </VendorProvider>
  )
}
