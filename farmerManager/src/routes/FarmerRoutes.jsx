import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { farmerStore } from "../store/farmerStore";
import FarmerLayout from "../components/layout/FarmerLayout";
import FarmerLoginPage from "../pages/FarmerLoginPage";
import OrderScanPage from "../pages/OrderScanPage";
import ProfilePage from "../pages/ProfilePage";
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerSearchPage from "../pages/manager/ManagerSearchPage";
import ManagerFarmersPage from "../pages/manager/ManagerFarmersPage";
import ManagerAddFarmerPage from "../pages/manager/ManagerAddFarmerPage";
import ManagerFarmerDetailPage from "../pages/manager/ManagerFarmerDetailPage";
import ManagerFarmerCropViewPage from "../pages/manager/ManagerFarmerCropViewPage";
import ManagerFarmerCropFormPage from "../pages/manager/ManagerFarmerCropFormPage";
import ManagerProductAddPage from "../pages/manager/ManagerProductAddPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductEditPage from "../pages/ProductEditPage";
import ProductMediaPage from "../pages/ProductMediaPage";
import ProductPriceStockPage from "../pages/ProductPriceStockPage";
import ProductDetailsHubPage from "../pages/ProductDetailsHubPage";
import CropPlanPage from "../pages/CropPlanPage";
import CropsPage from "../pages/CropsPage";
import ProductsPage from "../pages/ProductsPage";
import CropPlanningPage from "../pages/CropPlanningPage";
import InventoryPage from "../pages/InventoryPage";
import InventoryAddPage from "../pages/InventoryAddPage";
import InventoryViewPage from "../pages/InventoryViewPage";
import ManagerInventoryHistoryPage from "../pages/manager/ManagerInventoryHistoryPage";
import ManagerStockAuditDetailPage from "../pages/manager/ManagerStockAuditDetailPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import OrderPreparePage from "../pages/OrderPreparePage";
import HarvestOrdersPage from "../pages/HarvestOrdersPage";
import ManagerOrdersPage from "../pages/manager/ManagerOrdersPage";
import ManagerOrderDetailPage from "../pages/manager/ManagerOrderDetailPage";
import ManagerStatusOrdersSheetPage from "../pages/manager/ManagerStatusOrdersSheetPage";
import ManagerProductFarmersPage from "../pages/manager/ManagerProductFarmersPage";
import ManagerProductOrdersSpreadsheetPage from "../pages/manager/ManagerProductOrdersSpreadsheetPage";
import ManagerCreateOrderPage from "../pages/manager/ManagerCreateOrderPage";
import ManagerEarningsPage from "../pages/manager/ManagerEarningsPage";
import ManagerEarningReportPage from "../pages/manager/ManagerEarningReportPage";
import ManagerDocumentsPage from "../pages/manager/ManagerDocumentsPage";
import ManagerLeavePage from "../pages/manager/ManagerLeavePage";
import ManagerPoliciesPage from "../pages/manager/ManagerPoliciesPage";
import ManagerFarmerOrdersSpreadsheetPage from "../pages/manager/ManagerFarmerOrdersSpreadsheetPage";
import ManagerPickupsPage from "../pages/manager/ManagerPickupsPage";
import ManagerDriversPage from "../pages/manager/ManagerDriversPage";
import ManagerBatchPage from "../pages/manager/ManagerBatchPage";
import ManagerPickupDetailPage from "../pages/manager/ManagerPickupDetailPage";
import ManagerReceivePage from "../pages/manager/ManagerReceivePage";
import ManagerQualityListPage from "../pages/manager/ManagerQualityListPage";
import ManagerQualityInspectionPage from "../pages/manager/ManagerQualityInspectionPage";

function ManagerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Routes>
        <Route path="login" element={<FarmerLoginPage />} />
        <Route element={<FarmerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="search" element={<ManagerSearchPage />} />
          <Route path="farmers" element={<ManagerFarmersPage />} />
          <Route path="farmers/add" element={<ManagerAddFarmerPage />} />
          <Route path="farmers/:farmerId/crops/add" element={<ManagerFarmerCropFormPage />} />
          <Route path="farmers/:farmerId/crops/:cropId/edit" element={<ManagerFarmerCropFormPage />} />
          <Route path="farmers/:farmerId/crops/:cropId/plan" element={<CropPlanPage />} />
          <Route path="farmers/:farmerId/crops/:cropId" element={<ManagerFarmerCropViewPage />} />
          <Route path="farmers/:farmerId/products/add" element={<ManagerProductAddPage />} />
          <Route path="farmers/:farmerId/products/:id/edit" element={<ProductEditPage />} />
          <Route path="farmers/:farmerId/products/:id/media" element={<ProductMediaPage />} />
          <Route path="farmers/:farmerId/products/:id/stock" element={<ProductPriceStockPage />} />
          <Route path="farmers/:farmerId/products/:id" element={<ProductDetailPage />} />
          <Route path="farmers/:farmerId/inventory/add" element={<InventoryAddPage />} />
          <Route path="farmers/:farmerId/inventory/:id" element={<InventoryViewPage />} />
          <Route path="farmers/:farmerId" element={<ManagerFarmerDetailPage />} />
          <Route path="crops" element={<CropsPage />} />
          <Route path="crops/add" element={<ManagerFarmerCropFormPage />} />
          <Route path="crop-planning" element={<CropPlanningPage />} />
          <Route path="products/add" element={<ManagerProductAddPage />} />
          <Route path="products/details" element={<ProductDetailsHubPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory/add" element={<InventoryAddPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/history" element={<ManagerInventoryHistoryPage />} />
          <Route path="inventory/history/:id" element={<ManagerStockAuditDetailPage />} />
          <Route path="inventory/audit/:id" element={<ManagerStockAuditDetailPage />} />
          <Route path="harvest-orders" element={<HarvestOrdersPage />} />
          <Route path="orders" element={<Navigate to="/manager/orders/new" replace />} />
          <Route path="orders/new" element={<OrdersPage filter="new" />} />
          <Route path="orders/preparing" element={<OrdersPage filter="preparing" />} />
          <Route path="orders/ready" element={<OrdersPage filter="ready" />} />
          <Route path="orders/completed" element={<OrdersPage filter="completed" />} />
          <Route path="orders/rejected" element={<OrdersPage filter="rejected" />} />
          <Route path="orders/:id/prepare" element={<OrderPreparePage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/detail/:orderId" element={<OrderDetailPage />} />
          <Route path="orders/all" element={<ManagerOrdersPage />} />
          <Route path="orders/accepted" element={<ManagerStatusOrdersSheetPage />} />
          <Route path="orders/create" element={<ManagerCreateOrderPage />} />
          <Route path="orders/product/:productKey/farmers" element={<ManagerProductFarmersPage />} />
          <Route path="orders/product/:productKey" element={<ManagerProductOrdersSpreadsheetPage />} />
          <Route path="orders/farmer/:farmerId" element={<ManagerFarmerOrdersSpreadsheetPage />} />
          <Route path="earnings" element={<ManagerEarningsPage />} />
          <Route path="earnings/payments" element={<ManagerEarningsPage defaultTab="payments" />} />
          <Route path="earnings/:orderId" element={<ManagerEarningReportPage />} />
          <Route path="earnings/farmer/:farmerId" element={<ManagerEarningsPage />} />
          <Route path="earnings/farmer/:farmerId/product/:productId" element={<ManagerEarningsPage />} />
          <Route path="drivers" element={<ManagerDriversPage />} />
          <Route path="pickups" element={<Navigate to="/manager/pickups/ready" replace />} />
          <Route path="pickups/requests" element={<Navigate to="/manager/pickups/ready" replace />} />
          <Route path="pickups/ready" element={<ManagerPickupsPage mode="ready" />} />
          <Route path="pickups/assigned" element={<ManagerPickupsPage mode="assigned" />} />
          <Route path="pickups/today" element={<ManagerPickupsPage mode="today" />} />
          <Route path="pickups/all" element={<ManagerPickupsPage mode="all" />} />
          <Route path="pickups/active" element={<Navigate to="/manager/pickups/all" replace />} />
          <Route path="pickups/incoming" element={<ManagerPickupsPage mode="incoming" />} />
          <Route path="pickups/centre" element={<ManagerPickupsPage mode="centre" />} />
          <Route path="pickups/batches/:batchId" element={<ManagerBatchPage />} />
          <Route path="pickups/qr" element={<Navigate to="/manager/pickups/ready" replace />} />
          <Route path="pickups/completed" element={<ManagerPickupsPage mode="history" />} />
          <Route path="pickups/history" element={<ManagerPickupsPage mode="history" />} />
          <Route path="pickups/:pickupId/receive" element={<ManagerReceivePage />} />
          <Route path="pickups/:pickupId" element={<ManagerPickupDetailPage />} />
          <Route path="quality" element={<Navigate to="/manager/quality/all" replace />} />
          <Route path="quality/pending" element={<ManagerQualityListPage mode="pending" />} />
          <Route path="quality/all" element={<ManagerQualityListPage mode="all" />} />
          <Route path="quality/inspection" element={<ManagerQualityListPage mode="inspection" />} />
          <Route path="quality/grading" element={<Navigate to="/manager/quality/inspection" replace />} />
          <Route path="quality/completed" element={<ManagerQualityListPage mode="completed" />} />
          <Route path="quality/:orderId" element={<ManagerQualityInspectionPage />} />
          <Route path="documents" element={<ManagerDocumentsPage />} />
          <Route path="policies" element={<ManagerPoliciesPage />} />
          <Route path="leave" element={<ManagerLeavePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="scan/:code" element={<OrderScanPage />} />
          <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
        </Route>
      </Routes>
    </Provider>
  );
}

export default ManagerRoutes;
