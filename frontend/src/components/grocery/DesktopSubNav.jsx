import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/categories", label: "Categories" },
  { to: "/product", label: "Shop" },
  { to: "/orders", label: "Orders" },
];

function DesktopSubNav() {
  const { pathname } = useRouterLocation();
  const { location } = useLocation();

  const isActive = (to, end) => {
    if (end) return pathname === to;
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <div className="fixed left-0 right-0 top-[60px] z-40 hidden border-b border-border-light bg-white/95 backdrop-blur-md lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2.5 xl:px-8">
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isActive(link.to, link.end)
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:bg-mobile-surface hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/location"
          className="flex max-w-md items-center gap-2 rounded-xl border border-border-light bg-mobile-surface/80 px-4 py-2 transition hover:border-primary/40 hover:shadow-sm"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </span>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Deliver to
            </p>
            <p className="truncate text-sm font-bold text-text-primary">
              {location.label}
              {location.pincode ? ` · ${location.pincode}` : ""}
            </p>
          </div>
          <svg className="ml-auto h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default DesktopSubNav;
