import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminNotifications } from "../../context/AdminNotificationContext";
import AdminNotificationBell from "./AdminNotificationBell";
import AdminDeviceNotificationPrompt from "./AdminDeviceNotificationPrompt";
import AdminNotificationToasts from "./AdminNotificationToast";
import {
  IconBanner,
  IconBrand,
  IconCategory,
  IconDashboard,
  IconOrder,
  IconPayment,
  IconProduct,
  IconSupport,
  IconTestimonial,
  IconSettings,
  IconUsers,
  IconCreateOrder,
  IconCoupon,
  IconPromotional,
} from "./AdminIcons";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/profile": "Admin Profile",
  "/banners": "Hero Banners",
  "/offer-banners": "Offer Banners",
  "/categories/add": "Add Category",
  "/categories/show": "Show Category",
  "/products/add": "Add Product",
  "/products/show": "Show Product",
  "/brands/add": "Add Brand",
  "/brands/show": "Show Brands",
  "/testimonials/add": "Add Testimonial",
  "/testimonials/show": "Testimonials",
  "/settings": "Store Settings",
  "/users": "Users",
  "/orders": "Orders",
  "/orders/create": "Create Order",
  "/payments": "Payments",
  "/revenue": "Revenue",
  "/coupons/add": "Create Coupon",
  "/coupons/show": "Coupons",
  "/promotional-notifications": "Promotional Notifications",
  "/support": "Support Messages",
};

