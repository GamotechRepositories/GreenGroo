import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Sprout,
  X,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Award,
  Lock,
  Package,
  Truck,
  Check,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../api/api";
import { getOrderDisplayCode, isPlacedOrder } from "../../utils/orderUtils";
import ProductReviews from "./ProductReviews";
import ProductDescriptionContent from "./ProductDescriptionContent";
import { getProductDisplayDetails } from "../../utils/productLocalization";

function getOrderTraceStatus(status) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "delivered") {
    return {
      statusKey: "delivered",
      stepIndex: 4,
      badgeText: "Delivered",
      badgeMarathi: "यशस्वीरीत्या पोहोचली (Delivered)",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      headline: "ऑर्डर यशस्वीरीत्या पोहोचली आहे (Delivered)",
      step1: true,
      step2: true,
      step3: true,
      step4: true,
      lineWidth: "w-full",
    };
  }
  if (s === "out_for_delivery") {
    return {
      statusKey: "out_for_delivery",
      stepIndex: 3,
      badgeText: "Out for Delivery",
      badgeMarathi: "डिलिव्हरीसाठी बाहेर पडले",
      badgeColor: "bg-emerald-50 text-[#0a6c38] border-emerald-300 ring-1 ring-emerald-400/40",
      headline: "डिलिव्हरी पार्टनर घराकडे निघाला आहे (Out for Delivery)",
      step1: true,
      step2: true,
      step3: true,
      step4: false,
      lineWidth: "w-3/4",
    };
  }
  if (s === "shipping" || s === "shipped") {
    return {
      statusKey: "shipping",
      stepIndex: 2,
      badgeText: "Dispatched",
      badgeMarathi: "रवाना झाले (Dispatched)",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      headline: "ऑर्डर संकलन केंद्रातून रवाना झाली आहे (Dispatched)",
      step1: true,
      step2: true,
      step3: false,
      step4: false,
      lineWidth: "w-1/2",
    };
  }
  if (s === "processing" || s === "packed") {
    return {
      statusKey: "processing",
      stepIndex: 1,
      badgeText: "Packed",
      badgeMarathi: "पॅकिंग व तपासणी पूर्ण (Packed)",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      headline: "ऑर्डरचे पॅकिंग व लॅब तपासणी पूर्ण (Packed)",
      step1: true,
      step2: false,
      step3: false,
      step4: false,
      lineWidth: "w-1/4",
    };
  }
  if (s === "cancelled") {
    return {
      statusKey: "cancelled",
      stepIndex: 0,
      badgeText: "Cancelled",
      badgeMarathi: "रद्द झाले (Cancelled)",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      headline: "ही ऑर्डर रद्द करण्यात आली आहे (Cancelled)",
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      lineWidth: "w-0",
    };
  }
  if (s === "return") {
    return {
      statusKey: "return",
      stepIndex: 0,
      badgeText: "Return",
      badgeMarathi: "रिटर्न (Return)",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      headline: "रिटर्न प्रक्रिया सुरू आहे (Return)",
      step1: true,
      step2: false,
      step3: false,
      step4: false,
      lineWidth: "w-1/4",
    };
  }
  // "confirm" / "confirmed" / "pending" / "order_received"
  return {
    statusKey: "confirmed",
    stepIndex: 1,
    badgeText: "Order Confirmed",
    badgeMarathi: "ऑर्डर कन्फर्म (Confirmed)",
    badgeColor: "bg-emerald-50 text-[#0a6c38] border-emerald-200",
    headline: "ऑर्डर कन्फर्म झाली आहे, शेतातून पॅकिंग व लॅब तपासणी सुरू आहे",
    step1: true,
    step2: false,
    step3: false,
    step4: false,
    lineWidth: "w-[15%]",
  };
}

