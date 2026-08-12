import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { SIDEBAR_ITEMS } from "../../utils/constants";
import { setSidebarCollapsed, toggleSidebar } from "../../store/farmerSlice";

const ICONS = {
  documents: FileText,
  dashboard: LayoutDashboard,
  products: Package,
  harvest: ClipboardList,
  inventory: ClipboardList,
  orders: ShoppingCart,
  earnings: Wallet,
  profile: UserRound,
};

function FarmerSidebar({ mobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();
  const collapsed = useSelector((s) => s.farmer.sidebarCollapsed);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[#D4D4D4] bg-white transition-[width,transform] duration-200 lg:static lg:z-0 ${
          collapsed ? "w-[64px]" : "w-[212px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[#D4D4D4] bg-[#F2F2F2] px-2">
          {!collapsed ? (
            <div className="min-w-0 flex-1 px-1">
              <p className="truncate text-xs font-bold leading-tight text-[#217346]">GreenGroo</p>
              <p className="truncate text-[10px] leading-tight text-[#6B7280]">Farmer Panel</p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="flex h-7 w-7 items-center justify-center border border-[#D4D4D4] bg-white text-[10px] font-bold text-[#217346]">
                GG
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="hidden h-7 w-7 shrink-0 items-center justify-center border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#E7E7E7] lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#E7E7E7] lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="farmer-scrollbar flex-1 overflow-y-auto py-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = ICONS[item.icon] || Package;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  onCloseMobile?.();
                  if (window.innerWidth < 1024) dispatch(setSidebarCollapsed(false));
                }}
                className={({ isActive }) =>
                  `group relative mx-1 mb-0.5 flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-[#E8F5E9] text-[#217346]"
                      : "text-[#1F2937] hover:bg-[#F2F2F2]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span className="absolute inset-y-1 left-0 w-0.5 bg-[#217346]" aria-hidden="true" />
                    ) : null}
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-[#217346]" : "text-[#6B7280] group-hover:text-[#1F2937]"}`}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default FarmerSidebar;
