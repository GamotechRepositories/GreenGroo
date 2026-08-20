import { Navigate, Outlet } from 'react-router-dom'
import { useVendor } from '@/context/VendorContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useVendor()

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading Vendor Portal...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return children ? children : <Outlet />
}
