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
import FarmerDetailPage from './pages/vendor-farmers/FarmerDetailPage'
import VendorProductsPage from './pages/vendor-farmers/VendorProductsPage'
import VendorProductAddPage from './pages/vendor-farmers/VendorProductAddPage'
import VendorProductFarmersPage from './pages/vendor-farmers/VendorProductFarmersPage'
import FarmerCropViewPage from './pages/vendor-farmers/FarmerCropViewPage'
import FarmerCropFormPage from './pages/vendor-farmers/FarmerCropFormPage'
import DriversPage from './pages/drivers/DriversPage'
import DriverFormPage from './pages/drivers/DriverFormPage'
import DriverDetailPage from './pages/drivers/DriverDetailPage'
import VendorPickupsPage from './pages/pickups/VendorPickupsPage'
import VendorPickupDetailPage from './pages/pickups/VendorPickupDetailPage'
import CollectionReceivePage from './pages/pickups/CollectionReceivePage'
import VendorBatchPage from './pages/pickups/VendorBatchPage'
import QualityListPage from './pages/quality/QualityListPage'
import QualityInspectionPage from './pages/quality/QualityInspectionPage'
import DriverDashboardPage from './pages/drivers/DriverDashboardPage'
import DriverHomePage from './pages/drivers/DriverHomePage'
import DriverPickupPage from './pages/drivers/DriverPickupPage'
import DriverBatchPage from './pages/drivers/DriverBatchPage'
import InventoryRequestsPage from './pages/inventory-requests/InventoryRequestsPage'
import VendorSearchPage from './pages/search/VendorSearchPage'
import ApplyLeavePage from './pages/leave/ApplyLeavePage'
import DriverLeavePage from './pages/drivers/DriverLeavePage'

function App() {
  return (
    <VendorAuthProvider>
      <DriverAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/driver/login" element={<Navigate to="/vendor/login" replace />} />
            <Route element={<DriverProtectedRoute />}>
              <Route element={<DriverLayout />}>
                <Route path="/driver" element={<DriverHomePage />} />
                <Route path="/driver/assigned" element={<DriverDashboardPage mode="assigned" />} />
                <Route path="/driver/progress" element={<DriverDashboardPage mode="progress" />} />
                <Route path="/driver/completed" element={<DriverDashboardPage mode="completed" />} />
                <Route path="/driver/history" element={<DriverDashboardPage mode="history" />} />
                <Route path="/driver/today" element={<Navigate to="/driver/assigned" replace />} />
                <Route path="/driver/leave" element={<DriverLeavePage />} />
                <Route path="/driver/batches/:batchId" element={<DriverBatchPage />} />
                <Route path="/driver/pickups/:pickupId" element={<DriverPickupPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<ProductManagerLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vendor/search" element={<VendorSearchPage />} />
                <Route path="/vendor/farmer-managers" element={<FarmerManagersPage />} />
                <Route path="/vendor/farmer-managers/add" element={<AddManagerPage />} />
                <Route path="/vendor/farmer-managers/:managerId" element={<ManagerDetailPage />} />
                <Route path="/vendor/all-farmers" element={<AllFarmersPage />} />
                <Route path="/vendor/products/add" element={<VendorProductAddPage />} />
                <Route path="/vendor/products/:productKey/farmers" element={<VendorProductFarmersPage />} />
                <Route path="/vendor/products" element={<VendorProductsPage />} />
                <Route path="/vendor/all-farmers/add" element={<AddFarmerPage />} />
                <Route path="/vendor/all-farmers/:farmerId/crops/add" element={<FarmerCropFormPage />} />
                <Route path="/vendor/all-farmers/:farmerId/crops/:cropId/edit" element={<FarmerCropFormPage />} />
                <Route path="/vendor/all-farmers/:farmerId/crops/:cropId" element={<FarmerCropViewPage />} />
                <Route path="/vendor/all-farmers/:farmerId/products/add" element={<VendorProductAddPage />} />
                <Route path="/vendor/all-farmers/:farmerId" element={<FarmerDetailPage />} />
                <Route path="/vendor/drivers" element={<DriversPage />} />
                <Route path="/vendor/drivers/add" element={<DriverFormPage />} />
                <Route path="/vendor/drivers/:driverId/edit" element={<DriverFormPage />} />
                <Route path="/vendor/drivers/:driverId" element={<DriverDetailPage />} />
                <Route path="/vendor/pickups/ready" element={<VendorPickupsPage mode="ready" />} />
                <Route path="/vendor/pickups/assigned" element={<VendorPickupsPage mode="assigned" />} />
                <Route path="/vendor/pickups/assignments" element={<Navigate to="/vendor/pickups/ready" replace />} />
                <Route path="/vendor/pickups/today" element={<VendorPickupsPage mode="today" />} />
                <Route path="/vendor/pickups/incoming" element={<VendorPickupsPage mode="incoming" />} />
                <Route path="/vendor/pickups/centre" element={<VendorPickupsPage mode="centre" />} />
                <Route path="/vendor/pickups/all" element={<VendorPickupsPage mode="all" />} />
                <Route path="/vendor/pickups/active" element={<Navigate to="/vendor/pickups/all" replace />} />
                <Route path="/vendor/pickups/history" element={<Navigate to="/vendor/pickups/all" replace />} />
                <Route path="/vendor/pickups/:pickupId" element={<VendorPickupDetailPage />} />
                <Route path="/vendor/collection-centre" element={<Navigate to="/vendor/pickups/centre" replace />} />
                <Route path="/vendor/collection-centre/:pickupId" element={<CollectionReceivePage />} />
                <Route path="/vendor/batches/:batchId" element={<VendorBatchPage />} />
                <Route path="/vendor/quality" element={<Navigate to="/vendor/quality/pending" replace />} />
                <Route path="/vendor/quality/pending" element={<QualityListPage mode="pending" />} />
                <Route path="/vendor/quality/inspection" element={<QualityListPage mode="inspection" />} />
                <Route path="/vendor/quality/grading" element={<QualityListPage mode="grading" />} />
                <Route path="/vendor/quality/completed" element={<QualityListPage mode="completed" />} />
                <Route path="/vendor/quality/:orderId" element={<QualityInspectionPage />} />
                <Route path="/inventory-requests" element={<InventoryRequestsPage />} />
                <Route path="/leave" element={<ApplyLeavePage />} />
                <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Panel configuration" />} />
                <Route path="/profile" element={<PlaceholderPage title="My Profile" subtitle="Your account details" />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/vendor/login" replace />} />
            <Route path="*" element={<Navigate to="/vendor/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </DriverAuthProvider>
    </VendorAuthProvider>
  )
}

export default App
