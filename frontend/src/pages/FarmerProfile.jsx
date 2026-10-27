import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/api";
import { isPlacedOrder, getOrderDisplayCode } from "../utils/orderUtils";
import { useLive } from "../realtime/useLive";
import {
  ChevronLeft,
  MapPin,
  Sprout,
  Check,
  Package,
  Truck,
  Leaf,
  Award,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Phone,
  Share2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import OptimizedImg from "../components/common/OptimizedImg";

function getPreOrderStepperConfig(order) {
  const p = String(order?.preOrderProgress || "").toLowerCase().trim();
  const s = String(order?.status || "").toLowerCase().trim();

  if (s === "delivered" || p === "delivered") {
    return {
      activeStep: 5,
      lineWidthClass: "w-full",
      badgeText: "Delivered",
      badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Check,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: true },
        { label: "Delivered", active: true },
      ],
    };
  }
  if (s === "out_for_delivery" || p === "out_for_delivery") {
    return {
      activeStep: 4,
      lineWidthClass: "w-[85%]",
      badgeText: "Out for Delivery",
      badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Truck,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: true },
        { label: "Delivering", active: true },
      ],
    };
  }
  if (s === "assigned" || s === "pickup_verified" || p === "rider_assigned") {
    return {
      activeStep: 4,
      lineWidthClass: "w-[75%]",
      badgeText: "Partner Assigned",
      badgeClass: "bg-emerald-50 text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Truck,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: true },
        { label: "Delivery", active: false },
      ],
    };
  }
  if (p === "at_store" || order?.storeReceivedAt) {
    return {
      activeStep: 3,
      lineWidthClass: "w-[60%]",
      badgeText: "Reached Dark Store",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
      BadgeIcon: Package,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: true },
        { label: "Delivery", active: false },
      ],
    };
  }
  if (p === "dispatched" || order?.preOrderStage === "forwarded") {
    return {
      activeStep: 2,
      lineWidthClass: "w-[45%]",
      badgeText: "In Transit to Dark Store",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/70",
      BadgeIcon: Truck,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: false },
        { label: "Delivery", active: false },
      ],
    };
  }
  if (p === "preparing" || order?.preOrderStage === "preparing" || order?.preOrderStage === "ready") {
    return {
      activeStep: 2,
      lineWidthClass: "w-[30%]",
      badgeText: "Farmer & Collection",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70",
      BadgeIcon: Sprout,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: true },
        { label: "Dark Store", active: false },
        { label: "Delivery", active: false },
      ],
    };
  }
  if (p === "confirmed" || order?.vendorStatus === "confirmed") {
    return {
      activeStep: 1,
      lineWidthClass: "w-[20%]",
      badgeText: "Vendor Confirmed",
      badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Check,
      steps: [
        { label: "Vendor", active: true },
        { label: "Confirmed", active: true },
        { label: "Sourced", active: false },
        { label: "Dark Store", active: false },
        { label: "Delivery", active: false },
      ],
    };
  }
  if (s === "cancelled") {
    return {
      activeStep: 0,
      lineWidthClass: "w-0",
      badgeText: "Cancelled",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70",
      BadgeIcon: AlertCircle,
    };
  }
  return {
    activeStep: 1,
    lineWidthClass: "w-[10%]",
    badgeText: "Sent to Vendor",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70",
    BadgeIcon: Package,
    steps: [
      { label: "Vendor", active: true },
      { label: "Confirmed", active: false },
      { label: "Sourced", active: false },
      { label: "Dark Store", active: false },
      { label: "Delivery", active: false },
    ],
  };
}

function getStepperConfig(status) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") {
    return {
      activeStep: 4,
      lineWidthClass: "w-full",
      badgeText: "Delivered",
      badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Check,
    };
  }
  if (s === "out_for_delivery") {
    return {
      activeStep: 3,
      lineWidthClass: "w-3/4",
      badgeText: "Out for Delivery",
      badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
      BadgeIcon: Truck,
    };
  }
  if (s === "shipping" || s === "shipped") {
    return {
      activeStep: 2,
      lineWidthClass: "w-1/2",
      badgeText: "Dispatched",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/70",
      BadgeIcon: Truck,
    };
  }
  if (s === "processing") {
    return {
      activeStep: 1,
      lineWidthClass: "w-1/4",
      badgeText: "Packed",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70",
      BadgeIcon: Package,
    };
  }
  if (s === "cancelled") {
    return {
      activeStep: 0,
      lineWidthClass: "w-0",
      badgeText: "Cancelled",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70",
      BadgeIcon: AlertCircle,
    };
  }
  if (s === "return") {
    return {
      activeStep: 0,
      lineWidthClass: "w-0",
      badgeText: "Returned",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70",
      BadgeIcon: RefreshCw,
    };
  }
  return {
    activeStep: 1,
    lineWidthClass: "w-[15%]",
    badgeText: "Order Confirmed",
    badgeClass: "bg-[#eef8f1] text-[#0a6c38] border-emerald-200/70",
    BadgeIcon: Package,
  };
}

