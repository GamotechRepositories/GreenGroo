import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BadgeCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Sprout,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { SIDEBAR_ITEMS, MANAGER_SIDEBAR_ITEMS } from "../../utils/constants";
import { setSidebarCollapsed, toggleSidebar, selectIsManager } from "../../store/farmerSlice";

const ICONS = {
  documents: FileText,
  dashboard: LayoutDashboard,
  market: TrendingUp,
  community: Users,
  schemes: Landmark,
  products: Package,
  crops: Sprout,
  harvest: ClipboardList,
  inventory: ClipboardList,
  orders: ShoppingCart,
  earnings: Wallet,
  profile: UserRound,
  farmers: Users,
  pickup: Truck,
  quality: BadgeCheck,
};

function NavGroup({ item, collapsed }) {
  const location = useLocation();
  const isChildActive = item.children?.some((child) =>
    location.pathname.startsWith(child.to)
  );
  const [open, setOpen] = useState(isChildActive);
  const Icon = ICONS[item.icon] || Package;

  if (collapsed) {
    return (
      <NavLink
        to={item.children?.[0]?.to || "#"}
        title={item.label}
        className={({ isActive }) =>
          `group relative mx-1 mb-0.5 flex items-center justify-center px-2.5 py-2 text-xs font-semibold transition-colors ${
            isChildActive ? "bg-[#E8F5E9] text-[#217346]" : "text-[#1F2937] hover:bg-[#F2F2F2]"
          }`
        }
      >
        <Icon className={`h-4 w-4 shrink-0 ${isChildActive ? "text-[#217346]" : "text-[#6B7280]"}`} strokeWidth={isChildActive ? 2.25 : 1.75} />
      </NavLink>
    );
  }

  return (
    <div className="mx-1 mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group relative flex w-full items-center gap-2.5 px-2.5 py-2 text-xs font-semibold transition-colors ${
          isChildActive ? "bg-[#E8F5E9] text-[#217346]" : "text-[#1F2937] hover:bg-[#F2F2F2]"
        }`}
      >
        {isChildActive && <span className="absolute inset-y-1 left-0 w-0.5 bg-[#217346]" aria-hidden="true" />}
        <Icon className={`h-4 w-4 shrink-0 ${isChildActive ? "text-[#217346]" : "text-[#6B7280]"}`} strokeWidth={isChildActive ? 2.25 : 1.75} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-7 border-l border-[#D4D4D4] pl-2">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              className={({ isActive }) =>
                `block px-2 py-1.5 text-xs transition-colors ${
                  isActive ? "font-semibold text-[#217346]" : "text-[#6B7280] hover:text-[#1F2937]"
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function FarmerSidebar({ mobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();
  const collapsed = useSelector((s) => s.farmer.sidebarCollapsed);
  const isManager = useSelector(selectIsManager);
  const farmer = useSelector((s) => s.farmer.farmer);

  const items = isManager ? MANAGER_SIDEBAR_ITEMS : SIDEBAR_ITEMS;
  const panelLabel = isManager ? "Manager Panel" : "Farmer Panel";
  const vendorName = isManager ? (farmer?.vendorName || "GreenGroo") : "GreenGroo";

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
              <p className="truncate text-xs font-bold leading-tight text-[#217346]">{vendorName}</p>
              <p className="truncate text-[10px] leading-tight text-[#6B7280]">{panelLabel}</p>
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
          {items.map((item) => {
            if (item.children) {
              return <NavGroup key={item.id} item={item} collapsed={collapsed} />;
            }
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
