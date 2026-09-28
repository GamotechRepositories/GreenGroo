import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { farmerStore } from "../store/farmerStore";
import FarmerLayout from "../components/layout/FarmerLayout";
import FarmerLoginPage from "../pages/FarmerLoginPage";

const FarmerRegisterPage = lazy(() => import("../pages/FarmerRegisterPage"));
const FarmerRegistrationSuccessPage = lazy(() => import("../pages/FarmerRegistrationSuccessPage"));
const FarmerKycPage = lazy(() => import("../pages/FarmerKycPage"));
const DocumentsPage = lazy(() => import("../pages/DocumentsPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const GovernmentSchemesPage = lazy(() => import("../pages/GovernmentSchemesPage"));
const ProductsPage = lazy(() => import("../pages/ProductsPage"));
const ProductAddPage = lazy(() => import("../pages/ProductAddPage"));
const ProductEditPage = lazy(() => import("../pages/ProductEditPage"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage"));
const ProductMediaPage = lazy(() => import("../pages/ProductMediaPage"));
const ProductPriceStockPage = lazy(() => import("../pages/ProductPriceStockPage"));
const ProductDetailsHubPage = lazy(() => import("../pages/ProductDetailsHubPage"));
const InventoryPage = lazy(() => import("../pages/InventoryPage"));
const InventoryAddPage = lazy(() => import("../pages/InventoryAddPage"));
const InventoryViewPage = lazy(() => import("../pages/InventoryViewPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("../pages/OrderDetailPage"));
const OrderPreparePage = lazy(() => import("../pages/OrderPreparePage"));
const OrderScanPage = lazy(() => import("../pages/OrderScanPage"));
const HarvestOrdersPage = lazy(() => import("../pages/HarvestOrdersPage"));
const EarningsPage = lazy(() => import("../pages/EarningsPage"));
const EarningReportPage = lazy(() => import("../pages/EarningReportPage"));
const FarmerProfilePage = lazy(() => import("../pages/FarmerProfilePage"));
const FarmProfilePage = lazy(() => import("../pages/FarmProfilePage"));
const FarmLocationPage = lazy(() => import("../pages/FarmLocationPage"));
const CropsPage = lazy(() => import("../pages/CropsPage"));
const CropFormPage = lazy(() => import("../pages/CropFormPage"));
const CropDetailPage = lazy(() => import("../pages/CropDetailPage"));
const CropPlanPage = lazy(() => import("../pages/CropPlanPage"));
const CropPlanningPage = lazy(() => import("../pages/CropPlanningPage"));
const PoliciesPage = lazy(() => import("../pages/PoliciesPage"));

function FarmerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="login" element={<FarmerLoginPage />} />
          <Route path="register" element={<FarmerRegisterPage />} />
          <Route path="register/success" element={<FarmerRegistrationSuccessPage />} />
          <Route element={<FarmerLayout />}>
            <Route index element={<Navigate to="/farmer/dashboard" replace />} />
            <Route path="kyc" element={<FarmerKycPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="policies" element={<PoliciesPage roleKey="farmer" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="market-prices" element={<Navigate to="/farmer/dashboard" replace />} />
            <Route path="community" element={<Navigate to="/farmer/dashboard" replace />} />
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
            <Route path="earnings/product/:productId" element={<EarningsPage />} />
            <Route path="earnings/:orderId" element={<EarningReportPage />} />
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
      </Suspense>
    </Provider>
  );
}

export default FarmerRoutes;
