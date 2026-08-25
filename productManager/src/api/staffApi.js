import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(
  /\/+$/,
  ""
);

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const AUTH_STORAGE_KEY = "greengroo_product_manager_auth";

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = raw ? JSON.parse(raw).token : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export const staffApi = {
  login: (data) => api.post("/api/staff/login", data),
  me: () => api.get("/api/staff/me"),
  inventoryRequests: (params) =>
    api.get("/api/staff/inventory-requests", { params }),
  reviewInventoryRequest: (requestId, data) =>
    api.patch(`/api/staff/inventory-requests/${requestId}`, data),
};
