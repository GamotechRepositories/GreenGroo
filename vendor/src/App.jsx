import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { VendorProvider } from '@/context/VendorContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { VendorLayout } from '@/components/layout/VendorLayout'
import { ModulePage } from '@/components/shared/ModulePage'
import { getAllRoutes } from '@/config/navigation'
import SigninPage from '@/pages/auth/SigninPage'
import SignupPage from '@/pages/auth/SignupPage'
import Dashboard from '@/pages/Dashboard'
import ManagersListPage from '@/pages/farmer-manager/ManagersListPage'
import ManagerFormPage from '@/pages/farmer-manager/ManagerFormPage'
import ManagerDetailPage from '@/pages/farmer-manager/ManagerDetailPage'
import FarmersListPage from '@/pages/farmer-manager/FarmersListPage'
import FarmerFormPage from '@/pages/farmer-manager/FarmerFormPage'
import FarmerDetailPage from '@/pages/farmer-manager/FarmerDetailPage'
import FarmerProductDetailPage from '@/pages/farmer-manager/FarmerProductDetailPage'

const FARMER_MANAGER_PREFIX = '/farmer-manager'

const moduleRoutes = getAllRoutes().filter(
  (r) => !r.isDashboard && !r.path.startsWith(FARMER_MANAGER_PREFIX),
)

export default function App() {
  return (
    <VendorProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Vendor App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<VendorLayout />}>
              <Route index element={<Dashboard />} />

              <Route path="farmer-manager/managers" element={<ManagersListPage />} />
              <Route path="farmer-manager/managers/add" element={<ManagerFormPage />} />
              <Route path="farmer-manager/managers/:managerId" element={<ManagerDetailPage />} />
              <Route path="farmer-manager/managers/:managerId/edit" element={<ManagerFormPage />} />
              <Route path="farmer-manager/managers/:managerId/farmers/add" element={<FarmerFormPage />} />
              <Route path="farmer-manager/farmers" element={<FarmersListPage />} />
              <Route path="farmer-manager/farmers/:farmerId" element={<FarmerDetailPage />} />
              <Route
                path="farmer-manager/farmers/:farmerId/products/:productId"
                element={<FarmerProductDetailPage />}
              />

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
          </Route>
        </Routes>
      </BrowserRouter>
    </VendorProvider>
  )
}
