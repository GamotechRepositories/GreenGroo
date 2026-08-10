import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { farmerStore } from "../store/farmerStore";
import FarmerLayout from "../components/layout/FarmerLayout";
import FarmerLoginPage from "../pages/FarmerLoginPage";
import DocumentsPage from "../pages/DocumentsPage";
import DashboardPage from "../pages/DashboardPage";
import ProductsPage from "../pages/ProductsPage";
import ProductAddPage from "../pages/ProductAddPage";
import ProductEditPage from "../pages/ProductEditPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import InventoryPage from "../pages/InventoryPage";
import InventoryAddPage from "../pages/InventoryAddPage";
import InventoryViewPage from "../pages/InventoryViewPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import EarningsPage from "../pages/EarningsPage";
import ProfilePage from "../pages/ProfilePage";

function FarmerRoutes() {
  return (
    <Provider store={farmerStore}>
      <Routes>
        <Route path="login" element={<FarmerLoginPage />} />
        <Route element={<FarmerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<ProductAddPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/add" element={<InventoryAddPage />} />
          <Route path="inventory/:id" element={<InventoryViewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Provider>
  );
}

export default FarmerRoutes;