function formatRealOrderDateTime(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  const dateFormatted = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateFormatted} · ${timeFormatted}`;
}

export default function FarmerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, openAuthModal } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const passedFarmer = location.state?.farmer;
  const rawFarmerName =
    passedFarmer?.name ||
    searchParams.get("name") ||
    "श्री. Vilas Shinde";
  const farmerName = rawFarmerName.startsWith("श्री.") || rawFarmerName.startsWith("श्री ")
    ? rawFarmerName
    : `श्री. ${rawFarmerName}`;
  const farmerLocation =
    passedFarmer?.location ||
    searchParams.get("location") ||
    "Shirur, Pune, Maharashtra";
  const farmerLand =
    passedFarmer?.land ||
    searchParams.get("land") ||
    "5 acres";
  const farmerBio =
    passedFarmer?.bio ||
    searchParams.get("bio") ||
    "Runs a high-density guava orchard and picks fruit at colour break for the best sweetness. Committed to sustainable, residue-tested farming in Shirur, Pune.";
  const farmerExperience =
    passedFarmer?.experience ||
    searchParams.get("experience") ||
    "15 वर्षे";
  const farmerMethod =
    passedFarmer?.method ||
    searchParams.get("method") ||
    "Pruned high-density orchard, organic mulch";
  const farmerPhoto =
    passedFarmer?.farmerImage ||
    searchParams.get("photo") ||
    "";

  const [activeTab, setActiveTab] = useState("about"); // 'about' | 'crops' | 'photos'
  const [orderFilter, setOrderFilter] = useState("upcoming"); // 'upcoming' | 'delivered' | 'past'

  // Real orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      setOrdersError("");
      return;
    }
    if (!silent) setLoadingOrders(true);
    setOrdersError("");
    try {
      const { data } = await getMyOrders();
      setOrders((data?.data || []).filter(isPlacedOrder));
    } catch {
      if (!silent) setOrders([]);
      setOrdersError("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [user, authLoading]);

  useLive(loadOrders, [loadOrders, location.key]);

  const upcomingOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "return"),
    [orders]
  );
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered"),
    [orders]
  );
  const pastOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered" || o.status === "cancelled" || o.status === "return"),
    [orders]
  );

  const displayedOrders = useMemo(() => {
    if (orderFilter === "upcoming") return upcomingOrders;
    if (orderFilter === "delivered") return deliveredOrders;
    if (orderFilter === "past") return pastOrders;
    return orders;
  }, [orderFilter, upcomingOrders, deliveredOrders, pastOrders]);

  // Crops grown by farmer (dynamic from passed farmer crops or authentic produce)
  const farmerCrops = useMemo(() => {
    if (Array.isArray(passedFarmer?.crops) && passedFarmer.crops.length > 0) {
      return passedFarmer.crops.map((c) => ({
        name: c.name || "Guava (पेरू)",
        variety: c.variety || "Allahabad Safeda",
        harvest: "ताजी काढणी (Colour break)",
        status: c.status || "उपलब्ध",
        icon: "🍈",
      }));
    }
    return [
      { name: "Allahabad Safeda Guava (पेरू)", variety: "Allahabad Safeda", harvest: "ताजी काढणी (Colour break)", status: "उपलब्ध", icon: "🍈" },
      { name: "Sardar Guava (Lucknow 49)", variety: "L-49 (Desi)", harvest: "दोन दिवसांपूर्वी ताजी काढणी", status: "उपलब्ध", icon: "🍐" },
      { name: "हायब्रिड टोमॅटो (Tomato)", variety: "अभिनव (Shirur)", harvest: "ताजी काढणी", status: "उपलब्ध", icon: "🍅" },
      { name: "पालक व गावरान मेथी (Fresh Greens)", variety: "स्थानिक गावरान (Desi)", harvest: "पहाटे ५:३० वा.", status: "उपलब्ध", icon: "🥬" },
      { name: "नाशिक लाल कांदा (Red Onion)", variety: "गरवा (Garva)", harvest: "रब्बी आवक", status: "उपलब्ध", icon: "🧅" },
      { name: "गाजर व वांगी (Carrots & Brinjal)", variety: "दिल्ली रेड / भरताची वांगी", harvest: "नियमित", status: "उपलब्ध", icon: "🥕" },
    ];
  }, [passedFarmer?.crops]);

  return (
    <div className="min-h-screen bg-[#f8fbf9] pb-24 text-slate-800">
      {/* =========================================================
          TOP NAVBAR & BREADCRUMB
          ========================================================= */}
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-150 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-slate-700 hover:text-black cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
          Farmer Profile
        </h1>
        <div className="w-6" /> {/* spacer for balance */}
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Desktop Breadcrumbs */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-emerald-700 font-medium">Home</Link>
          <span>›</span>
          <span className="hover:text-emerald-700 font-medium">Farmers</span>
          <span>›</span>
          <span className="font-bold text-slate-900">Farmer Profile</span>
        </nav>

        {/* =========================================================
            1. HERO FARMER CARD (Desktop & Mobile)
            ========================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-100/80 p-3.5 sm:p-5 lg:p-6 shadow-xs relative overflow-hidden">
          {/* Subtle leaf watermark pattern on desktop */}
          <div className="absolute right-0 top-0 bottom-0 w-44 pointer-events-none opacity-15 hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#15803d]">
              <path
                d="M50 10 C65 25 80 50 65 75 C55 90 40 85 30 70 C20 55 35 25 50 10 Z"
                fill="currentColor"
              />
              <path
                d="M70 30 C80 40 90 60 80 75 C70 85 60 80 55 70"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Desktop Layout (md: & lg:) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 relative z-10">
            {/* Wide Panoramic Photo */}
            <div className="w-[320px] lg:w-[360px] h-[170px] lg:h-[185px] rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100 shadow-xs">
              <OptimizedImg
                src={farmerPhoto || "/assets/farmer/desktop_farmer_photo.png"}
                alt={farmerName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Farmer Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl lg:text-[26px] font-black text-[#0a6c38] tracking-tight leading-tight">
                {farmerName}
              </h2>

              <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0a6c38] shrink-0" />
                  <span className="font-semibold text-slate-700">{farmerLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#0a6c38] shrink-0" />
                  <span className="font-semibold text-slate-700">{farmerLand}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout (< md:) */}
          <div className="flex md:hidden items-center gap-3.5 relative z-10">
            {/* Square Photo */}
            <div className="w-[105px] h-[115px] rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100 shadow-xs">
              <OptimizedImg
                src={farmerPhoto || "/assets/farmer/mobile_farmer_photo.png"}
                alt={farmerName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-black text-[#0a6c38] tracking-tight truncate leading-tight">
                {farmerName}
              </h2>

              <div className="mt-1 space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#0a6c38] shrink-0" />
                  <span className="truncate font-medium">{farmerLocation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#0a6c38] shrink-0" />
                  <span className="font-medium">{farmerLand}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. SUB-TABS: About Farm | Crops | Photos
            ========================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-100/80 p-4 sm:p-5 lg:p-6 shadow-xs space-y-5">
          {/* Tab Navigation with Green Underline */}
          <div className="flex items-center gap-8 border-b border-gray-150 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`text-sm sm:text-base font-extrabold pb-3 -mb-3 transition-colors cursor-pointer relative ${
                activeTab === "about"
                  ? "text-[#0a6c38] border-b-2 border-[#0a6c38]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              About Farm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("crops")}
              className={`text-sm sm:text-base font-extrabold pb-3 -mb-3 transition-colors cursor-pointer relative ${
                activeTab === "crops"
                  ? "text-[#0a6c38] border-b-2 border-[#0a6c38]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Crops
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`text-sm sm:text-base font-extrabold pb-3 -mb-3 transition-colors cursor-pointer relative ${
                activeTab === "photos"
                  ? "text-[#0a6c38] border-b-2 border-[#0a6c38]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Photos
            </button>
          </div>

          {/* TAB 1: ABOUT FARM */}
          {activeTab === "about" && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                  About Farm
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {farmerBio}
                </p>
              </div>

              {/* 3 Metric Badges matching user's image */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                {/* Badge 1: Farm Size */}
                <div className="bg-[#f4faf5] border border-emerald-100/90 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#e6f5ea] flex items-center justify-center text-[#0a6c38] mb-1.5">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a6c38]" />
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    {farmerLand}
                  </h4>
                  <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    जमीन
                  </p>
                </div>

                {/* Badge 2: Experience */}
                <div className="bg-[#f4faf5] border border-emerald-100/90 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#e6f5ea] flex items-center justify-center text-[#0a6c38] mb-1.5">
                    {/* Farmer Hat SVG */}
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a6c38]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h20M7 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                      <circle cx="12" cy="15" r="2" />
                      <path d="M7 21v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" />
                    </svg>
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    {farmerExperience}
                  </h4>
                  <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    शेतीचा अनुभव
                  </p>
                </div>

                {/* Badge 3: Crop Types */}
                <div className="bg-[#f4faf5] border border-emerald-100/90 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#e6f5ea] flex items-center justify-center text-[#0a6c38] mb-1.5">
                    <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a6c38]" />
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    {farmerCrops.length > 0 ? `${farmerCrops.length}+` : "10+"}
                  </h4>
                  <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    पिकांचे प्रकार
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CROPS */}
          {activeTab === "crops" && (
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                पिकांचे तपशील (Crops Grown)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farmerCrops.map((crop) => (
                  <div key={crop.name} className="flex items-center justify-between p-3 rounded-xl bg-[#f4faf5] border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{crop.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{crop.name}</h4>
                        <p className="text-[11px] text-slate-500">{crop.variety} · काढणी: {crop.harvest}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0a6c38] text-[10.5px] font-bold">
                      {crop.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                शेतातील फोटो (Farm Gallery)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <OptimizedImg src="/assets/farmer/desktop_farmer_photo.png" alt="Farm crop" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <OptimizedImg src="/assets/features/farm_fresh_slide_2.png" alt="Farmer with fresh produce" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 col-span-2 sm:col-span-1">
                  <OptimizedImg src="/assets/payment/maharashtra_farm_sunrise.jpg" alt="Sunrise farm" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            3. MY ORDERS SECTION (Real Orders & Dynamic Tracking)
            ========================================================= */}
        <div className="space-y-3">
          {/* Header Row: Title & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0a6c38]" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                My Orders
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="inline-flex items-center p-0.5 rounded-full bg-white border border-gray-200/80 shadow-xs w-fit">
              <button
                type="button"
                onClick={() => setOrderFilter("upcoming")}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === "upcoming"
                    ? "bg-[#0a6c38] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upcoming {upcomingOrders.length > 0 ? `(${upcomingOrders.length})` : ""}
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("delivered")}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === "delivered"
                    ? "bg-[#0a6c38] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Delivered {deliveredOrders.length > 0 ? `(${deliveredOrders.length})` : ""}
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("past")}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === "past"
                    ? "bg-[#0a6c38] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Past {pastOrders.length > 0 ? `(${pastOrders.length})` : ""}
              </button>
            </div>
          </div>

          {/* SKELETON / LOADING STATE */}
          {authLoading || (user && loadingOrders && orders.length === 0) ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-4 rounded bg-gray-200" />
                    <div className="w-36 h-3 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="w-24 h-6 rounded-full bg-gray-200" />
              </div>
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ) : !user ? (
            /* NOT LOGGED IN STATE */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-6 sm:p-8 text-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#f0f8f2] text-[#0a6c38] border border-emerald-200/60 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6 text-[#0a6c38]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  ऑर्डर्स ट्रॅक करण्यासाठी लॉगिन करा
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  तुमच्या चालू ऑर्डर्सचे लाईव्ह ट्रॅकिंग आणि जुन्या ऑर्डर्स पाहण्यासाठी खात्यात लॉगिन करा.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-6 py-2.5 rounded-xl bg-[#0a6c38] hover:bg-[#085a2f] text-white font-extrabold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Login / Sign In
              </button>
            </div>
          ) : displayedOrders.length === 0 ? (
            /* EMPTY STATE FOR SELECTED TAB */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-6 sm:p-8 text-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200/60 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {orderFilter === "upcoming"
                    ? "कोणतीही चालू ऑर्डर नाही (No Upcoming Orders)"
                    : orderFilter === "delivered"
                    ? "कोणतीही डिलिव्हर झालेली ऑर्डर नाही (No Delivered Orders)"
                    : "कोणतीही जुनी ऑर्डर नाही (No Past Orders)"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {orderFilter === "upcoming"
                    ? "सध्या तुमची कोणतीही चालू ऑर्डर नाही. थेट शेतकऱ्यांकडून ताजी उत्पादने खरेदी करा!"
                    : "येथे तुमच्या सर्व पूर्ण झालेल्या किंवा रद्द केलेल्या ऑर्डर्सचा इतिहास दिसेल."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Link
                  to="/product"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0a6c38] hover:bg-[#085a2f] text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop Fresh Produce</span>
                </Link>
                {orders.length > 0 && orderFilter === "upcoming" && (
                  <button
                    type="button"
                    onClick={() => setOrderFilter("delivered")}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    View Delivered Orders
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* REAL ORDERS LIST */
            <div className="space-y-4">
              {displayedOrders.map((order) => {
                const isPreOrder = Boolean(order.isPreOrder || order.preOrderSlot || order.preOrderProgress);
                const statusConfig = isPreOrder ? getPreOrderStepperConfig(order) : getStepperConfig(order.status);
                const StatusBadgeIcon = statusConfig.BadgeIcon;
                const orderCode = getOrderDisplayCode(order);
                const orderDateStr = formatRealOrderDateTime(order.createdAt);
                const isCancelledOrReturn = order.status === "cancelled" || order.status === "return";

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-4 sm:p-5 lg:p-6 shadow-xs space-y-4 transition hover:border-emerald-200"
                  >
                    {/* Order Top Bar: Icon + ID + Date + Status Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#f0f8f2] border border-emerald-200/60 flex items-center justify-center text-[#0a6c38] shrink-0">
                          {order.status === "delivered" ? (
                            <Check className="w-5 h-5 text-[#0a6c38]" />
                          ) : order.status === "shipping" || order.status === "out_for_delivery" ? (
                            <Truck className="w-5 h-5 text-[#0a6c38]" />
                          ) : (
                            <Package className="w-5 h-5 text-[#0a6c38]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                              Order #{orderCode}
                            </h4>
                            {isPreOrder && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Pre-order
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                            {orderDateStr}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shrink-0 ${statusConfig.badgeClass}`}
                      >
                        <StatusBadgeIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.badgeText}</span>
                      </div>
                    </div>

                    {/* Stepper Progress Timeline (for active / non-cancelled orders) */}
                    {!isCancelledOrReturn ? (
                      <div className="pt-3 pb-2 px-2 sm:px-6">
                        <div className="relative flex items-center justify-between">
                          {/* Connecting Line background */}
                          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
                          {/* Active Green Line up to current status */}
                          <div
                            className={`absolute left-4 ${statusConfig.lineWidthClass} top-1/2 -translate-y-1/2 h-0.5 bg-[#0a6c38] z-0 transition-all duration-500`}
                          />

                          {isPreOrder ? (
                            (statusConfig.steps || [
                              { label: "Vendor" },
                              { label: "Confirmed" },
                              { label: "Sourced" },
                              { label: "Dark Store" },
                              { label: "Delivered" },
                            ]).map((step, idx) => {
                              const isDoneOrActive = statusConfig.activeStep >= idx + 1;
                              const isCurrent = statusConfig.activeStep === idx + 1;
                              return (
                                <div key={step.label} className="relative z-10 flex flex-col items-center">
                                  <div
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs shadow-xs transition-all ${
                                      isDoneOrActive
                                        ? `bg-[#0a6c38] text-white ${isCurrent ? "ring-4 ring-[#eef8f1]" : ""}`
                                        : "bg-gray-200 text-slate-400"
                                    }`}
                                  >
                                    {isDoneOrActive ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <span className="text-[10px] font-bold">{idx + 1}</span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[9.5px] sm:text-[11px] mt-1.5 text-center ${
                                      isCurrent
                                        ? "font-extrabold text-[#0a6c38]"
                                        : isDoneOrActive
                                        ? "font-bold text-slate-800"
                                        : "font-medium text-slate-400"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <>
                              {/* Step 1: Packed */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs transition-all ${
                                    statusConfig.activeStep >= 1
                                      ? `bg-[#0a6c38] text-white ${statusConfig.activeStep === 1 ? "ring-4 ring-[#eef8f1]" : ""}`
                                      : "bg-gray-200 text-slate-400"
                                  }`}
                                >
                                  <Package className="w-4 h-4" />
                                </div>
                                <span
                                  className={`text-[10px] sm:text-[11.5px] mt-1.5 ${
                                    statusConfig.activeStep === 1
                                      ? "font-extrabold text-[#0a6c38]"
                                      : statusConfig.activeStep > 1
                                      ? "font-bold text-slate-800"
                                      : "font-medium text-slate-400"
                                  }`}
                                >
                                  Packed
                                </span>
                              </div>

                              {/* Step 2: Dispatched */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs transition-all ${
                                    statusConfig.activeStep >= 2
                                      ? `bg-[#0a6c38] text-white ${statusConfig.activeStep === 2 ? "ring-4 ring-[#eef8f1]" : ""}`
                                      : "bg-gray-200 text-slate-400"
                                  }`}
                                >
                                  <Truck className="w-4 h-4" />
                                </div>
                                <span
                                  className={`text-[10px] sm:text-[11.5px] mt-1.5 ${
                                    statusConfig.activeStep === 2
                                      ? "font-extrabold text-[#0a6c38]"
                                      : statusConfig.activeStep > 2
                                      ? "font-bold text-slate-800"
                                      : "font-medium text-slate-400"
                                  }`}
                                >
                                  Dispatched
                                </span>
                              </div>

                              {/* Step 3: Out for Delivery */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs transition-all ${
                                    statusConfig.activeStep >= 3
                                      ? `bg-[#0a6c38] text-white ${statusConfig.activeStep === 3 ? "ring-4 ring-[#eef8f1] animate-pulse" : ""}`
                                      : "bg-gray-200 text-slate-400"
                                  }`}
                                >
                                  <Truck className="w-4 h-4" />
                                </div>
                                <span
                                  className={`text-[10px] sm:text-[11.5px] mt-1.5 ${
                                    statusConfig.activeStep === 3
                                      ? "font-extrabold text-[#0a6c38]"
                                      : statusConfig.activeStep > 3
                                      ? "font-bold text-slate-800"
                                      : "font-medium text-slate-400"
                                  }`}
                                >
                                  Out for Delivery
                                </span>
                              </div>

                              {/* Step 4: Delivered */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                                    statusConfig.activeStep >= 4
                                      ? "bg-[#0a6c38] text-white shadow-xs ring-4 ring-[#eef8f1]"
                                      : "bg-gray-200 text-slate-400"
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </div>
                                <span
                                  className={`text-[10px] sm:text-[11.5px] mt-1.5 ${
                                    statusConfig.activeStep >= 4
                                      ? "font-extrabold text-[#0a6c38]"
                                      : "font-medium text-slate-400"
                                  }`}
                                >
                                  Delivered
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Cancelled / Return Status Note */
                      <div className="py-2.5 px-3.5 rounded-xl bg-rose-50/80 border border-rose-200/60 flex items-center gap-2.5 text-xs text-rose-700">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          {order.status === "cancelled"
                            ? "ही ऑर्डर रद्द करण्यात आली आहे (This order was cancelled)."
                            : "या ऑर्डरचा परतावा प्रक्रियाधीन आहे (Return request in progress)."}
                        </span>
                      </div>
                    )}

                    {/* Order Items & Total Summary */}
                    {order.items && order.items.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Miniature Item Thumbnails */}
                          <div className="flex -space-x-2 shrink-0">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 overflow-hidden shadow-2xs"
                                title={item.name}
                              >
                                {item.image ? (
                                  <OptimizedImg src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] bg-emerald-50 text-emerald-800">
                                    🥬
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 truncate">
                            <p className="font-semibold text-slate-800 truncate text-xs">
                              {order.items.map((it) => it.name).join(", ")}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {order.items.length} {order.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-slate-900">
                            ₹{Number(order.total || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Track Order Button */}
                    <Link
                      to={`/orders/${order._id}`}
                      className="block w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#eef8f1] hover:bg-[#e2f3e6] text-[#0a6c38] font-extrabold text-xs sm:text-sm text-center transition-colors active:scale-[0.99] cursor-pointer"
                    >
                      Track Order →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
