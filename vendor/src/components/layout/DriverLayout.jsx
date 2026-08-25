import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDriverAuth } from "../../context/DriverAuthContext";

const NAV = [
  { to: "/driver/assigned", label: "Assigned Pickups" },
  { to: "/driver/progress", label: "In Progress" },
  { to: "/driver/completed", label: "Completed Pickups" },
  { to: "/driver/history", label: "Pickup History" },
];

export default function DriverLayout() {
  const { driver, logout } = useDriverAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col bg-green-dark text-white">
        <div className="px-5 py-6">
          <p className="text-sm font-bold">GreenGroo</p>
          <p className="text-xs text-white/60">Pickup Orders</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm ${isActive ? "bg-green-primary font-medium" : "text-white/80 hover:bg-white/10"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-4">
          <p className="mb-2 px-3 text-xs text-white/60">{driver?.name}</p>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
            onClick={() => {
              logout();
              navigate("/driver/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="ml-56 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
