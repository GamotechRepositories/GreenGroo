import { Link, useLocation as useRouterLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/categories", label: "Categories" },
  { to: "/product", label: "Shop" },
  { to: "/orders", label: "Orders" },
];

function DesktopSubNav() {
  const { pathname } = useRouterLocation();

  const isActive = (to, end) => {
    if (end) return pathname === to;
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <div className="fixed left-0 right-0 top-[72px] z-40 hidden border-b border-[#F0F0F0] bg-white lg:block">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-5 py-2 xl:px-8">
        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                isActive(link.to, link.end)
                  ? "bg-[#F2F8F3] text-[#0C831F]"
                  : "text-text-secondary hover:bg-[#F8F8F8] hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default DesktopSubNav;
