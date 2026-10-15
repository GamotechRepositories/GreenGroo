import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Navigation, Search, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import {
  loadGoogleMaps,
  googleReverseGeocode,
  getGoogleMapsApiKey,
} from "../../utils/googleMapsLoader";
import { clientReverseGeocode, getPosition } from "../../utils/detectCurrentLocation";

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 }; // Pune default

// Monochromatic Grey & White Map Style (100% Google Maps v3 Compliant):
// - Land, Parks, and other backgrounds: Pure White (#ffffff)
// - Roads: Solid Distinct Grey (#808080 / #737373 / #525252)
// - Water: Clean Light Silver (#f1f5f9)
// - Text: Dark Charcoal (#262626) with White Halo
// - POIs & Transit: Hidden
const GREY_AND_WHITE_MAP_STYLES = [
  // 1. All background and land in PURE WHITE
  {
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#262626" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  // 2. Hide POIs and transit clutter
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d4d4d4" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#171717" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  // 3. Roads in DISTINCT GREY COLOUR
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#808080" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a3a3a3" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#404040" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#525252" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#333333" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#737373" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  // 4. Water in clean light silver-white
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#f1f5f9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
];

export default function MapLocationPicker({ onConfirm, onCancel, initialLocation = null }) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [center, setCenter] = useState(
    initialLocation?.lat && initialLocation?.lng
      ? { lat: Number(Number(initialLocation.lat).toFixed(6)), lng: Number(Number(initialLocation.lng).toFixed(6)) }
      : null
  );
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locating, setLocating] = useState(false);

  // 1. Determine Initial Center (Initial Location -> High Accuracy GPS -> Default Pune)
  useEffect(() => {
    if (center) {
      setInitialLoading(false);
      return;
    }

    let isMounted = true;
    getPosition()
      .then((position) => {
        if (isMounted) {
          setCenter({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setCenter(DEFAULT_CENTER);
        }
      })
      .finally(() => {
        if (isMounted) setInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. High-Accuracy Reverse Geocode Helper
  const resolveAddress = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    const preciseLat = Number(lat.toFixed(6));
    const preciseLng = Number(lng.toFixed(6));

    try {
      const googleResult = await googleReverseGeocode(preciseLat, preciseLng);
      setCurrentAddress(googleResult);
    } catch {
      // Fallback to client reverse geocode if Google Geocoding fails or is unkeyed
      try {
        const fallbackResult = await clientReverseGeocode(preciseLat, preciseLng);
        setCurrentAddress({
          ...fallbackResult,
          lat: preciseLat,
          lng: preciseLng,
        });
      } catch {
        setCurrentAddress({
          lat: preciseLat,
          lng: preciseLng,
          address: `Location (${preciseLat.toFixed(5)}, ${preciseLng.toFixed(5)})`,
          area: "",
          city: "",
          state: "",
          pincode: "",
          label: "Pinned Location",
        });
      }
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // 3. Initialize Google Maps instance with Grey & White Theme
  useEffect(() => {
    if (initialLoading || !center || !mapContainerRef.current) return;

    let isMounted = true;

    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Initialize Map with street-level doorstep zoom (17) and locked boundaries (min 14)
        const map = new googleMaps.Map(mapContainerRef.current, {
          center,
          zoom: 17,
          minZoom: 14,
          maxZoom: 20,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: googleMaps.ControlPosition.RIGHT_BOTTOM,
          },
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: GREY_AND_WHITE_MAP_STYLES,
        });

        mapInstanceRef.current = map;

        // Force container resize check so map never stays zoomed-out to state level
        const triggerResize = () => {
          if (!mapInstanceRef.current || !center) return;
          googleMaps.event.trigger(mapInstanceRef.current, "resize");
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(17);
        };
        setTimeout(triggerResize, 100);
        setTimeout(triggerResize, 350);
        setTimeout(triggerResize, 350);

        // User starts moving/panning map
        map.addListener("dragstart", () => {
          setIsDragging(true);
        });

        // When map stops moving (idle event) - calculate exact center
        map.addListener("idle", () => {
          setIsDragging(false);
          const newCenter = map.getCenter();
          if (!newCenter) return;

          const lat = Number(newCenter.lat().toFixed(6));
          const lng = Number(newCenter.lng().toFixed(6));

          setCenter({ lat, lng });
          resolveAddress(lat, lng);
        });

        // Attach Google Places Autocomplete if search input exists
        if (searchInputRef.current && googleMaps.places?.Autocomplete) {
          const autocomplete = new googleMaps.places.Autocomplete(
            searchInputRef.current,
            {
              componentRestrictions: { country: "in" },
              fields: ["geometry", "formatted_address", "name"],
            }
          );
          autocompleteRef.current = autocomplete;

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              toast.error("Location details not found for this place");
              return;
            }

            const targetLat = Number(place.geometry.location.lat().toFixed(6));
            const targetLng = Number(place.geometry.location.lng().toFixed(6));

            map.panTo({ lat: targetLat, lng: targetLng });
            map.setZoom(17);
            setSearchQuery(place.name || place.formatted_address || "");
          });
        }

        // Run initial reverse geocode for center
        resolveAddress(center.lat, center.lng);
      })
      .catch((err) => {
        console.error("[GoogleMaps] Failed to load:", err);
        if (isMounted) {
          setLoadError(err.message || "Could not load Google Maps");
        }
      });

    return () => {
      isMounted = false;
      mapInstanceRef.current = null;
      autocompleteRef.current = null;
    };
  }, [initialLoading, resolveAddress]);

  // Handle "Current Location" Button with High-Accuracy GPS
  const handleRecenterToCurrent = () => {
    setLocating(true);
    getPosition()
      .then((position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(17);
        } else {
          setCenter({ lat, lng });
          resolveAddress(lat, lng);
        }
      })
      .catch(() => {
        toast.error("Could not retrieve current GPS position");
      })
      .finally(() => {
        setLocating(false);
      });
  };

  const handleConfirm = () => {
    if (!currentAddress) return;
    onConfirm(currentAddress);
  };

  if (initialLoading) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <Loader2 className="h-7 w-7 animate-spin text-slate-800" />
        <span className="mt-3 text-xs font-semibold text-slate-700">Getting exact location...</span>
        <span className="mt-0.5 text-[11px] text-slate-400">Loading Google Maps</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
        <h4 className="mt-2 text-sm font-bold text-slate-800">Google Maps Unavailable</h4>
        <p className="mt-1 max-w-sm text-xs text-slate-500">{loadError}</p>
        {!getGoogleMapsApiKey() && (
          <p className="mt-2 rounded-lg bg-amber-100/70 px-3 py-1.5 text-[11px] font-medium text-amber-800">
            Tip: Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>frontend/.env</code> for full Google Maps access.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setLoadError("");
              setInitialLoading(true);
              setTimeout(() => setInitialLoading(false), 200);
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      {/* Floating Places Search Bar */}
      <div className="absolute left-3 right-3 top-3 z-10">
        <div className="flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md transition-all focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/10">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search society, landmark, or area..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Google Map Viewport with Grey & White Monochrome Engine */}
      <div className="relative flex-1 bg-white grey-white-map-canvas">
        <style>{`
          /* Suppress development error overlay / backdrop dialogs */
          .grey-white-map-canvas .gm-err-container,
          .grey-white-map-canvas div[tabindex="0"][role="dialog"],
          .grey-white-map-canvas div[style*="z-index: 10000001"] {
            display: none !important;
          }
        `}</style>
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Re-center GPS Button */}
        <button
          type="button"
          onClick={handleRecenterToCurrent}
          disabled={locating}
          title="Use my current GPS location"
          className="absolute bottom-4 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Navigation className={`h-3.5 w-3.5 text-slate-800 ${locating ? "animate-spin" : ""}`} />
        </button>

        {/* 
          EXACT MATHEMATICAL CENTER (left: 50%, top: 50%)
          The needle tip and ground target dot are centered exactly at (0, 0)
        */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20">
          {/* Ground GPS Target Ring (Anchored directly at (0, 0)) */}
          <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              {/* Soft pulse aura */}
              <div
                className={`h-4 w-4 rounded-full bg-slate-900/15 transition-all duration-200 ${
                  isDragging ? "scale-150 opacity-100 ring-2 ring-slate-900/20" : "scale-100 opacity-50"
                }`}
              />
              {/* High-accuracy center target dot */}
              <div className="absolute h-1.5 w-1.5 rounded-full bg-slate-900 shadow-xs" />
            </div>
          </div>

          {/* 
            Sleek, Compact Delivery Pin 
            Anchored with -translate-x-1/2 so the needle tip at (10, 28) touches (0, 0) precisely
          */}
          <div
            className={`absolute left-0 top-0 -translate-x-1/2 transition-transform duration-150 ${
              isDragging ? "-translate-y-[calc(100%+8px)] scale-105" : "-translate-y-full scale-100"
            }`}
          >
            {/* Floating Context Badge (Placed independently above) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-md">
                <span>{isDragging ? "Pinpoint location" : "Delivering here"}</span>
              </div>
              {/* Pointer triangle */}
              <div className="mx-auto h-0 w-0 border-x-[3px] border-t-[3px] border-x-transparent border-t-slate-900" />
            </div>

            {/* Compact Professional Vector Pin (20px x 28px, Needle tip at (10, 28)) */}
            <svg
              width="20"
              height="28"
              viewBox="0 0 20 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.35)]"
            >
              {/* Sleek Charcoal Teardrop Marker */}
              <path
                d="M10 0C4.47715 0 0 4.47715 0 10C0 17.5 10 28 10 28C10 28 20 17.5 20 10C20 4.47715 15.5228 0 10 0Z"
                fill="url(#pin_slate_gradient)"
              />
              {/* Crisp inner white beacon ring */}
              <circle cx="10" cy="9.5" r="3.8" fill="#ffffff" />
              {/* Inner core dot */}
              <circle cx="10" cy="9.5" r="2" fill="#0f172a" />

              <defs>
                <linearGradient
                  id="pin_slate_gradient"
                  x1="10"
                  y1="0"
                  x2="10"
                  y2="28"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Address Details Sheet */}
      <div className="relative z-20 border-t border-slate-100 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isGeocoding ? "Locating Address..." : "Select delivery location"}
            </h3>
            {currentAddress?.pincode && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                PIN {currentAddress.pincode}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 min-h-[32px] text-xs font-semibold text-slate-800">
            {isGeocoding
              ? "Fetching exact Google Maps address..."
              : currentAddress?.address || "Drag the map to position the pin at your doorstep"}
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isGeocoding || !currentAddress}
            className="flex-1 rounded-xl bg-[#217346] py-2.5 text-xs font-bold text-white shadow-md shadow-[#217346]/20 transition hover:bg-[#1a5c38] disabled:opacity-50"
          >
            {isGeocoding ? "Locating..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
