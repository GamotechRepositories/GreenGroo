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
import OrderScanPage from "../pages/OrderScanPage";
import HarvestOrdersPage from "../pages/HarvestOrdersPage";
import EarningsPage from "../pages/EarningsPage";
import FarmerProfilePage from "../pages/FarmerProfilePage";
import FarmProfilePage from "../pages/FarmProfilePage";
import FarmLocationPage from "../pages/FarmLocationPage";
import CropsPage from "../pages/CropsPage";
import CropFormPage from "../pages/CropFormPage";
import CropDetailPage from "../pages/CropDetailPage";
import CropPlanPage from "../pages/CropPlanPage";
import CropPlanningPage from "../pages/CropPlanningPage";

function FarmerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Routes>
        <Route path="login" element={<FarmerLoginPage />} />
        <Route path="register" element={<FarmerRegisterPage />} />
        <Route path="register/success" element={<FarmerRegistrationSuccessPage />} />
        <Route element={<FarmerLayout />}>
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
          <Route path="scan/:code" element={<OrderScanPage />} />
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
          <Route path="manager/*" element={<Navigate to="/farmer/login" replace />} />
          <Route path="*" element={<Navigate to="/farmer/dashboard" replace />} />
        </Route>
      </Routes>
    </Provider>
  );
}

export default FarmerRoutes;
