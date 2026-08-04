import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import AdminRoute from "../components/admin/AdminRoute";
import OverviewSection from "../components/admin/sections/OverviewSection";
import AdminProfileSection from "../components/admin/sections/AdminProfileSection";
import BannerSection from "../components/admin/sections/BannerSection";
import OfferBannerSection from "../components/admin/sections/OfferBannerSection";
import AddCategorySection from "../components/admin/sections/AddCategorySection";
import ShowCategorySection from "../components/admin/sections/ShowCategorySection";
import AddProductSection from "../components/admin/sections/AddProductSection";
import ShowProductSection from "../components/admin/sections/ShowProductSection";
import UserSection from "../components/admin/sections/UserSection";
import CreateOrderSection from "../components/admin/sections/CreateOrderSection";
import OrderSection from "../components/admin/sections/OrderSection";
import AdminOrderDetailSection from "../components/admin/sections/AdminOrderDetailSection";
import AdminOrderInvoice from "./AdminOrderInvoice";
import PaymentSection from "../components/admin/sections/PaymentSection";
import RevenueSection from "../components/admin/sections/RevenueSection";
import SupportSection from "../components/admin/sections/SupportSection";
import AddBrandSection from "../components/admin/sections/AddBrandSection";
import ShowBrandSection from "../components/admin/sections/ShowBrandSection";
import AddTestimonialSection from "../components/admin/sections/AddTestimonialSection";
import ShowTestimonialSection from "../components/admin/sections/ShowTestimonialSection";
import StoreSettingsSection from "../components/admin/sections/StoreSettingsSection";
import AddCouponSection from "../components/admin/sections/AddCouponSection";
import ShowCouponSection from "../components/admin/sections/ShowCouponSection";
import PromotionalNotificationSection from "../components/admin/sections/PromotionalNotificationSection";
import AdminLogin from "./AdminLogin";

function Admin() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="orders/:id/invoice" element={<AdminOrderInvoice />} />
        <Route element={<AdminLayout />}>
          <Route index element={<OverviewSection />} />
          <Route path="profile" element={<AdminProfileSection />} />
          <Route path="banners" element={<BannerSection />} />
          <Route path="offer-banners" element={<OfferBannerSection />} />
          <Route path="categories/add" element={<AddCategorySection />} />
          <Route path="categories/show" element={<ShowCategorySection />} />
          <Route path="categories" element={<Navigate to="show" replace />} />
          <Route path="products/add" element={<AddProductSection />} />
          <Route path="products/show" element={<ShowProductSection />} />
          <Route path="products" element={<Navigate to="show" replace />} />
          <Route path="brands/add" element={<AddBrandSection />} />
          <Route path="brands/show" element={<ShowBrandSection />} />
          <Route path="brands" element={<Navigate to="show" replace />} />
          <Route path="testimonials/add" element={<AddTestimonialSection />} />
          <Route path="testimonials/show" element={<ShowTestimonialSection />} />
          <Route path="testimonials" element={<Navigate to="show" replace />} />
          <Route path="settings" element={<StoreSettingsSection />} />
          <Route path="coupons/add" element={<AddCouponSection />} />
          <Route path="coupons/show" element={<ShowCouponSection />} />
          <Route path="coupons" element={<Navigate to="show" replace />} />
          <Route path="users" element={<UserSection />} />
          <Route path="orders/create" element={<CreateOrderSection />} />
          <Route path="orders/:id" element={<AdminOrderDetailSection />} />
          <Route path="orders" element={<OrderSection />} />
          <Route path="payments" element={<PaymentSection />} />
          <Route path="revenue" element={<RevenueSection />} />
          <Route path="payment-proofs" element={<Navigate to="/revenue" replace />} />
          <Route path="support" element={<SupportSection />} />
          <Route path="promotional-notifications" element={<PromotionalNotificationSection />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default Admin;
