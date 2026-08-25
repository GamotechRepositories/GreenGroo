import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon, LogoIcon } from "../ui/Icon";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import { useInventoryRequests } from "../../hooks/useInventoryRequests";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "home", end: true },
  { to: "/inventory-requests", label: "Inventory Requests", icon: "box" },
];

export default function ProductManagerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { requests } = useInventoryRequests(12000);
  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-green-dark text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-primary">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">GreenGroo</p>
            <p className="text-xs text-white/60">Product Manager</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-green-primary font-medium text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`
                  }
                >
                  <Icon name={item.icon} size="sm" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.to === "/inventory-requests" && pendingCount > 0 ? (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                      {pendingCount}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
          >
            <Icon name="power" size="sm" />
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}

export function PageShell({ title, subtitle, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="space-y-5 p-6">{children}</main>
    </>
  );
}
