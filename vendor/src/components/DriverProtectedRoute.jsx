import { Navigate, Outlet } from "react-router-dom";
import { useDriverAuth } from "../context/DriverAuthContext";

export default function DriverProtectedRoute() {
  const { isAuthenticated, loading } = useDriverAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/driver/login" replace />;
  return <Outlet />;
}
