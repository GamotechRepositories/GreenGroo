import React, { useState, useEffect, useRef } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";
import { getActiveDarkStores } from "../../api/api";
import { detectCurrentLocation, formatDeliveryLine } from "../../utils/detectCurrentLocation";
import toast from "react-hot-toast";

// Supported Delivery Cities with their primary coordinates & default delivery hubs
const SUPPORTED_CITIES = [
  {
    name: "Pune",
    state: "Maharashtra",
    lat: 18.5958889,
    lng: 73.7183078,
    pincode: "411057",
    area: "Hinjewadi Phase 2",
    address: "Hinjewadi Phase 2, Pune, Maharashtra, 411057",
    isStoreActive: true,
    storeTag: "Active Dark Store",
    areas: ["Hinjewadi", "Wakad", "Baner", "Kothrud", "Aundh", "Viman Nagar", "Magarpatta", "Shivaji Nagar"],
  },
  {
    name: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    pincode: "400069",
    area: "Andheri East",
    address: "Andheri East, Mumbai, Maharashtra, 400069",
    isStoreActive: true,
    storeTag: "Quick Delivery",
    areas: ["Andheri", "Bandra", "Borivali", "Dadar", "Powai", "Goregaon", "Ghatkopar", "Juhu"],
  },
  {
    name: "Thane",
    state: "Maharashtra",
    lat: 19.2183,
    lng: 72.9781,
    pincode: "400601",
    area: "Thane West",
    address: "Thane West, Maharashtra, 400601",
    isStoreActive: true,
    storeTag: "Delivery Available",
    areas: ["Thane West", "Majiwada", "Ghodbunder Road", "Naupada", "Vartak Nagar"],
  },
  {
    name: "Navi Mumbai",
    state: "Maharashtra",
    lat: 19.033,
    lng: 73.0297,
    pincode: "400703",
    area: "Vashi",
    address: "Vashi, Navi Mumbai, Maharashtra, 400703",
    isStoreActive: true,
    storeTag: "Delivery Available",
    areas: ["Vashi", "Nerul", "Kharghar", "Seawoods", "CBD Belapur", "Kopar Khairane"],
  },
  {
    name: "Nashik",
    state: "Maharashtra",
    lat: 19.9975,
    lng: 73.7898,
    pincode: "422005",
    area: "College Road",
    address: "College Road, Nashik, Maharashtra, 422005",
    isStoreActive: true,
    storeTag: "Fresh Farm Hub",
    areas: ["College Road", "Indira Nagar", "Gangapur Road", "Panchavati", "Mahatma Nagar"],
  },
];