const NAV_ITEMS = [
  { type: "link", to: "/", label: "Dashboard", end: true, icon: IconDashboard },
  {
    type: "group",
    label: "Products",
    icon: IconProduct,
    basePath: "/products",
    children: [
      { to: "/products/add", label: "Add Product" },
      { to: "/products/show", label: "Show Product" },
    ],
  },
  { type: "link", to: "/orders/create", label: "Create Order", icon: IconCreateOrder },
  {
    type: "group",
    label: "Orders",
    icon: IconOrder,
    basePath: "/orders",
    children: [
      { to: "/orders", label: "All Orders", end: true },
    ],
  },
  {
    type: "group",
    label: "Categories",
    icon: IconCategory,
    basePath: "/categories",
    children: [
      { to: "/categories/add", label: "Add Category" },
      { to: "/categories/show", label: "Show Category" },
    ],
  },
  {
    type: "group",
    label: "Brands",
    icon: IconBrand,
    basePath: "/brands",
    children: [
      { to: "/brands/add", label: "Add Brand" },
      { to: "/brands/show", label: "Show Brands" },
    ],
  },
  {
    type: "group",
    label: "Testimonials",
    icon: IconTestimonial,
    basePath: "/testimonials",
    children: [
      { to: "/testimonials/add", label: "Add Testimonial" },
      { to: "/testimonials/show", label: "Show Testimonials" },
    ],
  },
  { type: "link", to: "/settings", label: "Store Settings", icon: IconSettings },
  { type: "link", to: "/payments", label: "Payments", icon: IconPayment },
  { type: "link", to: "/revenue", label: "Revenue", icon: IconPayment },
  { type: "link", to: "/coupons/show", label: "Coupons", icon: IconCoupon },
  { type: "link", to: "/promotional-notifications", label: "Promotional", icon: IconPromotional },
  { type: "link", to: "/support", label: "Support", icon: IconSupport },
  { type: "link", to: "/users", label: "Users", icon: IconUsers },
  { type: "link", to: "/banners", label: "Hero Banners", icon: IconBanner },
  { type: "link", to: "/offer-banners", label: "Offer Banners", icon: IconPromotional },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-accent text-white"
      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
  }`;

function isOrdersNavActive(pathname) {
  return (
    pathname === "/orders" ||
    (pathname.startsWith("/orders/") && pathname !== "/orders/create")
  );
}

function isOrdersSectionPath(pathname) {
  return isOrdersNavActive(pathname);
}

const subNavLinkClass = ({ isActive }) =>
  `block rounded-lg py-2 pl-11 pr-3 text-sm transition ${
    isActive
      ? "bg-neutral-800 text-accent font-medium"
      : "text-neutral-500 hover:bg-neutral-800 hover:text-white"
  }`;

function AdminProfileAvatar({ adminUser }) {
  const initial = adminUser?.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  return (
    <Link
      to="/profile"
      aria-label="Admin profile"
      title="Admin profile"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-white text-sm font-bold text-neutral-800 transition hover:border-accent hover:text-accent"
    >
      {initial}
    </Link>
  );
}

function NavIconWithBadge({ showBadge, children }) {
  return (
    <span className="relative shrink-0">
      {children}
      {showBadge ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-neutral-950"
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

function NavGroup({
  item,
  location,
  onNavigate,
  collapsed,
  onExpand,
  openGroupKey,
  setOpenGroupKey,
  showBadge = false,
}) {
  const isGroupActive = location.pathname.startsWith(item.basePath);
  const open = openGroupKey === item.basePath;
  const Icon = item.icon;

  useEffect(() => {
    if (isGroupActive) setOpenGroupKey(item.basePath);
  }, [isGroupActive, item.basePath, setOpenGroupKey]);

  const handleToggle = () => {
    if (collapsed) {
      onExpand?.();
      setOpenGroupKey(item.basePath);
      return;
    }
    setOpenGroupKey((prev) => (prev === item.basePath ? "" : item.basePath));
  };

  if (collapsed) {
    return (
      <button
        type="button"
        title={item.label}
        onClick={handleToggle}
        className={`flex w-full items-center justify-center rounded-lg p-2.5 transition ${
          isGroupActive
            ? "bg-accent text-white"
            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
        }`}
      >
        <NavIconWithBadge showBadge={showBadge}>
          <Icon className="w-5 h-5 shrink-0" />
        </NavIconWithBadge>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isGroupActive
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          <NavIconWithBadge showBadge={showBadge}>
            <Icon className="w-5 h-5 shrink-0" />
          </NavIconWithBadge>
          {item.label}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={subNavLinkClass}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  location,
  onNavigate,
  collapsed,
  onCollapse,
  onExpand,
  hasUnreadSupport,
  hasUnreadOrders,
  hasUnreadPayments,
}) {
  const [openGroupKey, setOpenGroupKey] = useState("");

  return (
    <>
      <div className={`mb-6 shrink-0 ${collapsed ? "flex justify-center px-1" : "px-1"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand sidebar"
            title="Bulk Mobile Mart"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-xl font-bold text-primary transition hover:bg-neutral-800"
          >
            B
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-white">
              Bulk Mobile Mart
            </div>
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Close sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pb-4 [-webkit-overflow-scrolling:touch]">
        {NAV_ITEMS.map((item) => {
          if (item.type === "group") {
            const showOrdersBadge =
              item.basePath === "/orders" && hasUnreadOrders;
            return (
              <NavGroup
                key={item.label}
                item={item}
                location={location}
                onNavigate={onNavigate}
                collapsed={collapsed}
                onExpand={onExpand}
                openGroupKey={openGroupKey}
                setOpenGroupKey={setOpenGroupKey}
                showBadge={showOrdersBadge}
              />
            );
          }

          const Icon = item.icon;
          const showSupportBadge = item.to === "/support" && hasUnreadSupport;
          const showOrdersBadge = item.to === "/orders" && hasUnreadOrders;
          const showPaymentsBadge = item.to === "/payments" && hasUnreadPayments;
          const showBadge = showSupportBadge || showOrdersBadge || showPaymentsBadge;
          const resolveLinkActive = (defaultActive) =>
            item.resolveActive ? item.resolveActive(location.pathname) : defaultActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={({ isActive }) => {
                const active = resolveLinkActive(isActive);
                return collapsed
                  ? `flex items-center justify-center rounded-lg p-2.5 transition ${
                      active
                        ? "bg-accent text-white"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`
                  : navLinkClass({ isActive: active });
              }}
            >
              <NavIconWithBadge showBadge={showBadge}>
                <Icon className="w-5 h-5 shrink-0" />
              </NavIconWithBadge>
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

function AdminLayout() {
  const location = useLocation();
  const { adminUser } = useAuth();
  const {
    hasUnreadSupport,
    hasUnreadOrders,
    hasUnreadPayments,
    toasts,
    dismissToast,
    dismissAlert,
    markSupportAsSeen,
    markOrdersAsSeen,
    markPaymentsAsSeen,
  } = useAdminNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitle =
    location.pathname === "/orders/create"
      ? "Create Order"
      : /^\/orders\/[^/]+$/.test(location.pathname)
        ? "Order Details"
        : PAGE_TITLES[location.pathname] || "Dashboard";

  const isDashboard = location.pathname === "/" || location.pathname === "";
  const isSupportPage = location.pathname === "/support";
  const isOrdersPage = isOrdersSectionPath(location.pathname);
  const isPaymentsPage = location.pathname === "/payments";

  useEffect(() => {
    if (isSupportPage) {
      markSupportAsSeen();
    }
  }, [isSupportPage, markSupportAsSeen]);

  useEffect(() => {
    if (isOrdersPage) {
      markOrdersAsSeen();
    }
  }, [isOrdersPage, markOrdersAsSeen]);

  useEffect(() => {
    if (isPaymentsPage) {
      markPaymentsAsSeen();
    }
  }, [isPaymentsPage, markPaymentsAsSeen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const expandSidebar = () => setSidebarCollapsed(false);
  const handleSidebarHeaderClose = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden border-r border-neutral-800 bg-neutral-950 px-4 py-6 transition-all duration-300 lg:translate-x-0 ${
          sidebarCollapsed ? "lg:w-[72px] lg:px-2" : ""
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent
          location={location}
          onNavigate={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed && !sidebarOpen}
          onCollapse={handleSidebarHeaderClose}
          onExpand={expandSidebar}
          hasUnreadSupport={hasUnreadSupport && !isSupportPage}
          hasUnreadOrders={hasUnreadOrders && !isOrdersPage}
          hasUnreadPayments={hasUnreadPayments && !isPaymentsPage}
        />
      </aside>

      <div
        className={`min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="truncate text-base font-bold text-neutral-900 sm:text-xl">
              {pageTitle}
            </h1>
          </div>

          <div className="flex min-w-0 shrink items-center justify-end gap-2 sm:gap-3">
            <AdminNotificationBell />
            {isDashboard ? <AdminProfileAvatar adminUser={adminUser} /> : null}
          </div>
        </header>

        <AdminDeviceNotificationPrompt />

        <main className="min-w-0 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <AdminNotificationToasts toasts={toasts} onDismiss={dismissToast} onOpen={dismissAlert} />
    </div>
  );
}

export default AdminLayout;
