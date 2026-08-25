import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVendorAuth } from "../context/VendorAuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const vendor = useVendorAuth();
  const location = useLocation();
  const vendorPath = location.pathname.startsWith("/vendor") && location.pathname !== "/vendor/login";

  if (loading || vendor.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (vendorPath) {
    if (!vendor.isAuthenticated) return <Navigate to="/vendor/login" replace />;
    return <Outlet />;
  }

  if (isAuthenticated || vendor.isAuthenticated) return <Outlet />;
  return <Navigate to="/login" replace />;
}
