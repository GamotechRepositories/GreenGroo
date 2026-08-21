import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { VendorAuthProvider } from './context/VendorAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ProductManagerLayout from './components/layout/ProductManagerLayout'
import PlaceholderPage from './components/ui/PlaceholderPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LoginPage from './pages/auth/LoginPage'
import VendorLoginPage from './pages/vendor-auth/VendorLoginPage'
import FarmerManagersPage from './pages/farmer-managers/FarmerManagersPage'
import AddManagerPage from './pages/farmer-managers/AddManagerPage'
import ManagerDetailPage from './pages/farmer-managers/ManagerDetailPage'
import AllFarmersPage from './pages/vendor-farmers/AllFarmersPage'
import AddFarmerPage from './pages/vendor-farmers/AddFarmerPage'

function App() {
  return (
    <VendorAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProductManagerLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vendor/farmer-managers" element={<FarmerManagersPage />} />
                <Route path="/vendor/farmer-managers/add" element={<AddManagerPage />} />
                <Route path="/vendor/farmer-managers/:managerId" element={<ManagerDetailPage />} />
                <Route path="/vendor/all-farmers" element={<AllFarmersPage />} />
                <Route path="/vendor/all-farmers/add" element={<AddFarmerPage />} />
                <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Panel configuration" />} />
                <Route path="/profile" element={<PlaceholderPage title="My Profile" subtitle="Your account details" />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </VendorAuthProvider>
  )
}

export default App
