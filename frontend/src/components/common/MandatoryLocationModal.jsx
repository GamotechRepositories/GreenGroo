import React, { useState, useEffect } from "react";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { getAddresses, getActiveDarkStores } from "../../api/api";
import { detectCurrentLocation, formatDeliveryLine } from "../../utils/detectCurrentLocation";
import { formatAddressLine, getAddressFullName, getAddressTypeTag, sortAddressesByLatest } from "../../utils/addressDisplay";
import AddressTagBadge from "../address/AddressTagBadge";
import MapLocationPicker from "../address/MapLocationPicker";
import { MapPin, Navigation, Compass, Check } from "lucide-react";

export default function MandatoryLocationModal() {
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { location, hasLocation, setLocation } = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [darkStores, setDarkStores] = useState([]);

  // Load saved locations for logged-in user
  useEffect(() => {
    let isMounted = true;
    if (user) {
      getAddresses()
        .then((res) => {
          if (!isMounted) return;
          const addrs = res.data?.data || res.data || [];
          const list = sortAddressesByLatest(Array.isArray(addrs) ? addrs : []);
          setSavedLocations(list);
          if (list.length > 0) {
            setSelectedId(list[0]._id || list[0].id);
          }
        })
        .catch(console.error);
    } else {
      setSavedLocations([]);
      setSelectedId("");
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const isAuthOrLocationPage = [
    "/login",
    "/signup",
    "/signin",
    "/register",
    "/location",
  ].some((path) => routerLocation.pathname.startsWith(path));

  // If user already picked location or auth is still loading or on auth/location route, do not render modal
  if (hasLocation || authLoading || isAuthOrLocationPage) {
    return null;
  }

  const applyLocation = (next) => {
    setLocation({
      label: next.label || next.area || next.city || "Delivery location",
      address: next.address || formatDeliveryLine(next),
      pincode: next.pincode || "",
      city: next.city || "",
      state: next.state || "",
      area: next.area || "",
      lat: next.lat ?? next.latitude,
      lng: next.lng ?? next.longitude,
      shopName: next.shopName || "",
      landmark: next.landmark || "",
      fullAddress: next.fullAddress || "",
    });
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setDetecting(true);
    try {
      const detected = await detectCurrentLocation();
      applyLocation(detected);
    } catch (err) {
      setError(err.message || "Allow location access to check local store inventory");
    } finally {
      setDetecting(false);
    }
  };

  const handleMapConfirm = (mapLocation) => {
    setIsMapOpen(false);
    applyLocation({
      ...mapLocation,
      label: mapLocation.label || mapLocation.area || mapLocation.city || "Pinned Location",
    });
  };

  const handleConfirmSaved = () => {
    const loc = savedLocations.find((item) => (item._id || item.id) === selectedId);
    if (loc) {
      applyLocation({
        label: loc.label || getAddressFullName(loc),
        address: loc.fullAddress || formatAddressLine(loc),
        city: loc.city,
        area: loc.area || loc.streetArea,
        pincode: loc.pincode,
        state: loc.state,
        lat: loc.location?.lat,
        lng: loc.location?.lng,
        shopName: loc.shopName,
        landmark: loc.landmark,
        fullAddress: loc.fullAddress,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-primary to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <MapPin className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Choose Delivery Location</h2>
              <p className="text-xs text-white/80">To view instant grocery stock & delivery times</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {isMapOpen ? (
            /* Map Picker Mode */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Pin your location on map</span>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(false)}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Cancel map
                </button>
              </div>
              <MapLocationPicker
                initialLocation={location?.lat && location?.lng ? location : null}
                onConfirm={handleMapConfirm}
                onCancel={() => setIsMapOpen(false)}
              />
            </div>
          ) : (
            /* Location Selection Options (Accessible to ALL users, logged in or guest) */
            <>
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              {/* Action Buttons: Current Location & Select on Map */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detecting}
                  className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-emerald-50/60 p-4 text-left transition hover:bg-emerald-100/70 disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                    <Navigation className={`h-5 w-5 ${detecting ? "animate-spin" : ""}`} />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">
                      {detecting ? "Locating…" : "Current location"}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      Auto-detect GPS
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-primary/40 hover:bg-white hover:shadow-sm cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                    <Compass className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">Select on map</span>
                    <span className="block truncate text-xs text-slate-500">Pin exact address</span>
                  </div>
                </button>
              </div>

              {/* Active Dark Stores / Service Areas */}
              {darkStores.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Or select by Dark Store / Area
                    </p>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {darkStores.length} Stores Available
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {darkStores.map((store) => (
                      <button
                        key={store.id || store.storeName}
                        type="button"
                        onClick={() => {
                          applyLocation({
                            label: store.storeName || `${store.area} Dark Store`,
                            address: store.address || `${store.area}, ${store.city}`,
                            area: store.area,
                            city: store.city,
                            pincode: store.pincode,
                            lat: store.latitude,
                            lng: store.longitude,
                            fullAddress: store.address || `${store.area}, ${store.city}`,
                          });
                        }}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-base">
                          🏪
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {store.area || store.storeName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {store.storeName} · {store.inStockCount > 0 ? `${store.inStockCount} items in stock` : "Active"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback if no dark stores found */}
              {darkStores.length === 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quick Select Area
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      applyLocation({
                        label: "Pune / Hinjewadi",
                        address: "Hinjewadi Phase 2, Pune, Maharashtra, 411057",
                        area: "Hinjewadi Phase 2",
                        city: "Pune",
                        state: "Maharashtra",
                        pincode: "411057",
                        lat: 18.5958889,
                        lng: 73.7183078,
                        fullAddress: "Hinjewadi Phase 2, Pune, Maharashtra, 411057",
                      });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-base">
                      📍
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">Browse Pune / Hinjewadi Area</p>
                      <p className="text-[10px] text-slate-500">Quickly explore fresh produce & delivery catalog</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Saved Locations for Logged-in User */}
              {user && savedLocations.length > 0 ? (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Or select from saved locations
                    </p>
                    <span className="text-[11px] font-medium text-slate-400">
                      Latest 3 addresses
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedLocations.slice(0, 3).map((loc, index) => {
                      const id = loc._id || loc.id;
                      const isSelected = selectedId === id;
                      const tag = getAddressTypeTag(loc, index);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedId(id)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                            isSelected
                              ? "border-primary bg-emerald-50/60 ring-2 ring-primary/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected ? "border-primary bg-primary text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <AddressTagBadge tag={tag} />
                              <p className="text-sm font-bold text-slate-900">
                                {getAddressFullName(loc) || loc.label || tag}
                              </p>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {formatAddressLine(loc)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                              {[loc.area || loc.streetArea, loc.city, loc.pincode ? `PIN ${loc.pincode}` : ""].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmSaved}
                    disabled={!selectedId}
                    className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    Confirm & Enter Store
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
