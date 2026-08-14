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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0F172A] text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 border-r border-slate-800/80 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-md shadow-slate-950/50">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">GreenRow</p>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                Dark Store Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-slate-950/40"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              <Icon name={item.icon} size="sm" className="transition-transform group-hover:scale-110" />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-800/80 p-4 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400 border border-slate-700">
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
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
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
