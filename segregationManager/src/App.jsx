import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SegregationManagerLayout from './components/layout/SegregationManagerLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import LoginPage from './pages/auth/LoginPage'
import ApplyLeavePage from './pages/leave/ApplyLeavePage'
import ProfileLayout from './components/layout/ProfileLayout'
import SettingsPage from './pages/settings/SettingsPage'
import ProfilePage from './pages/profile/ProfilePage'
import PoliciesPage from './pages/policies/PoliciesPage'
import QrSystemHubPage from './pages/qr-system/QrSystemHubPage'
import QrSystemDarkStorePage from './pages/qr-system/QrSystemDarkStorePage'
import QrSystemPreordersPage from './pages/qr-system/QrSystemPreordersPage'

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<SegregationManagerLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/qr-system" element={<QrSystemHubPage />} />
              <Route path="/qr-system/dark-store" element={<QrSystemDarkStorePage />} />
              <Route path="/qr-system/preorders" element={<QrSystemPreordersPage />} />
              <Route element={<ProfileLayout />}>

                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leave" element={<ApplyLeavePage />} />
                <Route path="/policies" element={<PoliciesPage roleKey="segregation_manager" />} />
              </Route>
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