export default function MandatoryLocationModal() {
  const routerLocation = useRouterLocation();
  const {
    location,
    hasLocation,
    setLocation,
    isLocationModalOpen,
    closeLocationModal,
  } = useLocation();

  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkStores, setDarkStores] = useState([]);

  const dropdownRef = useRef(null);

  // Fetch active dark stores from backend to enrich cities
  useEffect(() => {
    let isMounted = true;
    getActiveDarkStores()
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || [];
        setDarkStores(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (isMounted) setDarkStores([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    if (showCityDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showCityDropdown]);

  // Don't show modal on auth pages to avoid overlapping modals
  const isAuthPage = [
    "/login",
    "/signup",
    "/signin",
    "/register",
  ].some((path) => routerLocation.pathname.startsWith(path));

  // Modal MUST display if user has not selected a location yet, OR if manually opened
  // Location selection is strictly mandatory - user cannot enter without selecting location!
  const shouldShow = !isAuthPage && (!hasLocation || isLocationModalOpen);

  if (!shouldShow) {
    return null;
  }

  const applyLocationData = (next) => {
    setLocation({
      label: next.label || next.area || next.city || "Delivery location",
      address: next.address || formatDeliveryLine(next),
      pincode: next.pincode || "",
      city: next.city || "",
      state: next.state || "Maharashtra",
      area: next.area || "",
      lat: next.lat ?? next.latitude,
      lng: next.lng ?? next.longitude,
      shopName: next.shopName || "",
      landmark: next.landmark || "",
      fullAddress: next.fullAddress || next.address || "",
    });
    setShowCityDropdown(false);
    setError("");
    closeLocationModal();
  };

  // --- 1. Detect my location (GPS Geolocation) ---
  const handleDetectLocation = async () => {
    setError("");
    setDetecting(true);
    try {
      const detected = await detectCurrentLocation();
      applyLocationData(detected);
      toast.success(
        `Location set: ${detected.city || detected.area || "Current Location"}`
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not detect location. Please choose your city from 'Select City ▾'."
      );
    } finally {
      setDetecting(false);
    }
  };

  // --- 2. Select City Click ---
  const handleSelectCity = (cityItem) => {
    // Check if there is an active dark store in this city
    const matchedStore = darkStores.find(
      (s) =>
        s.city?.toLowerCase() === cityItem.name.toLowerCase() ||
        cityItem.name.toLowerCase().includes(s.city?.toLowerCase() || "")
    );

    if (matchedStore) {
      applyLocationData({
        label: `${cityItem.name} (${matchedStore.area || "Store"})`,
        city: matchedStore.city || cityItem.name,
        area: matchedStore.area || cityItem.area,
        address: matchedStore.address || cityItem.address,
        pincode: matchedStore.pincode || cityItem.pincode,
        state: matchedStore.state || cityItem.state,
        lat: matchedStore.latitude || cityItem.lat,
        lng: matchedStore.longitude || cityItem.lng,
        shopName: matchedStore.storeName || "",
        fullAddress: matchedStore.address || cityItem.address,
      });
    } else {
      applyLocationData({
        label: cityItem.name,
        city: cityItem.name,
        area: cityItem.area,
        address: cityItem.address,
        pincode: cityItem.pincode,
        state: cityItem.state,
        lat: cityItem.lat,
        lng: cityItem.lng,
        shopName: cityItem.storeTag || "",
        fullAddress: cityItem.address,
      });
    }

    toast.success(`Delivery city set to ${cityItem.name}`);
  };

  // Filter cities by search query
  const filteredCities = SUPPORTED_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.areas?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBackdropClick = (e) => {
    // Only allow closing via backdrop if user ALREADY has a location set and opened modal manually
    if (e.target === e.currentTarget && hasLocation && isLocationModalOpen) {
      closeLocationModal();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 transition-all duration-200 select-none"
      aria-modal="true"
      role="dialog"
    >
      {/* Centered Modal Card matching the screenshot - Cross button removed */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-[480px] bg-white rounded-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 p-6 sm:p-7 text-left transition-all"
      >
        {/* 1. Welcome to GreenGrocc Heading */}
        <h2 className="text-[19px] sm:text-[21px] font-bold text-gray-800 tracking-tight">
          Welcome to <span className="text-[#1da851] font-bold">GreenGrocc</span>
        </h2>

        {/* 2. Location Pin and Message Row */}
        <div className="mt-4 sm:mt-5 flex items-center gap-3.5 sm:gap-4">
          {/* Black Location Pin Icon with circle cutout */}
          <div className="shrink-0">
            <svg
              className="w-6 h-8 text-black fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>

          <p className="text-[13px] sm:text-[14px] text-gray-600 leading-[1.35] font-medium">
            Please provide your location to see products available for the location
          </p>
        </div>

        {/* Error notice if location detection fails */}
        {error && (
          <div className="mt-3.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* 3. Action Buttons Row (Detect my location -- OR -- Select City ▾) */}
        <div className="mt-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 relative">
          {/* Detect my location green pill button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="h-11 px-5 sm:px-6 rounded-full bg-[#1ea751] hover:bg-[#189345] active:scale-[0.98] text-white text-[13.5px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 whitespace-nowrap"
          >
            {detecting ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Detecting...</span>
              </>
            ) : (
              <span>Detect my location</span>
            )}
          </button>

          {/* OR divider */}
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <div className="w-3.5 sm:w-5 h-[1px] bg-gray-200" />
            <span className="h-5.5 px-2 rounded-full border border-gray-200 text-gray-400 text-[10px] font-bold flex items-center justify-center uppercase tracking-wider">
              OR
            </span>
            <div className="w-3.5 sm:w-5 h-[1px] bg-gray-200" />
          </div>

          {/* Select City ▾ Dropdown Trigger */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="text-[13.5px] sm:text-[14px] font-bold text-gray-800 hover:text-[#1ea751] transition-colors flex items-center gap-1 cursor-pointer select-none py-1.5 whitespace-nowrap"
            >
              <span>{location?.city && location?.city !== "Select your delivery location" ? location.city : "Select City"}</span>
              <svg
                className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${
                  showCityDropdown ? "rotate-180 text-[#1ea751]" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* City Dropdown Menu */}
            {showCityDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-fadeIn">
                {/* Search box within dropdown */}
                <div className="px-2 pt-1 pb-2 border-b border-gray-100 mb-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city or area..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Cities list */}
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredCities.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-50/70 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 group-hover:text-emerald-600 text-xs">📍</span>
                          <span className="text-[13px] font-bold text-gray-800 group-hover:text-emerald-700">
                            {c.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 group-hover:text-emerald-600/80 truncate pl-4">
                          {c.areas.slice(0, 3).join(", ")}...
                        </p>
                      </div>

                      {c.isStoreActive && (
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </button>
                  ))}

                  {filteredCities.length === 0 && (
                    <div className="py-3 text-center text-xs text-gray-400">
                      No matching city found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
