import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductManagerLayout from "./components/layout/ProductManagerLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import InventoryRequestsPage from "./pages/inventory-requests/InventoryRequestsPage";
import ApplyLeavePage from "./pages/leave/ApplyLeavePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ProductManagerLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory-requests" element={<InventoryRequestsPage />} />
              <Route path="/leave" element={<ApplyLeavePage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/inventory-requests" replace />} />
          <Route path="*" element={<Navigate to="/inventory-requests" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
