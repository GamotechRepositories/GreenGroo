import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { loginWithPhone, signupUser, updateMe } from "../api/api";
import { STORAGE_KEY } from "../utils/authStorage";

const AuthContext = createContext(null);

async function fetchMeWithToken(token) {
  const res = await api.get("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
}

function assertCustomerUser(authUser) {
  if (authUser?.role === "admin") {
    throw new Error("Please use the admin panel to sign in.");
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistCustomerAuth = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: authUser, token: authToken })
    );
  };

  const clearCustomerAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const openAuthModal = useCallback(
    (mode = "login") => {
      navigate(mode === "signup" ? "/signup" : "/login");
    },
    [navigate]
  );

  const closeAuthModal = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const setAuthModal = useCallback(
    (mode) => {
      if (!mode) {
        navigate("/");
        return;
      }
      navigate(mode === "signup" ? "/signup" : "/login");
    },
    [navigate]
  );

  useEffect(() => {
    const initAuth = async () => {
      const customerRaw = localStorage.getItem(STORAGE_KEY);

      if (!customerRaw) {
        setLoading(false);
        return;
      }

      try {
        const { token: savedToken } = JSON.parse(customerRaw);
        if (!savedToken) {
          clearCustomerAuth();
          return;
        }

        setToken(savedToken);
        const authUser = await fetchMeWithToken(savedToken);

        if (authUser.role === "admin") {
          clearCustomerAuth();
          return;
        }

        persistCustomerAuth(authUser, savedToken);
      } catch {
        clearCustomerAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const persistAuthSession = (authUser, authToken) => {
    assertCustomerUser(authUser);
    persistCustomerAuth(authUser, authToken);
  };

  const login = async ({ phone, password }) => {
    const res = await loginWithPhone({ phone, password });
    const { user: authUser, token: authToken } = res.data.data;
    persistAuthSession(authUser, authToken);
    return res.data;
  };

  const signup = async (payload) => {
    const res = await signupUser(payload);
    const { user: authUser, token: authToken } = res.data.data;
    persistAuthSession(authUser, authToken);
    return res.data;
  };

  const logout = () => {
    clearCustomerAuth();
  };

  const updateProfile = async (data) => {
    const res = await updateMe(data);
    const authUser = res.data.data;
    persistCustomerAuth(authUser, token);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        authModal: null,
        openAuthModal,
        closeAuthModal,
        setAuthModal,
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
