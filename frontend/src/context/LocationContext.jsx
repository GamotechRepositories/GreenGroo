import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "../lib/queryClient";
import { DELIVERY_LOCATION_KEY, deliveryLocationKey } from "../utils/deliveryLocation";

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  label: "Home",
  address: "Select your delivery location",
  pincode: "",
};

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(DELIVERY_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function locationIsSet(location) {
  if (!location) return false;
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  const hasCoords = lat != null && lat !== "" && lng != null && lng !== "";
  return Boolean(hasCoords || location.pincode || location.city);
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => readStoredLocation() || DEFAULT_LOCATION);

  const setLocation = useCallback((next) => {
    setLocationState(next);
    localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(next));
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["nearest-store"] });
  }, []);

  useEffect(() => {
    if (!readStoredLocation()) {
      setLocationState(DEFAULT_LOCATION);
    }
  }, []);

  const value = useMemo(
    () => ({
      location,
      setLocation,
      hasLocation: locationIsSet(location),
      locationKey: deliveryLocationKey(location),
    }),
    [location, setLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}

export function useDeliveryLocationKey() {
  const { locationKey } = useLocation();
  return locationKey;
}
