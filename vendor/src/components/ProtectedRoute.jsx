import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";

export default function ProtectedRoute() {
  const vendor = useVendorAuth();
  const location = useLocation();

  if (vendor.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!vendor.isAuthenticated) {
    return <Navigate to="/vendor/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
