import { createContext, useContext, useEffect, useState } from "react";
import api, { loginUser, updateCurrentUser } from "../api/api";
import { ADMIN_STORAGE_KEY } from "../utils/authStorage";

const AuthContext = createContext(null);

async function fetchMeWithToken(token) {
  const res = await api.get("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
}

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistAdminAuth = (authUser, authToken) => {
    setAdminUser(authUser);
    setAdminToken(authToken);
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ user: authUser, token: authToken })
    );
  };

  const clearAdminAuth = () => {
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  useEffect(() => {
    const initAuth = async () => {
      const adminRaw = localStorage.getItem(ADMIN_STORAGE_KEY);

      if (!adminRaw) {
        setLoading(false);
        return;
      }

      try {
        const { token: savedToken } = JSON.parse(adminRaw);
        if (!savedToken) {
          clearAdminAuth();
          return;
        }

        setAdminToken(savedToken);
        const authUser = await fetchMeWithToken(savedToken);

        if (authUser.role !== "admin") {
          clearAdminAuth();
          return;
        }

        persistAdminAuth(authUser, savedToken);
      } catch {
        clearAdminAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const adminLogin = async (data) => {
    const res = await loginUser(data);
    const { user: authUser, token: authToken } = res.data.data;

    if (authUser.role !== "admin") {
      throw new Error("Access denied. Admin credentials required.");
    }

    persistAdminAuth(authUser, authToken);
    return res.data;
  };

  const adminLogout = () => {
    clearAdminAuth();
  };

  const updateAdminProfile = async (data) => {
    const res = await updateCurrentUser(data);
    const authUser = res.data.data;

    if (!adminToken || authUser.role !== "admin") {
      throw new Error("Unable to update admin profile.");
    }

    persistAdminAuth(authUser, adminToken);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        adminToken,
        loading,
        adminLogin,
        adminLogout,
        updateAdminProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