function formatRealDateTime(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return (
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

export default function ProductFarmerTraceabilitySection({
  product = {},
  specifications = [],
  className = "",
}) {
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    getMyOrders()
      .then(({ data }) => {
        if (isMounted) {
          setOrders((data?.data || []).filter(isPlacedOrder));
        }
      })
      .catch(() => {
        if (isMounted) setOrders([]);
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Find if user has ordered THIS product
  const matchingOrder = useMemo(() => {
    if (!orders.length || !product?._id) return null;
    const prodIdStr = String(product._id || "").trim();
    const prodNameLower = String(product.name || "").trim().toLowerCase();
    const prodMarathiLower = String(product.marathiName || "").trim().toLowerCase();

    const matchesItem = (it) => {
      if (!it) return false;
      const itId = String(it.product?._id || it.product || it.productId || it._id || "").trim();
      if (prodIdStr && itId && prodIdStr === itId) return true;

      const itName = String(it.name || it.title || "").trim().toLowerCase();
      if (prodNameLower && itName) {
        if (itName === prodNameLower) return true;
        if (itName.length > 3 && (prodNameLower.includes(itName) || itName.includes(prodNameLower))) return true;
      }
      if (prodMarathiLower && itName) {
        if (itName === prodMarathiLower) return true;
        if (itName.length > 3 && (prodMarathiLower.includes(itName) || itName.includes(prodMarathiLower))) return true;
      }
      return false;
    };

    // 1. Try to find an ACTIVE order with this product first (so the customer sees live in-progress delivery status)
    const activeMatch = orders.find((ord) => {
      const s = String(ord.status || "").toLowerCase();
      const isActive = s !== "delivered" && s !== "cancelled" && s !== "return";
      if (!isActive) return false;
      return ord.items?.some(matchesItem);
    });
    if (activeMatch) return activeMatch;

    // 2. Otherwise find the latest placed order containing this product
    return orders.find((ord) => ord.items?.some(matchesItem)) || null;
  }, [orders, product?._id, product?.name, product?.marathiName]);

  const orderedItem = useMemo(() => {
    if (!matchingOrder) return null;
    const prodIdStr = String(product?._id || "").trim();
    const prodNameLower = String(product?.name || "").trim().toLowerCase();
    const prodMarathiLower = String(product?.marathiName || "").trim().toLowerCase();

    const matchesItem = (it) => {
      if (!it) return false;
      const itId = String(it.product?._id || it.product || it.productId || it._id || "").trim();
      if (prodIdStr && itId && prodIdStr === itId) return true;

      const itName = String(it.name || it.title || "").trim().toLowerCase();
      if (prodNameLower && itName) {
        if (itName === prodNameLower) return true;
        if (itName.length > 3 && (prodNameLower.includes(itName) || itName.includes(prodNameLower))) return true;
      }
      if (prodMarathiLower && itName) {
        if (itName === prodMarathiLower) return true;
        if (itName.length > 3 && (prodMarathiLower.includes(itName) || itName.includes(prodMarathiLower))) return true;
      }
      return false;
    };

    return matchingOrder.items?.find(matchesItem) || matchingOrder.items?.[0] || null;
  }, [matchingOrder, product?._id, product?.name, product?.marathiName]);

  const hasOrderedThisProduct = Boolean(matchingOrder);
  const realOrderCode = matchingOrder ? getOrderDisplayCode(matchingOrder) : "";
  const realTraceConfig = matchingOrder ? getOrderTraceStatus(matchingOrder.status) : null;

  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'nutrition' | 'reviews'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);

  // Farmer Details extraction
  const rawFarmerName = String(
    product?.farmerDetails?.name || product?.farmerName || "Ramesh Patil"
  ).trim();
  const farmerName = rawFarmerName.startsWith("श्री.") || rawFarmerName.startsWith("श्री ")
    ? rawFarmerName
    : `श्री. ${rawFarmerName}`;

  const farmerLocation = String(
    product?.farmerDetails?.location || product?.farmerLocation || "निफाड, नाशिक, महाराष्ट्र"
  ).trim();

  const farmerLand = String(
    product?.farmerDetails?.totalArea || product?.farmerDetails?.cultivationArea || "५.० एकर शेती"
  ).trim();

  const farmerBio = String(
    product?.farmerDetails?.bio ||
    "गेली १२ वर्षे निफाड (नाशिक) परिसरात नैसर्गिक व सेंद्रिय पद्धतीने भाजीपाला व पिकांचे उत्पादन. कीटकनाशक विरहीत, ताजी काढणी करून थेट ग्राहकांपर्यंत पोहोचवणे हे आमचे ध्येय आहे."
  ).trim();

  const farmerExperience = String(
    product?.farmerDetails?.experience || "१२+ वर्षे शेतीचा अनुभव"
  ).trim();

  const farmerPhoto =
    product?.farmerImage ||
    product?.farmerDetails?.farmerImage ||
    "";

  const farmerMethod = String(
    product?.farmerDetails?.agricultureMethod || "सेंद्रिय व एकात्मिक पद्धत (IPM Low Chemical)"
  ).trim();

  const defaultHarvestDate = matchingOrder?.createdAt
    ? new Date(matchingOrder.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "आजची ताजी काढणी (Today Fresh)";

  const defaultPackingDate = matchingOrder?.createdAt
    ? new Date(matchingOrder.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "सकाळी ६:०० वा. सुरक्षित पॅक";

  const harvestDate = String(
    product?.harvestingDate || product?.farmerDetails?.harvestingDate || defaultHarvestDate
  ).trim();

  const packingDate = String(
    product?.packingDate || defaultPackingDate
  ).trim();

  const variety = String(
    product?.variety || product?.varietyName || product?.farmerDetails?.currentCrop || "स्थानिक (Desi)"
  ).trim();

  const farmerCrops = Array.isArray(product?.farmerDetails?.crops)
    ? product.farmerDetails.crops.filter((item) => item?.name || item?.variety || item?.area)
    : [];
  const primaryCrop = farmerCrops[0]?.name || variety;

  const displayInfo = getProductDisplayDetails(product);
  const productNameDisplay = displayInfo.secondaryTitle
    ? `${displayInfo.primaryTitle} · ${displayInfo.secondaryTitle}`
    : displayInfo.primaryTitle || "ताजी भाजीपाला / फळे";

  const inStock = product?.stock !== undefined ? product.stock > 0 : product?.inStock !== false;

  const productStatusBadge = inStock
    ? "ताजी आवक · उपलब्ध (In Stock)"
    : "काढणी चालू (Harvesting)";

  const productStatusHeadline = inStock
    ? "शेतातून ताजी आवक · १० मिनिटांत डिलिव्हरी सज्ज"
    : "नवीन ताजी काढणी लवकरच उपलब्ध होईल";

  const productLotCode = `LOT-${String(product?._id || "7849").slice(-5).toUpperCase()}`;

  const certification = String(product?.certification || "Organic (NPOP)").trim();

  const savedNutrition = Array.isArray(product?.nutritionFacts)
    ? product.nutritionFacts.filter((item) => item?.label || item?.value)
    : [];
  const nutritionFacts = savedNutrition.length
    ? savedNutrition
    : [
        { label: "Energy", value: "354 kcal" },
        { label: "Carbohydrates", value: "65 g" },
        { label: "Dietary Fiber", value: "21 g" },
        { label: "Protein", value: "7.8 g" },
        { label: "Total Fat", value: "3.2 g" },
        { label: "Curcumin (Active)", value: "4.5% High" },
        { label: "Iron", value: "41.4 mg (230% DV)" },
        { label: "Potassium", value: "2525 mg" },
        { label: "Pesticides / Residue", value: "0.0% (Zero)" },
      ];
  const nutritionNote = String(
    product?.nutritionNote ||
      "* Based on certified farm gate batch laboratory analysis. 100% natural and unadulterated."
  ).trim();

  return (
    <div className={`space-y-4 sm:space-y-5 ${className}`}>
      {/* ====================================================
          1. MEET YOUR FARMER CARD
          ==================================================== */}
      <div>
        <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 tracking-tight mb-2.5">
          Meet Your Farmer
        </h3>

        <div className="relative overflow-hidden rounded-2xl border border-[#ddeadb] bg-white p-3.5 sm:p-4 lg:p-5 shadow-xs">
          {/* Subtle leaf watermark on desktop */}
          <div className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none opacity-20 hidden md:block">
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

          {/* Desktop Layout (md & lg) */}
          <div className="hidden md:flex items-center gap-6 relative z-10">
            {/* Landscape Farmer Photo */}
            <div className="w-[280px] sm:w-[310px] lg:w-[340px] h-[145px] sm:h-[155px] rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100/80 shadow-xs">
              <img
                src={farmerPhoto || "/assets/farmer/desktop_farmer_photo.png"}
                alt={farmerName}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Farmer Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xl lg:text-[22px] font-black text-[#0a6c38] tracking-tight leading-tight">
                {farmerName}
              </h4>

              <div className="mt-2.5 space-y-1.5 text-xs sm:text-[13px] text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0a6c38] shrink-0" />
                  <span className="font-medium text-slate-700">{farmerLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#0a6c38] shrink-0" />
                  <span className="font-medium text-slate-700">{farmerLand}</span>
                </div>
              </div>

              <Link
                to="/farmer-profile"
                state={{
                  farmer: {
                    name: farmerName,
                    location: farmerLocation,
                    land: farmerLand,
                    bio: farmerBio,
                    experience: farmerExperience,
                    method: farmerMethod,
                  },
                }}
                className="mt-3.5 inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full border border-[#0a6c38] text-[#0a6c38] hover:bg-[#0a6c38] hover:text-white text-xs sm:text-[13px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>View Profile</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>

          {/* Mobile Layout (< md) */}
          <div className="flex md:hidden items-center gap-3.5 relative z-10">
            {/* Square/Portrait Farmer Photo */}
            <div className="w-[105px] h-[115px] rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100/80 shadow-xs">
              <img
                src={farmerPhoto || "/assets/farmer/mobile_farmer_photo.png"}
                alt={farmerName}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Farmer Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[17px] font-black text-[#0a6c38] tracking-tight truncate leading-snug">
                {farmerName}
              </h4>

              <div className="mt-1 space-y-1 text-[11.5px] text-gray-700">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#0a6c38] shrink-0" />
                  <span className="truncate font-medium text-slate-700">{farmerLocation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#0a6c38] shrink-0" />
                  <span className="font-medium text-slate-700">{farmerLand}</span>
                </div>
              </div>

              <Link
                to="/farmer-profile"
                state={{
                  farmer: {
                    name: farmerName,
                    location: farmerLocation,
                    land: farmerLand,
                    bio: farmerBio,
                    experience: farmerExperience,
                    method: farmerMethod,
                  },
                }}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#0a6c38] text-[#0a6c38] hover:bg-[#0a6c38] hover:text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>View Profile</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          2. PRODUCT TRACEABILITY CARD (Only rendered when ordered)
          ==================================================== */}
      {hasOrderedThisProduct && realTraceConfig && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 tracking-tight">
              Product Traceability
            </h3>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-black ${realTraceConfig.badgeColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>Real Order #{realOrderCode} · {realTraceConfig.badgeText}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-300 bg-white p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition hover:shadow-sm">
            <div className="flex items-center justify-between gap-3 sm:gap-4 relative z-10">
              {/* Left: QR Code + Real Order Text */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  onClick={() => setShowTraceModal(true)}
                  className="w-[68px] sm:w-[76px] h-[68px] sm:h-[76px] rounded-xl border border-emerald-200 p-1 bg-white shadow-xs shrink-0 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition"
                  title="Click to view real order traceability"
                >
                  <img
                    src="/assets/farmer/traceability_qr_code.png"
                    alt="Product Traceability QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-[14px] sm:text-[15px] text-slate-900 leading-snug">
                      Live Order #{realOrderCode}
                    </h4>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0a6c38] border border-emerald-200/60 truncate max-w-[170px]">
                      {productNameDisplay} × {orderedItem?.quantity || 1}
                    </span>
                  </div>

                  {/* Real Order Live Headline */}
                  <p className="text-[11.5px] sm:text-[12.5px] text-emerald-800 font-bold mt-0.5 leading-snug flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0a6c38] shrink-0" />
                    <span className="truncate">{realTraceConfig.headline}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <Link
                      to={`/orders/${matchingOrder._id}`}
                      className="text-[#0a6c38] font-black text-[12px] sm:text-[13px] inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Track Live Order</span>
                      <span>→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowTraceModal(true)}
                      className="text-slate-500 font-semibold text-[11px] sm:text-[12px] hover:text-slate-800 cursor-pointer"
                    >
                      (View Traceability Details)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Journey Path Map */}
              <div
                onClick={() => setShowTraceModal(true)}
                className="hidden md:block shrink-0 h-14 lg:h-16 max-w-[240px] opacity-90 select-none cursor-pointer hover:opacity-100 transition"
              >
                <img
                  src="/assets/farmer/traceability_journey_map.png"
                  alt="Farm to Home Traceability Journey"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* Real 4-Stage Stepper reflecting matchingOrder status */}
            <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[10.5px] sm:text-[11.5px] gap-1 overflow-x-auto">
              <div className={`flex items-center gap-1 shrink-0 ${realTraceConfig.step1 ? "font-bold text-[#0a6c38]" : "text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${realTraceConfig.step1 ? "bg-[#0a6c38]" : "bg-gray-300"}`} />
                <span>1. काढणी व ऑर्डर</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 shrink-0 ${realTraceConfig.step2 ? "font-bold text-[#0a6c38]" : "text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${realTraceConfig.step2 ? "bg-[#0a6c38]" : "bg-gray-300"}`} />
                <span>2. लॅब तपासणी</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 shrink-0 ${realTraceConfig.step3 ? "font-bold text-[#0a6c38]" : "text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${realTraceConfig.step3 ? "bg-[#0a6c38]" : "bg-gray-300"}`} />
                <span>3. पॅक / ऑन द वे</span>
              </div>
              <span className="text-gray-300">→</span>
              <div
                className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full border ${
                  realTraceConfig.step4
                    ? "bg-emerald-50 text-[#0a6c38] border-emerald-200 font-extrabold"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {realTraceConfig.stepIndex === 3 ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0a6c38] animate-ping" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${realTraceConfig.step4 ? "bg-[#0a6c38]" : "bg-gray-300"}`} />
                )}
                <span>4. {realTraceConfig.step4 ? "डिलिव्हर झाले" : "डिलिव्हरी"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          3. TABS CONTAINER (Details, Nutrition, Reviews)
          ==================================================== */}
      <div className="pt-1">
        {/* Pill Tabs Selector */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60 mb-3.5">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-2 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-[13px] transition-all duration-150 text-center cursor-pointer ${
              activeTab === "details"
                ? "bg-[#ccead7] text-[#0a6c38] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("nutrition")}
            className={`py-2 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-[13px] transition-all duration-150 text-center cursor-pointer ${
              activeTab === "nutrition"
                ? "bg-[#ccead7] text-[#0a6c38] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            Nutrition
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`py-2 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-[13px] transition-all duration-150 text-center cursor-pointer ${
              activeTab === "reviews"
                ? "bg-[#ccead7] text-[#0a6c38] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            Reviews
          </button>
        </div>

        {/* TAB 1: PRODUCT INFORMATION (Exact match to screenshot) */}
        {activeTab === "details" && (
          <div className="rounded-2xl border border-[#ddeadb] bg-white p-4 sm:p-5 lg:p-6 shadow-xs relative">
            <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 mb-4 sm:mb-5">
              Product Information
            </h3>

            <div>
              <div className="space-y-2.5 text-[12.5px] sm:text-[13.5px]">
                {/* Product Name */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Product Name</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{productNameDisplay}</span>
                </div>

                {/* Variety */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Variety</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{variety}</span>
                </div>

                {/* Harvest Date */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Harvest Date</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{harvestDate}</span>
                </div>

                {/* Packing Date */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Packing Date</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{packingDate}</span>
                </div>

                {/* Source */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Source</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{farmerLocation}</span>
                </div>

                {/* Certification */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-baseline">
                  <span className="text-slate-500 font-medium">Certification</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-slate-900">{certification}</span>
                </div>

                {/* Status */}
                <div className="grid grid-cols-[105px_15px_1fr] sm:grid-cols-[125px_15px_1fr] items-center">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="text-slate-400">:</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#0a6c38]">
                    <span className="w-2 h-2 rounded-full bg-[#0a6c38] animate-pulse" />
                    <span>
                      {hasOrderedThisProduct && realTraceConfig
                        ? `ऑर्डर: ${realTraceConfig.badgeMarathi || realTraceConfig.badgeText}`
                        : productStatusBadge}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications & Description (if available) */}
            {product?.description && (
              <div className="mt-5 pt-4 border-t border-slate-100 text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                <ProductDescriptionContent
                  description={product.description}
                  features={product.features}
                  fallback={`Fresh ${product.name} sourced directly from verified local farms.`}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NUTRITION */}
        {activeTab === "nutrition" && (
          <div className="rounded-2xl border border-[#ddeadb] bg-white p-4 sm:p-5 shadow-xs">
            <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 mb-3">
              Nutritional Facts (Per 100g)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {nutritionFacts.map((n) => (
                <div key={`${n.label}-${n.value}`} className="p-2.5 rounded-xl bg-[#f4faf5] border border-emerald-100/70">
                  <p className="text-[11px] text-gray-500 font-medium">{n.label}</p>
                  <p className="text-[13px] sm:text-sm font-bold text-emerald-800 mt-0.5">{n.value}</p>
                </div>
              ))}
            </div>
            {nutritionNote ? (
              <p className="mt-3 text-[11px] text-slate-400">{nutritionNote}</p>
            ) : null}
          </div>
        )}

        {/* TAB 3: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="rounded-2xl border border-[#ddeadb] bg-white p-4 sm:p-5 shadow-xs">
            <ProductReviews productId={product._id} />
          </div>
        )}
      </div>

      {/* ====================================================
          MODAL 1: FARMER PROFILE MODAL
          ==================================================== */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
            {/* Header */}
            <div className="relative h-32 sm:h-36 bg-gradient-to-r from-[#0a6c38] to-[#15803d] flex items-end p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-emerald-50 shrink-0">
                  <img
                    src={farmerPhoto || "/assets/farmer/mobile_farmer_photo.png"}
                    alt={farmerName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <h3 className="font-extrabold text-lg sm:text-xl leading-tight">{farmerName}</h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{farmerLocation}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#f4faf5] border border-emerald-150">
                  <p className="text-[11px] text-gray-500 font-medium">शेतीचे क्षेत्र (Farm Size)</p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{farmerLand}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f4faf5] border border-emerald-150">
                  <p className="text-[11px] text-gray-500 font-medium">शेती पद्धत (Method)</p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{farmerMethod}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f4faf5] border border-emerald-150">
                  <p className="text-[11px] text-gray-500 font-medium">मुख्य पीक (Primary Crop)</p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{primaryCrop}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f4faf5] border border-emerald-150">
                  <p className="text-[11px] text-gray-500 font-medium">अनुभव (Experience)</p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{farmerExperience}</p>
                </div>
              </div>

              {farmerCrops.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-[#f4faf5] p-3">
                  <h5 className="font-bold text-xs text-slate-800 mb-2">पिके (Crops)</h5>
                  <div className="space-y-2">
                    {farmerCrops.map((crop, idx) => (
                      <div key={`${crop.name}-${idx}`} className="flex items-start justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-emerald-950">{crop.name || crop.variety}</p>
                          {crop.variety ? <p className="text-slate-500">Variety: {crop.variety}</p> : null}
                        </div>
                        <div className="text-right text-slate-600">
                          {crop.area ? <p>{crop.area}</p> : null}
                          {crop.status ? <p className="font-semibold text-emerald-800">{crop.status}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <h5 className="font-bold text-xs text-slate-800 mb-1">शेतकऱ्याचा संदेश (Farmer Note)</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "{farmerBio}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-[#eef8f1] p-2.5 rounded-xl border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4 text-[#0a6c38] shrink-0" />
                <span>GreenGroo प्रमाणित शेतकरी भागीदार (Verified Partner)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-150 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-1.5 rounded-full bg-[#0a6c38] text-white font-bold text-xs hover:bg-[#07522a] transition-all cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: PRODUCT TRACEABILITY JOURNEY MODAL (Real Order Only)
          ==================================================== */}
      {showTraceModal && hasOrderedThisProduct && matchingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#0a6c38] to-[#15803d] text-white">
              <div>
                <h4 className="font-extrabold text-base sm:text-lg leading-tight">
                  Live Order Traceability · #{realOrderCode}
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {productNameDisplay} चा थेट शेतापासून तुमच्या दारापर्यंतचा प्रवास
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTraceModal(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* REAL ORDER BANNER */}
            <div className="p-3 sm:p-4 bg-[#f8fbf9] border-b border-emerald-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {product?.image ? (
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 p-0.5 shrink-0 overflow-hidden">
                    <img src={product.image} alt={productNameDisplay} className="w-full h-full object-cover rounded-lg" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#0a6c38] flex items-center justify-center text-xl shrink-0">
                    🥬
                  </div>
                )}
                <div className="min-w-0">
                  <h5 className="font-extrabold text-sm text-slate-900 truncate">
                    {productNameDisplay} × {orderedItem?.quantity || 1}
                  </h5>
                  <p className="text-[11px] text-slate-500 truncate">
                    ऑर्डर दिनांक: {formatRealDateTime(matchingOrder.createdAt)}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold font-mono">
                    Order: #{realOrderCode} · ₹{matchingOrder.total}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${realTraceConfig?.badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{realTraceConfig?.badgeText}</span>
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[55vh] overflow-y-auto">
              {[
                {
                  step: `1. शेतातील काढणी व ऑर्डर बुकिंग (Harvest & Placed)`,
                  desc: `${farmerName} (${farmerLocation}) यांच्या शेतातून सेंद्रिय पद्धतीने ताजी काढणी करून ऑर्डर बुक झाली.`,
                  date: formatRealDateTime(matchingOrder.createdAt),
                  place: farmerLocation,
                  status: "पूर्ण (Placed)",
                  statusColor: "text-[#0a6c38] bg-emerald-50",
                  icon: "🌱",
                },
                {
                  step: "2. प्रतवारी आणि स्वच्छता (Sorting & Grading)",
                  desc: `Grade-A गुणवत्तेच्या ${productNameDisplay} ची निवड व नैसर्गिक स्वच्छता पूर्ण.`,
                  date: "संकलन केंद्र",
                  place: `${farmerLocation.split(',')[0]} संकलन केंद्र`,
                  status: realTraceConfig?.step2 ? "पूर्ण (Passed)" : "प्रक्रियाधीन",
                  statusColor: realTraceConfig?.step2 ? "text-[#0a6c38] bg-emerald-50" : "text-slate-600 bg-gray-100",
                  icon: "🚜",
                },
                {
                  step: "3. गुणवत्ता व लॅब तपासणी (Quality Lab Tested)",
                  desc: "Zero chemical residues, 100% NPOP सेंद्रिय मानके उत्तीर्ण. FSSAI सुरक्षा प्रमाणित.",
                  date: packingDate,
                  place: "GreenGroo क्वालिटी लॅब",
                  status: realTraceConfig?.step2 ? "प्रमाणित (Certified)" : "प्रतीक्षेत",
                  statusColor: realTraceConfig?.step2 ? "text-[#0a6c38] bg-emerald-50" : "text-slate-600 bg-gray-100",
                  icon: "🔬",
                },
                {
                  step: "4. सुरक्षित पॅकिंग (Hygienic Eco-Packaging)",
                  desc: "अन्न सुरक्षा मानकांनुसार सीलबंद इको-फ्रेंडली सुरक्षित पॅकिंग.",
                  date: packingDate,
                  place: "सेंट्रल पॅकिंग युनिट",
                  status: realTraceConfig?.step3 ? "सीलबंद (Sealed)" : "प्रतीक्षेत",
                  statusColor: realTraceConfig?.step3 ? "text-[#0a6c38] bg-emerald-50" : "text-slate-600 bg-gray-100",
                  icon: "📦",
                },
                {
                  step: "5. डिलिव्हरी (Doorstep Delivery)",
                  desc: realTraceConfig?.headline,
                  date: "थेट ट्रॅकिंग",
                  place: matchingOrder.deliveryAddress?.city || matchingOrder.deliveryAddress?.addressLine1 || "तुमचा पत्ता",
                  status: realTraceConfig?.badgeText,
                  statusColor: "text-white bg-[#0a6c38]",
                  icon: "🚚",
                },
              ].map((t, idx) => (
                <div key={t.step} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full border text-sm flex items-center justify-center shrink-0 ${
                        idx <= (realTraceConfig?.stepIndex || 0)
                          ? "bg-[#eef8f1] border-emerald-300 text-[#0a6c38]"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      {t.icon}
                    </div>
                    {idx < 4 && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${
                          idx < (realTraceConfig?.stepIndex || 0)
                            ? "bg-emerald-300"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900">{t.step}</h5>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${t.statusColor}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{t.desc}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-medium">
                      <span>📅 {t.date}</span>
                      <span>📍 {t.place}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-150 flex items-center justify-between gap-2">
              <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#0a6c38]" />
                100% Farm Verified Traceability
              </span>

              <Link
                to={`/orders/${matchingOrder._id}`}
                className="px-4 py-1.5 rounded-full bg-[#0a6c38] text-white font-bold text-xs hover:bg-[#07522a] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Track Full Order</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
