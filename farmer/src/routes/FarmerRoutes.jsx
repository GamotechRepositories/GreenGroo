import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { farmerStore } from "../store/farmerStore";
import FarmerLayout from "../components/layout/FarmerLayout";
import FarmerLoginPage from "../pages/FarmerLoginPage";
import FarmerRegisterPage from "../pages/FarmerRegisterPage";
import FarmerRegistrationSuccessPage from "../pages/FarmerRegistrationSuccessPage";
import FarmerKycPage from "../pages/FarmerKycPage";
import DocumentsPage from "../pages/DocumentsPage";
import DashboardPage from "../pages/DashboardPage";
import MarketPricesPage from "../pages/MarketPricesPage";
import FarmerCommunityPage from "../pages/FarmerCommunityPage";
import GovernmentSchemesPage from "../pages/GovernmentSchemesPage";
import ProductsPage from "../pages/ProductsPage";
import ProductAddPage from "../pages/ProductAddPage";
import ProductEditPage from "../pages/ProductEditPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductMediaPage from "../pages/ProductMediaPage";
import ProductPriceStockPage from "../pages/ProductPriceStockPage";
import ProductDetailsHubPage from "../pages/ProductDetailsHubPage";
import InventoryPage from "../pages/InventoryPage";
import InventoryAddPage from "../pages/InventoryAddPage";
import InventoryViewPage from "../pages/InventoryViewPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import OrderPreparePage from "../pages/OrderPreparePage";
import HarvestOrdersPage from "../pages/HarvestOrdersPage";
import EarningsPage from "../pages/EarningsPage";
import ProfilePage from "../pages/ProfilePage";
import FarmerProfilePage from "../pages/FarmerProfilePage";
import FarmProfilePage from "../pages/FarmProfilePage";
import FarmLocationPage from "../pages/FarmLocationPage";
import CropsPage from "../pages/CropsPage";
import CropFormPage from "../pages/CropFormPage";
import CropDetailPage from "../pages/CropDetailPage";
import CropPlanPage from "../pages/CropPlanPage";
import CropPlanningPage from "../pages/CropPlanningPage";

// Manager Pages
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerFarmersPage from "../pages/manager/ManagerFarmersPage";
import ManagerAddFarmerPage from "../pages/manager/ManagerAddFarmerPage";
import ManagerFarmerDetailPage from "../pages/manager/ManagerFarmerDetailPage";
import ManagerFarmerCropViewPage from "../pages/manager/ManagerFarmerCropViewPage";
import ManagerFarmerCropFormPage from "../pages/manager/ManagerFarmerCropFormPage";
import ManagerProductsPage from "../pages/manager/ManagerProductsPage";
import ManagerInventoryPage from "../pages/manager/ManagerInventoryPage";
import ManagerInventoryHistoryPage from "../pages/manager/ManagerInventoryHistoryPage";
import ManagerOrdersPage from "../pages/manager/ManagerOrdersPage";
import ManagerCreateOrderPage from "../pages/manager/ManagerCreateOrderPage";
import ManagerEarningsPage from "../pages/manager/ManagerEarningsPage";
import ManagerFarmerEarningsSpreadsheetPage from "../pages/manager/ManagerFarmerEarningsSpreadsheetPage";
import ManagerDocumentsPage from "../pages/manager/ManagerDocumentsPage";
import ManagerFarmerOrdersSpreadsheetPage from "../pages/manager/ManagerFarmerOrdersSpreadsheetPage";
import ManagerPickupsPage from "../pages/manager/ManagerPickupsPage";
import ManagerPickupDetailPage from "../pages/manager/ManagerPickupDetailPage";
import ManagerReceivePage from "../pages/manager/ManagerReceivePage";
import ManagerQualityListPage from "../pages/manager/ManagerQualityListPage";
import ManagerQualityInspectionPage from "../pages/manager/ManagerQualityInspectionPage";

function FarmerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Routes>
        <Route path="login" element={<FarmerLoginPage />} />
        <Route path="register" element={<FarmerRegisterPage />} />
        <Route path="register/success" element={<FarmerRegistrationSuccessPage />} />
        <Route element={<FarmerLayout />}>
          {/* ────────── FARMER ROUTES ────────── */}
          <Route index element={<Navigate to="/farmer/dashboard" replace />} />
          <Route path="kyc" element={<FarmerKycPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="community" element={<FarmerCommunityPage />} />
          <Route path="schemes" element={<GovernmentSchemesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<ProductAddPage />} />
          <Route path="products/details" element={<ProductDetailsHubPage />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="products/:id/media" element={<ProductMediaPage />} />
          <Route path="products/:id/stock" element={<ProductPriceStockPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="harvest-orders" element={<HarvestOrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/add" element={<InventoryAddPage />} />
          <Route path="inventory/:id" element={<InventoryViewPage />} />
          <Route path="orders" element={<Navigate to="/farmer/orders/new" replace />} />
          <Route path="orders/new" element={<OrdersPage filter="new" />} />
          <Route path="orders/preparing" element={<OrdersPage filter="preparing" />} />
          <Route path="orders/ready" element={<OrdersPage filter="ready" />} />
          <Route path="orders/completed" element={<OrdersPage filter="completed" />} />
          <Route path="orders/rejected" element={<OrdersPage filter="rejected" />} />
          <Route path="orders/:id/prepare" element={<OrderPreparePage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="profile" element={<FarmerProfilePage />} />
          <Route path="farm-profile" element={<FarmProfilePage />} />
          <Route path="farm-location" element={<FarmLocationPage />} />
          <Route path="crops" element={<CropsPage />} />
          <Route path="crops/add" element={<CropFormPage />} />
          <Route path="crops/:cropId/edit" element={<CropFormPage />} />
          <Route path="crops/:cropId/plan" element={<CropPlanPage />} />
          <Route path="crops/:cropId" element={<CropDetailPage />} />
          <Route path="crop-planning" element={<CropPlanningPage />} />

          {/* ────────── MANAGER ROUTES ────────── */}
          <Route path="manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="manager/farmers" element={<ManagerFarmersPage />} />
          <Route path="manager/farmers/add" element={<ManagerAddFarmerPage />} />
          <Route path="manager/farmers/:farmerId/crops/add" element={<ManagerFarmerCropFormPage />} />
          <Route path="manager/farmers/:farmerId/crops/:cropId/edit" element={<ManagerFarmerCropFormPage />} />
          <Route path="manager/farmers/:farmerId/crops/:cropId" element={<ManagerFarmerCropViewPage />} />
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
          <Route path="manager/pickups" element={<Navigate to="/farmer/manager/pickups/ready" replace />} />
          <Route path="manager/pickups/requests" element={<Navigate to="/farmer/manager/pickups/ready" replace />} />
          <Route path="manager/pickups/ready" element={<ManagerPickupsPage mode="ready" />} />
          <Route path="manager/pickups/assigned" element={<ManagerPickupsPage mode="assigned" />} />
          <Route path="manager/pickups/today" element={<ManagerPickupsPage mode="today" />} />
          <Route path="manager/pickups/active" element={<ManagerPickupsPage mode="active" />} />
          <Route path="manager/pickups/incoming" element={<ManagerPickupsPage mode="incoming" />} />
          <Route path="manager/pickups/qr" element={<Navigate to="/farmer/manager/pickups/ready" replace />} />
          <Route path="manager/pickups/completed" element={<ManagerPickupsPage mode="history" />} />
          <Route path="manager/pickups/history" element={<ManagerPickupsPage mode="history" />} />
          <Route path="manager/pickups/:pickupId/receive" element={<ManagerReceivePage />} />
          <Route path="manager/pickups/:pickupId" element={<ManagerPickupDetailPage />} />
          <Route path="manager/quality" element={<Navigate to="/farmer/manager/quality/pending" replace />} />
          <Route path="manager/quality/pending" element={<ManagerQualityListPage mode="pending" />} />
          <Route path="manager/quality/inspection" element={<ManagerQualityListPage mode="inspection" />} />
          <Route path="manager/quality/grading" element={<ManagerQualityListPage mode="grading" />} />
          <Route path="manager/quality/completed" element={<ManagerQualityListPage mode="completed" />} />
          <Route path="manager/quality/:orderId" element={<ManagerQualityInspectionPage />} />
          <Route path="manager/documents" element={<ManagerDocumentsPage />} />
          <Route path="manager/profile" element={<ProfilePage />} />
          <Route path="manager" element={<Navigate to="/farmer/manager/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/farmer/dashboard" replace />} />
        </Route>
      </Routes>
    </Provider>
  );
}

export default FarmerRoutes;
