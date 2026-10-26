import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { useCart } from "../../context/CartContext";
import { BOTTOM_NAV_HEIGHT_PX, FLOATING_CART_BAR_HEIGHT_PX } from "../grocery/FloatingCartBar";
import { showsFloatingCartBar } from "../../utils/floatingCartBar";

// Preload home assets in memory once so touch is 100% instant with 0ms network latency
let cachedHomeBlob = null;
let homeBlobPromise = null;

function preloadHomeBlob() {
  if (cachedHomeBlob) return Promise.resolve(cachedHomeBlob);
  if (!homeBlobPromise && typeof window !== "undefined") {
    homeBlobPromise = fetch("/assets/payment/home.webp")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load home webp");
        return res.blob();
      })
      .then((b) => {
        cachedHomeBlob = b;
        return b;
      })
      .catch(() => null);
  }
  return homeBlobPromise;
}

if (typeof window !== "undefined") {
  preloadHomeBlob();
}

export function BottomNav() {
  const { user, openAuthModal } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hidden = useScrollDirection();
  const { cartCount } = useCart();
  // Sit above the floating cart bar instead of covering its Cart button.
  const supportLift =
    cartCount > 0 && showsFloatingCartBar(location.pathname) ? FLOATING_CART_BAR_HEIGHT_PX + 8 : 0;

  const [animSrc, setAnimSrc] = useState(null);
  const [isHomeAnimating, setIsHomeAnimating] = useState(false);
  const homeAnimTimeoutRef = useRef(null);
  const prevObjectUrlRef = useRef(null);

  useEffect(() => {
    // Warm up static image cache
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = "/assets/payment/home-static.webp";
    }
    preloadHomeBlob();

    return () => {
      if (homeAnimTimeoutRef.current) clearTimeout(homeAnimTimeoutRef.current);
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch (_) {}
      }
    };
  }, []);

  const triggerHomeAnim = async () => {
    // CRITICAL: If already animating, let it finish completely — DO NOT cut in between!
    if (isHomeAnimating) return;

    try {
      const blob = await preloadHomeBlob();
      if (!blob) {
        // Fallback: brief scale feedback if blob couldn't load
        setIsHomeAnimating(true);
        homeAnimTimeoutRef.current = setTimeout(() => {
          setIsHomeAnimating(false);
        }, 500);
        return;
      }

      // Revoke previous blob URL to avoid memory leaks
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch (_) {}
      }

      const freshUrl = URL.createObjectURL(blob);
      prevObjectUrlRef.current = freshUrl;
      setAnimSrc(freshUrl);
      setIsHomeAnimating(true);

      if (homeAnimTimeoutRef.current) clearTimeout(homeAnimTimeoutRef.current);
      // Full duration of home.webp: 41 frames = ~2025ms
      homeAnimTimeoutRef.current = setTimeout(() => {
        setIsHomeAnimating(false);
      }, 2050);
    } catch (_) {
      setIsHomeAnimating(false);
    }
  };

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
        <div className="relative flex h-6 w-6 items-center justify-center">
          {/* Base static icon: ALWAYS in DOM, never flickers, never reloads, never blanks */}
          <img
            src="/assets/payment/home-static.webp"
            alt="Home"
            className={`h-6 w-6 object-contain transition-all duration-200 ${
              !active ? "opacity-60 grayscale" : "opacity-100"
            } ${isHomeAnimating ? "scale-105" : ""}`}
          />
          {/* Animated overlay: in-memory blob URL, runs full cycle without cut or reload */}
          {animSrc && (
            <img
              src={animSrc}
              alt=""
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 h-6 w-6 object-contain transition-opacity duration-200 ${
                isHomeAnimating ? "opacity-100 scale-105" : "opacity-0"
              }`}
            />
          )}
        </div>
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
    if (item.label === "Home") {
      triggerHomeAnim();
      if (isHomeActive) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if ((item.to.includes("/orders") || item.to.includes("/profile")) && !user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  return (
    <>
    <Link
      to="/support"
      aria-label="Support"
      className="gg-bar-slide fixed right-3 z-[60] flex h-14 w-14 items-end justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#E8F7EA] to-white shadow-[0_6px_16px_rgba(12,131,31,0.35)] ring-2 ring-[#0C831F] transition-transform active:scale-95 lg:hidden"
      style={{
        bottom: `calc(${81 + supportLift}px + env(safe-area-inset-bottom, 0px))`,
        // With the cart bar showing, travel with it so the bubble stays above it.
        transform: hidden
          ? `translate3d(0, ${supportLift ? BOTTOM_NAV_HEIGHT_PX : 150}px, 0)`
          : "translate3d(0, 0, 0)",
      }}
    >
      <img
        src="/assets/support-agent.png?v=3"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-[52px] w-[52px] object-contain object-bottom"
      />
    </Link>
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
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold active:scale-95 transition-all select-none ${
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
    </>
  );
}

export default BottomNav;
