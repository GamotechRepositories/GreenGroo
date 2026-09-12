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
import GiftCards from './pages/ops/GiftCards';
import DynamicPricing from './pages/ops/DynamicPricing';
import BulkSelling from './pages/ops/BulkSelling';
import BulkImportExport from './pages/ops/BulkImportExport';
import CsvImportExport from './pages/ops/CsvImportExport';
import MultiVendor from './pages/ops/MultiVendor';
import HrManagement from './pages/ops/HrManagement';
import HrCalendarPage from './pages/hr/HrCalendarPage';
import HrAnnouncementsPage from './pages/hr/HrAnnouncementsPage';
import HrLeavePage from './pages/hr/HrLeavePage';
import HrMyLeavePage from './pages/hr/HrMyLeavePage';
import HrEmployeesPage from './pages/hr/HrEmployeesPage';
import HrEmployeeProfilePage from './pages/hr/HrEmployeeProfilePage';
import HrPayrollPage from './pages/hr/HrPayrollPage';
import HrRecruitmentPage from './pages/hr/HrRecruitmentPage';
import HrAttendancePage from './pages/hr/HrAttendancePage';
import DeliveryManagement from './pages/ops/DeliveryManagement';
import DeliveryTeamPage from './pages/ops/DeliveryTeamPage';
import DeliveryManager360Page from './pages/ops/DeliveryManager360Page';
import DeliveryBoy360Page from './pages/ops/DeliveryBoy360Page';
import DeliveryTracking from './pages/ops/DeliveryTracking';
import StoreSupport from './pages/ops/StoreSupport';
import FinanceManagement from './pages/ops/FinanceManagement';
import RefundWarranty from './pages/ops/RefundWarranty';
import Reports from './pages/ops/Reports';
import InventoryHubPage from './pages/inventory/InventoryHubPage';
import InventoryDetailPage from './pages/inventory/InventoryDetailPage';

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
              <Route path="inventory" element={<InventoryHubPage />} />
              <Route path="inventory/:type/:id" element={<InventoryDetailPage />} />
              <Route path="dark-stores" element={<DarkStores />} />
              <Route path="categories" element={<Categories />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="rewards" element={<RewardPoints />} />
              <Route path="gift-cards" element={<GiftCards />} />
              <Route path="dynamic-pricing" element={<DynamicPricing />} />
              <Route path="bulk-selling" element={<BulkSelling />} />
              <Route path="bulk-import-export" element={<BulkImportExport />} />
              <Route path="csv-import-export" element={<CsvImportExport />} />
              <Route path="multi-vendor" element={<MultiVendor />} />
              <Route path="hr-management" element={<HrManagement />} />
              <Route path="hr-management/calendar" element={<HrCalendarPage />} />
              <Route path="hr-management/announcements" element={<HrAnnouncementsPage />} />
              <Route path="hr-management/leave" element={<HrLeavePage />} />
              <Route path="hr-management/my-leave" element={<HrMyLeavePage />} />
              <Route path="hr-management/employees" element={<HrEmployeesPage />} />
              <Route path="hr-management/employees/:type/:id" element={<HrEmployeeProfilePage />} />
              <Route path="hr-management/payroll" element={<HrPayrollPage />} />
              <Route path="hr-management/recruitment" element={<HrRecruitmentPage />} />
              <Route path="hr-management/attendance" element={<HrAttendancePage />} />
              <Route path="delivery-management" element={<DeliveryManagement />} />
              <Route path="delivery-team" element={<DeliveryTeamPage />} />
              <Route path="delivery-team/managers/:id" element={<DeliveryManager360Page />} />
              <Route path="delivery-team/boys/:id" element={<DeliveryBoy360Page />} />
              <Route path="delivery-tracking" element={<DeliveryTracking />} />
              <Route path="store-support" element={<StoreSupport />} />
              <Route path="finance" element={<FinanceManagement />} />
              <Route path="refund-warranty" element={<RefundWarranty />} />
              <Route path="reports" element={<Reports />} />
              <Route path="sections" element={<Navigate to="/categories" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
