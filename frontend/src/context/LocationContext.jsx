import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "greengrocc_delivery_location";

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  label: "Home",
  address: "Select your delivery location",
  pincode: "",
};

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => readStoredLocation() || DEFAULT_LOCATION);

  const setLocation = useCallback((next) => {
    setLocationState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!readStoredLocation()) {
      setLocationState(DEFAULT_LOCATION);
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, hasLocation: Boolean(location?.pincode) }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}
