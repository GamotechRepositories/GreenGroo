import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { clientReverseGeocode, getPosition } from "../../utils/detectCurrentLocation";

function MapCenterTracker({ onCenterChange }) {
  useMapEvents({
    dragend: (e) => {
      const map = e.target;
      onCenterChange(map.getCenter());
    },
    zoomend: (e) => {
      const map = e.target;
      onCenterChange(map.getCenter());
    }
  });
  return null;
}

export default function MapLocationPicker({ onConfirm, onCancel }) {
  const [center, setCenter] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Get initial location on mount
  useEffect(() => {
    getPosition()
      .then((position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      })
      .catch((err) => {
        toast.error("Could not get current location, using default.");
        setCenter({ lat: 19.0760, lng: 72.8777 }); // Default to Mumbai
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  // Geocode whenever center changes
  useEffect(() => {
    if (!center) return;
    
    let isMounted = true;
    setIsGeocoding(true);
    
    // Slight debounce for dragging
    const timeoutId = setTimeout(() => {
      clientReverseGeocode(center.lat, center.lng)
        .then((res) => {
          if (isMounted) setCurrentAddress(res);
        })
        .catch(() => {
          if (isMounted) setCurrentAddress(null);
        })
        .finally(() => {
          if (isMounted) setIsGeocoding(false);
        });
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [center]);

  const handleConfirm = () => {
    if (!currentAddress) return;
    onConfirm(currentAddress);
  };

  if (initialLoading || !center) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-500 font-medium">Getting your location...</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[450px] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1">
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={true}
          className="absolute inset-0 z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterTracker onCenterChange={(newCenter) => setCenter({ lat: newCenter.lat, lng: newCenter.lng })} />
        </MapContainer>
        
        {/* Fixed Center Pin */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
           <MapPin className="h-10 w-10 text-red-500 animate-bounce fill-red-500/20" />
           {/* Shadow ellipse to anchor the bounce */}
           <div className="mx-auto mt-1 h-1 w-3 rounded-[100%] bg-black/30" />
        </div>
      </div>

      {/* Bottom Sheet Details */}
      <div className="bg-white p-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] z-20 relative">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {isGeocoding ? "Locating..." : "Select delivery location"}
          </h3>
          <p className="text-xs text-slate-500 min-h-[32px] line-clamp-2">
            {isGeocoding 
              ? "Fetching address details..." 
              : currentAddress?.address || "Drag map to pin your location"}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isGeocoding || !currentAddress}
            className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
