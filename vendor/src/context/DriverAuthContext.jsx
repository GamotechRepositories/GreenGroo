import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { driverApi, DRIVER_STORAGE_KEY } from "../api/driverApi";

const DriverAuthContext = createContext(null);

export function DriverAuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persist = (nextDriver, nextToken) => {
    setDriver(nextDriver);
    setToken(nextToken);
    localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify({ driver: nextDriver, token: nextToken }));
  };

  const clear = () => {
    setDriver(null);
    setToken(null);
    localStorage.removeItem(DRIVER_STORAGE_KEY);
  };

  useEffect(() => {
    const init = async () => {
      const raw = localStorage.getItem(DRIVER_STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }
      try {
        const saved = JSON.parse(raw);
        if (!saved?.token) {
          clear();
          return;
        }
        const res = await driverApi.me();
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
    const res = await driverApi.login(credentials);
    persist(res.data.driver, res.data.token);
    return res.data;
  };

  const value = useMemo(
    () => ({ driver, token, loading, isAuthenticated: Boolean(driver && token), login, logout: clear }),
    [driver, token, loading]
  );

  return <DriverAuthContext.Provider value={value}>{children}</DriverAuthContext.Provider>;
}

export function useDriverAuth() {
  const ctx = useContext(DriverAuthContext);
  if (!ctx) throw new Error("useDriverAuth must be used within DriverAuthProvider");
  return ctx;
}
