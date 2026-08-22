import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { farmerStore } from "../store/farmerStore";
import FarmerLayout from "../components/layout/FarmerLayout";
import FarmerLoginPage from "../pages/FarmerLoginPage";
import DocumentsPage from "../pages/DocumentsPage";
import DashboardPage from "../pages/DashboardPage";
import MarketPricesPage from "../pages/MarketPricesPage";
import FarmerCommunityPage from "../pages/FarmerCommunityPage";
import GovernmentSchemesPage from "../pages/GovernmentSchemesPage";
import ProductsPage from "../pages/ProductsPage";
import ProductAddPage from "../pages/ProductAddPage";
import ProductEditPage from "../pages/ProductEditPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import InventoryPage from "../pages/InventoryPage";
import InventoryAddPage from "../pages/InventoryAddPage";
import InventoryViewPage from "../pages/InventoryViewPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import HarvestOrdersPage from "../pages/HarvestOrdersPage";
import EarningsPage from "../pages/EarningsPage";
import ProfilePage from "../pages/ProfilePage";

// Manager Pages
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerFarmersPage from "../pages/manager/ManagerFarmersPage";
import ManagerAddFarmerPage from "../pages/manager/ManagerAddFarmerPage";
import ManagerFarmerDetailPage from "../pages/manager/ManagerFarmerDetailPage";
import ManagerProductsPage from "../pages/manager/ManagerProductsPage";
import ManagerInventoryPage from "../pages/manager/ManagerInventoryPage";
import ManagerInventoryHistoryPage from "../pages/manager/ManagerInventoryHistoryPage";
import ManagerOrdersPage from "../pages/manager/ManagerOrdersPage";
import ManagerCreateOrderPage from "../pages/manager/ManagerCreateOrderPage";
import ManagerEarningsPage from "../pages/manager/ManagerEarningsPage";
import ManagerFarmerEarningsSpreadsheetPage from "../pages/manager/ManagerFarmerEarningsSpreadsheetPage";
import ManagerDocumentsPage from "../pages/manager/ManagerDocumentsPage";
import ManagerFarmerOrdersSpreadsheetPage from "../pages/manager/ManagerFarmerOrdersSpreadsheetPage";

function FarmerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Routes>
        <Route path="login" element={<FarmerLoginPage />} />
        <Route element={<FarmerLayout />}>
          {/* ────────── FARMER ROUTES ────────── */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="community" element={<FarmerCommunityPage />} />
          <Route path="schemes" element={<GovernmentSchemesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<ProductAddPage />} />
          <Route path="products/:id" element={<Navigate to="/farmer/products" replace />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="harvest-orders" element={<HarvestOrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/add" element={<InventoryAddPage />} />
          <Route path="inventory/:id" element={<InventoryViewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* ────────── MANAGER ROUTES ────────── */}
          <Route path="manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="manager/farmers" element={<ManagerFarmersPage />} />
          <Route path="manager/farmers/add" element={<ManagerAddFarmerPage />} />
          <Route path="manager/farmers/:farmerId" element={<ManagerFarmerDetailPage />} />
          <Route path="manager/products" element={<ManagerProductsPage />} />
          <Route path="manager/inventory" element={<ManagerInventoryPage />} />
          <Route path="manager/inventory/history" element={<ManagerInventoryHistoryPage />} />
          <Route path="manager/orders" element={<ManagerOrdersPage />} />
          <Route path="manager/orders/farmer/:farmerId" element={<ManagerFarmerOrdersSpreadsheetPage />} />
          <Route path="manager/orders/create" element={<ManagerCreateOrderPage />} />
          <Route path="manager/earnings" element={<ManagerEarningsPage />} />
          <Route path="manager/earnings/farmer/:farmerId" element={<ManagerFarmerEarningsSpreadsheetPage />} />
          <Route path="manager/earnings/:farmerId" element={<ManagerFarmerEarningsSpreadsheetPage />} />
          <Route path="manager/documents" element={<ManagerDocumentsPage />} />
          <Route path="manager/profile" element={<ProfilePage />} />
          <Route path="manager" element={<Navigate to="manager/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Provider>
  );
}

export default FarmerRoutes;
