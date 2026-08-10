import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SIDEBAR_ITEMS } from "../../utils/constants";
import { setSidebarCollapsed, toggleSidebar } from "../../store/farmerSlice";

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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E5E7EB] bg-white transition-all duration-200 lg:static lg:z-0 ${
          collapsed ? "w-[84px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-4">
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-extrabold text-[#2E7D32]">GreenGroo</p>
            <p className="truncate text-xs text-[#6B7280]">Farmer Panel</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="hidden rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB] lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs lg:hidden"
            onClick={onCloseMobile}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                onCloseMobile?.();
                if (window.innerWidth < 1024) dispatch(setSidebarCollapsed(false));
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#E8F5E9] text-[#2E7D32]"
                    : "text-[#1F2937] hover:bg-[#F7F2E8]"
                }`
              }
            >
              <span className="text-base" aria-hidden="true">
                {ICONS[item.icon]}
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default FarmerSidebar;
