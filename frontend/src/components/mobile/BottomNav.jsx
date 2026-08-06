import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Home",
    end: true,
    activeColor: "text-amber-400",
    icon: (active) => (
      <svg
        className={`h-6 w-6 ${active ? "fill-amber-400 text-amber-400" : "text-text-secondary"}`}
        fill={active ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
      >
        {!active ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        ) : (
          <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.061l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.689zM12 5.432l-6.75 6.75V18a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5v-5.818L12 5.432z" />
        )}
      </svg>
    ),
  },
  {
    to: "/orders",
    label: "Order Again",
    activeColor: "text-amber-400",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    to: "/categories",
    label: "Categories",
    activeColor: "text-amber-400",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-.878V9a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 9v.878m13.5 0A2.25 2.25 0 0118 11.25v6.75A2.25 2.25 0 0115.75 20.25H8.25A2.25 2.25 0 016 18.75v-6.75a2.25 2.25 0 012.25-2.25h.75" />
      </svg>
    ),
  },
  {
    to: "/product",
    label: "Shop",
    activeColor: "text-amber-400",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 0h13.5" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Account",
    activeColor: "text-amber-400",
    icon: (active) => (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

function BottomNav() {
  const { user, openAuthModal } = useAuth();

  const handleNavClick = (e, item) => {
    if ((item.to === "/orders" || item.to === "/profile") && !user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-light bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={(e) => handleNavClick(e, item)}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition ${
                isActive ? item.activeColor || "text-amber-400" : "text-text-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
