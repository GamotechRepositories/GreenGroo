import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Icon, LogoIcon } from "../ui/Icon";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";
import StoreQrModal from "../StoreQrModal";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "home", end: true },
  { to: "/orders", label: "Incoming Orders", icon: "orders" },
  {
    key: "shifts",
    label: "Shifts & Slots",
    icon: "calendar",
    children: [
      { to: "/shifts/create", label: "Create Shift & Slot" },
      { to: "/shifts", label: "My Shift & Slots", end: true },
    ],
  },
  {
    key: "gigs",
    label: "Store Gigs & Incentives",
    icon: "trophy",
    children: [
      { to: "/incentives/create", label: "Create Gigs" },
      { to: "/incentives", label: "My Gigs", end: true },
    ],
  },
  { to: "/stock", label: "Stock Inventory", icon: "box" },
  { to: "/drivers", label: "Approved Drivers", icon: "truck", end: true },
  { to: "/drivers/pending", label: "Driver Verification", icon: "user" },
  { to: "/alerts", label: "Operational Alerts", icon: "bell" },
];

export default function ManagerLayout() {
  const { logout, manager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({
    shifts: false,
    gigs: false,
  });

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const darkStoreQr = `DARKSTORE_${manager?.id || manager?._id || ""}`;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Fixed/Full Height Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 h-full shrink-0 flex-col bg-black text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 border-r border-zinc-800/80 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 1. Sidebar Header - Fixed Branding */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-800/80 px-5 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-md">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-white">GreenRow</p>
              <p className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                Dark Store Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-zinc-800 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* 2. Sidebar Navigation - Independent Middle Scroll Area */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 space-y-1.5">
          {navItems.map((item) => {
            if (item.children) {
              const isChildActive = item.children.some((c) =>
                c.end ? location.pathname === c.to : location.pathname.startsWith(c.to)
              );
              const isOpen = Boolean(openDropdowns[item.key]);

              return (
                <div key={item.key} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.key)}
                    className={`w-full group flex items-center justify-between gap-3.5 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-all ${
                      isChildActive
                        ? "bg-zinc-900 text-white border border-zinc-800"
                        : "text-slate-300 hover:bg-zinc-900/70 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon name={item.icon} size="md" className="transition-transform group-hover:scale-110 text-slate-400 group-hover:text-white" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="ml-5 border-l border-zinc-800 pl-3.5 space-y-1 my-1.5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.end}
                          onClick={() => setIsMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold tracking-wide transition-all ${
                              isActive
                                ? "bg-zinc-900 text-emerald-400 border border-emerald-500/30 shadow-xs"
                                : "text-slate-400 hover:bg-zinc-900/60 hover:text-white"
                            }`
                          }
                        >
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-zinc-900/70 hover:text-white"
                  }`
                }
              >
                <Icon name={item.icon} size="md" className="transition-transform group-hover:scale-110" />
                <span className="flex-1 text-left truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 3. User Profile Footer - Fixed Bottom */}
        <div className="shrink-0 border-t border-slate-800/80 p-4 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400 border border-slate-700">
                {manager?.name ? manager.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {manager?.name || "Manager"}
                </p>
                <p className="text-xs text-slate-400 truncate">{manager?.phone || manager?.email}</p>
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
              <Icon name="power" size="md" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Full Height & Independent Scroll Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Header */}
        <div className="shrink-0">
          <Header onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)} />
        </div>

        {/* Right Content Viewport - Independent Scroll Viewport */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            <Outlet />
          </div>
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
