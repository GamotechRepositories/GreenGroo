import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon, LogoIcon } from "../ui/Icon";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";
import StoreQrModal from "../StoreQrModal";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "home", end: true },
  { to: "/orders", label: "Incoming Orders", icon: "orders" },
  { to: "/shifts", label: "Shifts & Slots", icon: "calendar" },
  { to: "/stock", label: "Stock Inventory", icon: "box" },
  { to: "/drivers", label: "Approved Drivers", icon: "truck", end: true },
  { to: "/drivers/pending", label: "Driver Verification", icon: "user" },
  { to: "/incentives", label: "Store Incentives", icon: "trophy" },
  { to: "/alerts", label: "Operational Alerts", icon: "bell" },
];

export default function ManagerLayout() {
  const { logout, manager } = useAuth();
  const navigate = useNavigate();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const darkStoreQr = `DARKSTORE_${manager?.id || manager?._id || ""}`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#062C1D] text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-900/50">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">GreenRow</p>
              <p className="text-[11px] font-medium tracking-wide uppercase text-emerald-400">
                Dark Store Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-emerald-900/50 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Store Location Card */}
        <div className="mx-4 my-4 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 p-4 border border-emerald-800/40 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Store Location
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-sm font-bold text-white truncate">
            {manager?.storeName || "Dark Store"}
          </p>
          <p className="text-xs text-slate-300 truncate">
            📍 {manager?.area || "Location"}, {manager?.city || "City"}
          </p>
          
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/30 px-3 py-2 text-xs font-semibold text-emerald-200 border border-emerald-500/30 hover:bg-emerald-600/50 hover:text-white transition"
          >
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Show Store QR Code
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40"
                    : "text-slate-300 hover:bg-emerald-900/40 hover:text-white"
                }`
              }
            >
              <Icon name={item.icon} size="sm" className="transition-transform group-hover:scale-110" />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="border-t border-emerald-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 font-bold text-emerald-200">
                {manager?.name ? manager.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {manager?.name || "Manager"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{manager?.phone || manager?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              title="Logout"
              className="rounded-xl p-2 text-slate-400 hover:bg-emerald-900/50 hover:text-rose-400 transition"
            >
              <Icon name="power" size="sm" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Dark Store QR Modal */}
      <StoreQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        storeName={manager?.storeName}
        area={manager?.area}
        qrCode={darkStoreQr}
      />
    </div>
  );
}

export function PageShell({ title, subtitle, children }) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-slate-200/80 pb-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-xs md:text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
