import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "../lib/queryClient";
import { DELIVERY_LOCATION_KEY, deliveryLocationKey } from "../utils/deliveryLocation";

const DEFAULT_LOCATION = {
  label: "Home",
  address: "Select your delivery location",
  pincode: "",
};

const DEFAULT_FALLBACK_VALUE = {
  location: DEFAULT_LOCATION,
  setLocation: () => {},
  hasLocation: false,
  locationKey: deliveryLocationKey(DEFAULT_LOCATION),
  isLocationModalOpen: false,
  openLocationModal: () => {},
  closeLocationModal: () => {},
};

const LocationContext = createContext(DEFAULT_FALLBACK_VALUE);

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
  if (location.address && location.address !== "Select your delivery location") return true;
  if (location.fullAddress) return true;
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  const hasCoords = lat != null && lat !== "" && lng != null && lng !== "";
  return Boolean(hasCoords || location.pincode || location.city || location.area);
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => readStoredLocation() || DEFAULT_LOCATION);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const openLocationModal = useCallback(() => {
    setIsLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
  }, []);

  const setLocation = useCallback((next) => {
    setLocationState(next);
    localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(next));
    setIsLocationModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["sections"] });
    queryClient.invalidateQueries({ queryKey: ["brands"] });
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
      isLocationModalOpen,
      openLocationModal,
      closeLocationModal,
    }),
    [location, setLocation, isLocationModalOpen, openLocationModal, closeLocationModal]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  return ctx || DEFAULT_FALLBACK_VALUE;
}

export function useDeliveryLocationKey() {
  const { locationKey } = useLocation();
  return locationKey;
}
