import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { managerApi, setAuthToken } from "../api/managerApi";
import { connectSocket, disconnectSocket } from "../services/socket";

const STORAGE_KEY = "greenrow_delivery_manager_auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [manager, setManager] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((authManager, authToken) => {
    setManager(authManager);
    setToken(authToken);
    setAuthToken(authToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ manager: authManager, token: authToken })
    );
    if (authManager?.id) {
      connectSocket(authManager.id);
    }
  }, []);

  const clear = useCallback(() => {
    disconnectSocket();
    setManager(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const init = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }
      try {
        const { token: savedToken } = JSON.parse(raw);
        if (!savedToken) {
          clear();
          return;
        }
        setAuthToken(savedToken);
        setToken(savedToken);
        const res = await managerApi.me();
        persist(res.data.manager, savedToken);
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [clear, persist]);

  const login = async (payload) => {
    const res = await managerApi.login(payload);
    persist(res.data.manager, res.data.token);
    return res.data;
  };

  const register = async (payload) => {
    const res = await managerApi.register(payload);
    persist(res.data.manager, res.data.token);
    return res.data;
  };

  const logout = () => clear();

  const value = useMemo(
    () => ({ manager, token, loading, login, register, logout, isAuthenticated: !!token }),
    [manager, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
