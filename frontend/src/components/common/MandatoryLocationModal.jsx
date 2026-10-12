import React, { useState, useEffect } from "react";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import { getAddresses } from "../../api/api";
import { detectCurrentLocation, formatDeliveryLine } from "../../utils/detectCurrentLocation";
import { formatAddressLine, getAddressFullName } from "../../utils/addressDisplay";
import MapLocationPicker from "../address/MapLocationPicker";
import { MapPin, Navigation, Compass, Check, ArrowRight, ShieldCheck } from "lucide-react";

export default function MandatoryLocationModal() {
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { hasLocation, setLocation } = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Load saved locations for logged-in user
  useEffect(() => {
    let isMounted = true;
    if (user) {
      getAddresses()
        .then((res) => {
          if (!isMounted) return;
          const addrs = res.data?.data || res.data || [];
          const list = Array.isArray(addrs) ? addrs : [];
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
          {/* If NOT logged in, require login first */}
          {!user ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sign in to Enter GreenGroo</h3>
              <p className="mt-1 text-xs text-slate-600">
                Please sign in to your account first so you can select your location and view fresh produce in your area.
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/login", { state: { from: routerLocation.pathname || "/" } })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-emerald-700 active:scale-[0.98] cursor-pointer"
                >
                  Sign In to Continue
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/signup", { state: { from: routerLocation.pathname || "/" } })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-white py-2.5 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 active:scale-[0.98] cursor-pointer"
                >
                  Create New Account
                </button>
              </div>
            </div>
          ) : isMapOpen ? (
            /* Map Picker Mode */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Pin your location on map</span>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(false)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Cancel map
                </button>
              </div>
              <MapLocationPicker
                onConfirm={handleMapConfirm}
                onCancel={() => setIsMapOpen(false)}
              />
            </div>
          ) : (
            /* Logged in Location Selection Options */
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
                  className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-emerald-50/60 p-4 text-left transition hover:bg-emerald-100/70 disabled:opacity-60 shadow-xs"
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
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-primary/40 hover:bg-white hover:shadow-sm"
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

              {/* Saved Locations */}
              {savedLocations.length > 0 ? (
                <div>
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Or select from saved locations
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedLocations.map((loc) => {
                      const id = loc._id || loc.id;
                      const isSelected = selectedId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedId(id)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
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
                            <p className="text-sm font-bold text-slate-900">
                              {loc.label || getAddressFullName(loc)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {formatAddressLine(loc)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                              {loc.city} · PIN {loc.pincode}
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
                    className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-emerald-700 disabled:opacity-50"
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
