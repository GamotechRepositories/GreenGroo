import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, {
  completeOtpSignup,
  sendOtpLogin,
  updateMe,
  verifyOtpLogin,
} from "../api/api";
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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null);

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

  const openAuthModal = useCallback((mode = "login") => {
    setAuthModal(mode);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal(null);
  }, []);

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

  const sendOtp = async (phone, { purpose = "login" } = {}) => {
    const res = await sendOtpLogin({ phone, purpose });
    return res.data;
  };

  const persistAuthSession = (authUser, authToken) => {
    assertCustomerUser(authUser);
    persistCustomerAuth(authUser, authToken);
    closeAuthModal();
  };

  const completeOtpSignupProfile = async ({
    phone,
    name,
    shopName,
    shopAddress,
    gstNumber,
  }) => {
    const res = await completeOtpSignup({
      phone,
      name,
      shopName: shopName?.trim() || "",
      shopAddress: shopAddress?.trim() || "",
      ...(gstNumber?.trim() ? { gstNumber: gstNumber.trim() } : {}),
    });
    const { user: authUser, token: authToken } = res.data.data;
    persistAuthSession(authUser, authToken);
    return res.data;
  };

  const loginWithOtp = async ({
    phone,
    otp,
    name,
    shopName,
    shopAddress,
    gstNumber,
  }) => {
    const res = await verifyOtpLogin({ phone, otp });
    const payload = res.data.data;

    if (payload?.needsSignup) {
      if (name?.trim() && shopName?.trim() && shopAddress?.trim()) {
        return completeOtpSignupProfile({
          phone,
          name,
          shopName,
          shopAddress,
          gstNumber,
        });
      }

      return { needsSignup: true, phone: payload.phone };
    }

    const { user: authUser, token: authToken } = payload;
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
        sendOtp,
        loginWithOtp,
        completeOtpSignupProfile,
        logout,
        updateProfile,
        authModal,
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
