import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LocationProvider } from "./context/LocationContext";
import AuthModal from "./components/auth/AuthModal";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/layout/ScrollToTop";
import MobileLayout from "./layouts/MobileLayout";
import OnboardingScreen, { isOnboardingComplete } from "./components/grocery/OnboardingScreen";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderInvoice from "./pages/OrderInvoice";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Product from "./pages/Product";
import ProductDetail from "./pages/ProductDetail";
import JustArrivedPage from "./pages/JustArrivedPage";
import HotSellingPage from "./pages/HotSellingPage";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Coupons from "./pages/Coupons";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ShippingDetails from "./pages/ShippingDetails";
import Location from "./pages/Location";
import Categories from "./pages/Categories";
import FloatingCornerActions from "./components/layout/FloatingCornerActions";

function AuthModalHost() {
  const { authModal, closeAuthModal, setAuthModal } = useAuth();

  if (!authModal) return null;

  return (
    <AuthModal
      mode={authModal}
      onClose={closeAuthModal}
      onSwitchMode={setAuthModal}
    />
  );
}

function OnboardingGate({ children }) {
  const [done, setDone] = useState(() => isOnboardingComplete());

  if (!done) {
    return <OnboardingScreen onComplete={() => setDone(true)} />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LocationProvider>
        <OnboardingGate>
          <AuthProvider>
            <CartProvider>
            <WishlistProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <MobileLayout>
                    <Home />
                  </MobileLayout>
                }
              />
              <Route
                path="/location"
                element={
                  <MobileLayout>
                    <Location />
                  </MobileLayout>
                }
              />
              <Route
                path="/categories"
                element={
                  <MobileLayout>
                    <Categories />
                  </MobileLayout>
                }
              />
              <Route
                path="/orders"
                element={
                  <MobileLayout>
                    <Orders />
                  </MobileLayout>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <MobileLayout>
                    <OrderDetail />
                  </MobileLayout>
                }
              />
              <Route
                path="/orders/:id/invoice"
                element={<OrderInvoice />}
              />
              <Route
                path="/profile"
                element={
                  <MobileLayout>
                    <Profile />
                  </MobileLayout>
                }
              />
              <Route
                path="/cart"
                element={
                  <MobileLayout>
                    <Cart />
                  </MobileLayout>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <MobileLayout>
                    <Wishlist />
                  </MobileLayout>
                }
              />
              <Route
                path="/checkout"
                element={
                  <MobileLayout>
                    <Checkout />
                  </MobileLayout>
                }
              />
              <Route
                path="/coupons"
                element={
                  <MobileLayout>
                    <Coupons />
                  </MobileLayout>
                }
              />
              <Route
                path="/just-arrived"
                element={
                  <MobileLayout>
                    <JustArrivedPage />
                  </MobileLayout>
                }
              />
              <Route
                path="/hot-selling"
                element={
                  <MobileLayout>
                    <HotSellingPage />
                  </MobileLayout>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <MobileLayout>
                    <ProductDetail />
                  </MobileLayout>
                }
              />
              <Route
                path="/product"
                element={
                  <MobileLayout>
                    <Product />
                  </MobileLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <MobileLayout>
                    <About />
                  </MobileLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <MobileLayout>
                    <Contact />
                  </MobileLayout>
                }
              />
              <Route
                path="/support"
                element={
                  <MobileLayout>
                    <Support />
                  </MobileLayout>
                }
              />
              <Route
                path="/blog"
                element={
                  <MobileLayout>
                    <Blog />
                  </MobileLayout>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <MobileLayout>
                    <PrivacyPolicy />
                  </MobileLayout>
                }
              />
              <Route
                path="/terms-and-conditions"
                element={
                  <MobileLayout>
                    <TermsAndConditions />
                  </MobileLayout>
                }
              />
              <Route
                path="/shipping-details"
                element={
                  <MobileLayout>
                    <ShippingDetails />
                  </MobileLayout>
                }
              />
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                      <Route path="/shipping-details" element={<ShippingDetails />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
            <FloatingCornerActions />
            <AuthModalHost />
            </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </OnboardingGate>
      </LocationProvider>
    </BrowserRouter>
  );
}

export default App;
