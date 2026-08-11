import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SegregationManagerLayout from './components/layout/SegregationManagerLayout'
import PlaceholderPage from './components/ui/PlaceholderPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import InventoryRequestsPage from './pages/inventory-requests/InventoryRequestsPage'
import ProductManagersPage from './pages/team/ProductManagersPage'
import LoginPage from './pages/auth/LoginPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<SegregationManagerLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/catalog"
                element={
                  <PlaceholderPage
                    title="Product Catalog"
                    subtitle="Manage all product definitions and SKUs"
                  />
                }
              />
              <Route
                path="/categories"
                element={
                  <PlaceholderPage
                    title="Product Categories"
                    subtitle="Organize products into categories"
                  />
                }
              />
              <Route
                path="/farmer-submissions"
                element={
                  <PlaceholderPage
                    title="Farmer Submissions"
                    subtitle="Review produce submitted by farmers"
                  />
                }
              />
              <Route
                path="/incoming-products"
                element={
                  <PlaceholderPage
                    title="Incoming Products"
                    subtitle="Track products arriving at the segregation center"
                  />
                }
              />
              <Route
                path="/quality-inspection"
                element={
                  <PlaceholderPage
                    title="Quality Inspection"
                    subtitle="Inspect and verify product quality"
                  />
                }
              />
              <Route
                path="/grading/grade-a"
                element={
                  <PlaceholderPage title="Grade A" subtitle="Premium quality products" />
                }
              />
              <Route
                path="/grading/grade-b"
                element={
                  <PlaceholderPage title="Grade B" subtitle="Standard quality products" />
                }
              />
              <Route
                path="/grading/grade-c"
                element={
                  <PlaceholderPage title="Grade C" subtitle="Economy grade products" />
                }
              />
              <Route
                path="/grading/rejected"
                element={
                  <PlaceholderPage
                    title="Rejected"
                    subtitle="Products that failed quality checks"
                  />
                }
              />
              <Route
                path="/inventory"
                element={
                  <PlaceholderPage
                    title="All Inventory"
                    subtitle="Complete inventory across all statuses"
                  />
                }
              />
              <Route
                path="/inventory/ready-to-sell"
                element={
                  <PlaceholderPage
                    title="Ready to Sell"
                    subtitle="Inventory approved and available for dispatch"
                  />
                }
              />
              <Route
                path="/inventory/under-processing"
                element={
                  <PlaceholderPage
                    title="Under Processing"
                    subtitle="Products currently being sorted or graded"
                  />
                }
              />
              <Route
                path="/inventory/reserved"
                element={
                  <PlaceholderPage
                    title="Reserved"
                    subtitle="Stock reserved for pending store requests"
                  />
                }
              />
              <Route
                path="/inventory/expired-damaged"
                element={
                  <PlaceholderPage
                    title="Expired / Damaged"
                    subtitle="Write-off and disposal inventory"
                  />
                }
              />
              <Route path="/inventory-requests" element={<InventoryRequestsPage />} />
              <Route path="/product-managers" element={<ProductManagersPage />} />
              <Route
                path="/stock-transfers"
                element={
                  <PlaceholderPage
                    title="Stock Transfers"
                    subtitle="Transfer inventory between locations"
                  />
                }
              />
              <Route
                path="/pricing"
                element={
                  <PlaceholderPage
                    title="Product Cost & Pricing"
                    subtitle="Manage procurement costs and selling prices"
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <PlaceholderPage
                    title="Inventory Reports"
                    subtitle="Analytics and inventory summaries"
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <PlaceholderPage
                    title="Inventory History"
                    subtitle="Audit trail of inventory movements"
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage title="Settings" subtitle="Panel configuration" />
                }
              />
              <Route
                path="/profile"
                element={
                  <PlaceholderPage title="My Profile" subtitle="Your account details" />
                }
              />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
