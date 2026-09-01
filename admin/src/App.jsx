import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import CeoDashboard from './pages/ceo/CeoDashboard';
import TraceabilityPage from './pages/traceability/TraceabilityPage';
import FarmersPage from './pages/erp/FarmersPage';
import Farmer360Page from './pages/erp/Farmer360Page';
import LocationMastersPage from './pages/erp/LocationMastersPage';
import ErpListPage from './pages/erp/ErpListPage';
import Categories from './pages/Categories';
import Products from './pages/Products';
import DarkStores from './pages/DarkStores';
import Coupons from './pages/Coupons';
import RewardPoints from './pages/RewardPoints';
import Login from './pages/Login';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<AdminLayout />}>
              <Route index element={<CeoDashboard />} />
              <Route path="welcome" element={<Dashboard />} />
              <Route path="traceability" element={<TraceabilityPage />} />
              <Route path="erp/locations" element={<LocationMastersPage />} />
              <Route path="erp/farmers" element={<FarmersPage />} />
              <Route path="erp/farmers/:id" element={<Farmer360Page />} />
              <Route path="erp/:resource" element={<ErpListPage />} />
              <Route path="products" element={<Products />} />
              <Route path="dark-stores" element={<DarkStores />} />
              <Route path="categories" element={<Categories />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="rewards" element={<RewardPoints />} />
              <Route path="sections" element={<Navigate to="/categories" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
