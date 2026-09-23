import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useScrollDirection } from "../../hooks/useScrollDirection";

export function BottomNav() {
  const { user, openAuthModal } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hidden = useScrollDirection();

  const pathname = location.pathname.toLowerCase();
  const storeParam = searchParams.get("store")?.trim()?.toLowerCase() || "";

  // Determine active store section
  let activeStore = "main";
  if (storeParam === "festive" || pathname.startsWith("/ready2cook")) {
    activeStore = "festive";
  } else if (storeParam === "mall" || pathname.startsWith("/super-mall")) {
    activeStore = "mall";
  } else if (storeParam === "fresh" || pathname.startsWith("/greengrocc")) {
    activeStore = "main";
  }

  // Define section-specific links & theme colors
  let activeColor = "text-[#0C831F]";
  let activeBg = "bg-[#0C831F]/15";
  let homeUrl = "/";
  let orderUrl = "/orders";
  let categoriesUrl = "/categories";
  let shopUrl = "/product";
  let accountUrl = "/profile";

  if (activeStore === "festive") {
    activeColor = "text-amber-700";
    activeBg = "bg-amber-500/15";
    homeUrl = "/?store=festive";
    orderUrl = "/orders?store=festive";
    categoriesUrl = "/categories?store=festive";
    shopUrl = "/product?store=festive";
  } else if (activeStore === "mall") {
    activeColor = "text-blue-600";
    activeBg = "bg-blue-600/15";
    homeUrl = "/?store=mall";
    orderUrl = "/orders?store=mall";
    categoriesUrl = "/categories?store=mall";
    shopUrl = "/product?store=mall";
  }

  // Check active states
  const isHomeActive =
    (pathname === "/" || pathname === "/ready2cook" || pathname === "/super-mall" || pathname === "/greengrocc") &&
    ((activeStore === "main" && !storeParam) || storeParam === (activeStore === "festive" ? "festive" : activeStore === "mall" ? "mall" : "main"));

  const isOrderActive = pathname.startsWith("/orders");
  const isCategoriesActive = pathname.startsWith("/categories") || pathname.includes("/category");
  const isShopActive = pathname.startsWith("/product") || pathname.endsWith("/shop");
  const isAccountActive = pathname.startsWith("/profile");

  const NAV_ITEMS = [
    {
      to: homeUrl,
      label: "Home",
      isActive: isHomeActive,
      icon: (active) => (
        <img
          src="/categoryIcons/homeIcon.png"
          alt="Home"
          className={`h-6 w-6 object-contain ${!active ? "opacity-60 grayscale" : ""}`}
        />
      ),
    },
    {
      to: orderUrl,
      label: "Order Again",
      isActive: isOrderActive,
      icon: (active) => (
        <img
          src="/categoryIcons/orderAgainIcon.png"
          alt="Order Again"
          className={`h-6 w-6 object-contain ${!active ? "opacity-60 grayscale" : ""}`}
        />
      ),
    },
    {
      to: categoriesUrl,
      label: "Categories",
      isActive: isCategoriesActive,
      icon: (active) => (
        <img
          src="/categoryIcons/categoriesIcon.png"
          alt="Categories"
          className={`h-[22px] w-[22px] object-contain ${!active ? "opacity-60 grayscale" : ""}`}
        />
      ),
    },
    {
      to: shopUrl,
      label: "Shop",
      isActive: isShopActive,
      icon: (active) => (
        <img
          src="/categoryIcons/cartIcon.png"
          alt="Shop"
          className={`h-7 w-7 object-contain ${!active ? "opacity-60 grayscale" : ""}`}
        />
      ),
    },
    {
      to: accountUrl,
      label: "Account",
      isActive: isAccountActive,
      icon: (active) => (
        <img
          src="/categoryIcons/profileIcon.png"
          alt="Account"
          className={`h-6 w-6 object-contain ${!active ? "opacity-60 grayscale" : ""}`}
        />
      ),
    },
  ];

  const handleNavClick = (e, item) => {
    if ((item.to.includes("/orders") || item.to.includes("/profile")) && !user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  return (
    <nav
      className="gg-bar-slide fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden"
      style={{
        transform: hidden ? "translate3d(0, 100%, 0)" : "translate3d(0, 0, 0)",
      }}
    >
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-around px-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            onClick={(e) => handleNavClick(e, item)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold transition-all ${
              item.isActive ? activeColor : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`rounded-full p-1 transition-colors ${item.isActive ? activeBg : "bg-transparent"}`}>
              {item.icon(item.isActive)}
            </div>
            <span className="leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
