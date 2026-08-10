import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SIDEBAR_ITEMS } from "../../utils/constants";
import { setSidebarCollapsed, toggleSidebar } from "../../store/farmerSlice";
import { EXCEL_BTN, EXCEL_PANEL_HEAD } from "../../utils/excelStyles";

const ICONS = {
  documents: "📄",
  dashboard: "🏠",
  products: "🌱",
  inventory: "📦",
  orders: "🛒",
  earnings: "💰",
  profile: "👤",
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#D4D4D4] bg-white transition-all duration-200 lg:static lg:z-0 ${
          collapsed ? "w-[72px]" : "w-[220px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex h-12 items-center justify-between ${EXCEL_PANEL_HEAD}`}>
          <div className={`min-w-0 px-3 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-xs font-bold text-[#217346]">GreenGroo</p>
            <p className="truncate text-xs text-[#6B7280]">Farmer Panel</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className={`${EXCEL_BTN} mx-2 hidden lg:inline-flex`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button type="button" className={`${EXCEL_BTN} mx-2 lg:hidden`} onClick={onCloseMobile}>
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0 overflow-y-auto p-0">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                onCloseMobile?.();
                if (window.innerWidth < 1024) dispatch(setSidebarCollapsed(false));
              }}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b border-[#D4D4D4] px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "bg-[#F2F2F2] text-[#217346]"
                    : "bg-white text-[#1F2937] hover:bg-[#F9F9F9]"
                }`
              }
            >
              <span aria-hidden="true">{ICONS[item.icon]}</span>
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default FarmerSidebar;
