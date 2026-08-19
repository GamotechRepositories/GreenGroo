import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerLayout from "./components/layout/ManagerLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import StockPage from "./pages/stock/StockPage";
import DriversPage from "./pages/drivers/DriversPage";
import PendingDriversPage from "./pages/drivers/PendingDriversPage";
import PendingDriverDetailPage from "./pages/drivers/PendingDriverDetailPage";
import OrdersPage from "./pages/orders/OrdersPage";
import ShiftManagementPage from "./pages/shifts/ShiftManagementPage";
import CreateShiftPage from "./pages/shifts/CreateShiftPage";
import IncentivesPage from "./pages/incentives/IncentivesPage";
import CreateGigPage from "./pages/incentives/CreateGigPage";
import AlertsPage from "./pages/alerts/AlertsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ManagerLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/shifts" element={<ShiftManagementPage />} />
              <Route path="/shifts/create" element={<CreateShiftPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/pending" element={<PendingDriversPage />} />
              <Route path="/drivers/pending/:id" element={<PendingDriverDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/incentives" element={<IncentivesPage />} />
              <Route path="/incentives/create" element={<CreateGigPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
