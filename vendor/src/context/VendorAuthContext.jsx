import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { vendorApi, setVendorToken, VENDOR_STORAGE_KEY } from "../api/vendorApi";

const VendorAuthContext = createContext(null);

export function VendorAuthProvider({ children }) {
  const [vendor, setVendor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persist = (nextVendor, nextToken) => {
    setVendor(nextVendor);
    setToken(nextToken);
    setVendorToken(nextToken);
    localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify({ vendor: nextVendor, token: nextToken }));
  };

  const clear = () => {
    setVendor(null);
    setToken(null);
    setVendorToken(null);
    localStorage.removeItem(VENDOR_STORAGE_KEY);
  };

  useEffect(() => {
    const init = async () => {
      const raw = localStorage.getItem(VENDOR_STORAGE_KEY);
      if (!raw) { setLoading(false); return; }
      try {
        const saved = JSON.parse(raw);
        if (!saved?.token) { clear(); return; }
        setVendorToken(saved.token);
        const res = await vendorApi.me();
        persist(res.data, saved.token);
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (credentials) => {
    const res = await vendorApi.login(credentials);
    persist(res.data.vendor, res.data.token);
    return res.data;
  };

  const logout = () => clear();

  const value = useMemo(
    () => ({ vendor, token, loading, isAuthenticated: Boolean(vendor && token), login, logout }),
    [vendor, token, loading]
  );

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>;
}

export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext);
  if (!ctx) throw new Error("useVendorAuth must be used within VendorAuthProvider");
  return ctx;
}
