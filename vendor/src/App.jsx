import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { VendorAuthProvider } from './context/VendorAuthContext'
import { DriverAuthProvider } from './context/DriverAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DriverProtectedRoute from './components/DriverProtectedRoute'
import ProductManagerLayout from './components/layout/ProductManagerLayout'
import DriverLayout from './components/layout/DriverLayout'
import PlaceholderPage from './components/ui/PlaceholderPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LoginPage from './pages/auth/LoginPage'
import VendorLoginPage from './pages/vendor-auth/VendorLoginPage'
import FarmerManagersPage from './pages/farmer-managers/FarmerManagersPage'
import AddManagerPage from './pages/farmer-managers/AddManagerPage'
import ManagerDetailPage from './pages/farmer-managers/ManagerDetailPage'
import AllFarmersPage from './pages/vendor-farmers/AllFarmersPage'
import AddFarmerPage from './pages/vendor-farmers/AddFarmerPage'
<<<<<<< Updated upstream
import DriversPage from './pages/drivers/DriversPage'
import DriverFormPage from './pages/drivers/DriverFormPage'
import DriverDetailPage from './pages/drivers/DriverDetailPage'
import VendorPickupsPage from './pages/pickups/VendorPickupsPage'
import VendorPickupDetailPage from './pages/pickups/VendorPickupDetailPage'
import CollectionReceivePage from './pages/pickups/CollectionReceivePage'
import DriverLoginPage from './pages/drivers/DriverLoginPage'
import DriverDashboardPage from './pages/drivers/DriverDashboardPage'
import DriverPickupPage from './pages/drivers/DriverPickupPage'
=======
import InventoryRequestsPage from './pages/inventory-requests/InventoryRequestsPage'
>>>>>>> Stashed changes

function App() {
  return (
    <VendorAuthProvider>
      <DriverAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/driver/login" element={<DriverLoginPage />} />
            <Route element={<DriverProtectedRoute />}>
              <Route element={<DriverLayout />}>
                <Route path="/driver/assigned" element={<DriverDashboardPage mode="assigned" />} />
                <Route path="/driver/progress" element={<DriverDashboardPage mode="progress" />} />
                <Route path="/driver/completed" element={<DriverDashboardPage mode="completed" />} />
                <Route path="/driver/history" element={<DriverDashboardPage mode="history" />} />
                <Route path="/driver/today" element={<Navigate to="/driver/assigned" replace />} />
                <Route path="/driver/pickups/:pickupId" element={<DriverPickupPage />} />
                <Route path="/driver" element={<Navigate to="/driver/assigned" replace />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<ProductManagerLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vendor/farmer-managers" element={<FarmerManagersPage />} />
                <Route path="/vendor/farmer-managers/add" element={<AddManagerPage />} />
                <Route path="/vendor/farmer-managers/:managerId" element={<ManagerDetailPage />} />
                <Route path="/vendor/all-farmers" element={<AllFarmersPage />} />
                <Route path="/vendor/all-farmers/add" element={<AddFarmerPage />} />
<<<<<<< Updated upstream
                <Route path="/vendor/drivers" element={<DriversPage />} />
                <Route path="/vendor/drivers/add" element={<DriverFormPage />} />
                <Route path="/vendor/drivers/:driverId/edit" element={<DriverFormPage />} />
                <Route path="/vendor/drivers/:driverId" element={<DriverDetailPage />} />
                <Route path="/vendor/pickups/assigned" element={<VendorPickupsPage mode="assigned" />} />
                <Route path="/vendor/pickups/assignments" element={<VendorPickupsPage mode="assignments" />} />
                <Route path="/vendor/pickups/today" element={<VendorPickupsPage mode="today" />} />
                <Route path="/vendor/pickups/active" element={<VendorPickupsPage mode="active" />} />
                <Route path="/vendor/pickups/history" element={<VendorPickupsPage mode="history" />} />
                <Route path="/vendor/pickups/:pickupId" element={<VendorPickupDetailPage />} />
                <Route path="/vendor/collection-centre" element={<VendorPickupsPage mode="centre" />} />
                <Route path="/vendor/collection-centre/:pickupId" element={<CollectionReceivePage />} />
=======
                <Route path="/inventory-requests" element={<InventoryRequestsPage />} />
>>>>>>> Stashed changes
                <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Panel configuration" />} />
                <Route path="/profile" element={<PlaceholderPage title="My Profile" subtitle="Your account details" />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/inventory-requests" replace />} />
            <Route path="*" element={<Navigate to="/inventory-requests" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </DriverAuthProvider>
    </VendorAuthProvider>
  )
}

export default App
