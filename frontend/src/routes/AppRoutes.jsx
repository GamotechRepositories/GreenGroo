import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MobileLayout from "../layouts/MobileLayout";
import Layout from "../components/layout/Layout";

// Main & Core Pages
import Home from "../pages/Home";
import Orders from "../pages/Orders";
import OrderDetail from "../pages/OrderDetail";
import OrderInvoice from "../pages/OrderInvoice";
import Profile from "../pages/Profile";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Support from "../pages/Support";
import Product from "../pages/Product";
import ProductDetail from "../pages/ProductDetail";
import JustArrivedPage from "../pages/JustArrivedPage";
import HotSellingPage from "../pages/HotSellingPage";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Checkout from "../pages/Checkout";
import Coupons from "../pages/Coupons";
import Blog from "../pages/Blog";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsAndConditions from "../pages/TermsAndConditions";
import ShippingDetails from "../pages/ShippingDetails";
import Location from "../pages/Location";
import Categories from "../pages/Categories";

// Section Views
import {
  GreenGroccHome,
  GreenGroccShop,
  GreenGroccProductDetails,
  GreenGroccCategory,
  GreenGroccCart,
  GreenGroccCheckout,
} from "../sections/GreenGrocc";

import {
  Ready2CookHome,
  Ready2CookShop,
  Ready2CookProductDetails,
  Ready2CookCategory,
  Ready2CookCart,
  Ready2CookCheckout,
} from "../sections/Ready2Cook";

import {
  SuperMallHome,
  SuperMallShop,
  SuperMallProductDetails,
  SuperMallCategory,
  SuperMallCart,
  SuperMallCheckout,
} from "../sections/SuperMall";

export function AppRoutes() {
  return (
    <Routes>
      {/* Core Root & Parameterized Routes */}
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
      <Route path="/orders/:id/invoice" element={<OrderInvoice />} />
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

      {/* 1. GreenGrocc Section Routes */}
      <Route path="/greengrocc" element={<MobileLayout><GreenGroccHome /></MobileLayout>} />
      <Route path="/greengrocc/shop" element={<MobileLayout><GreenGroccShop /></MobileLayout>} />
      <Route path="/greengrocc/category/:categoryId" element={<MobileLayout><GreenGroccCategory /></MobileLayout>} />
      <Route path="/greengrocc/product/:productId" element={<MobileLayout><GreenGroccProductDetails /></MobileLayout>} />
      <Route path="/greengrocc/cart" element={<MobileLayout><GreenGroccCart /></MobileLayout>} />
      <Route path="/greengrocc/checkout" element={<MobileLayout><GreenGroccCheckout /></MobileLayout>} />

      {/* 2. Ready2Cook Section Routes */}
      <Route path="/ready2cook" element={<MobileLayout><Ready2CookHome /></MobileLayout>} />
      <Route path="/ready2cook/shop" element={<MobileLayout><Ready2CookShop /></MobileLayout>} />
      <Route path="/ready2cook/category/:categoryId" element={<MobileLayout><Ready2CookCategory /></MobileLayout>} />
      <Route path="/ready2cook/product/:productId" element={<MobileLayout><Ready2CookProductDetails /></MobileLayout>} />
      <Route path="/ready2cook/cart" element={<MobileLayout><Ready2CookCart /></MobileLayout>} />
      <Route path="/ready2cook/checkout" element={<MobileLayout><Ready2CookCheckout /></MobileLayout>} />

      {/* 3. SuperMall Section Routes */}
      <Route path="/super-mall" element={<MobileLayout><SuperMallHome /></MobileLayout>} />
      <Route path="/super-mall/shop" element={<MobileLayout><SuperMallShop /></MobileLayout>} />
      <Route path="/super-mall/category/:categoryId" element={<MobileLayout><SuperMallCategory /></MobileLayout>} />
      <Route path="/super-mall/product/:productId" element={<MobileLayout><SuperMallProductDetails /></MobileLayout>} />
      <Route path="/super-mall/cart" element={<MobileLayout><SuperMallCart /></MobileLayout>} />
      <Route path="/super-mall/checkout" element={<MobileLayout><SuperMallCheckout /></MobileLayout>} />

      {/* Additional Static / Informational Pages */}
      <Route path="/about" element={<MobileLayout><About /></MobileLayout>} />
      <Route path="/contact" element={<MobileLayout><Contact /></MobileLayout>} />
      <Route path="/support" element={<MobileLayout><Support /></MobileLayout>} />
      <Route path="/blog" element={<MobileLayout><Blog /></MobileLayout>} />
      <Route path="/privacy-policy" element={<MobileLayout><PrivacyPolicy /></MobileLayout>} />
      <Route path="/terms-and-conditions" element={<MobileLayout><TermsAndConditions /></MobileLayout>} />
      <Route path="/shipping-details" element={<MobileLayout><ShippingDetails /></MobileLayout>} />
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
  );
}

export default AppRoutes;
