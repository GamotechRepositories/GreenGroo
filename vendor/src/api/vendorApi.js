import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/+$/, "");
const VENDOR_STORAGE_KEY = "greengroo_vendor_auth";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export function setVendorToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function getStoredVendorToken() {
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token : null;
  } catch { return null; }
}

// Auto-restore token on import
const storedToken = getStoredVendorToken();
if (storedToken) setVendorToken(storedToken);

export const vendorApi = {
  // Auth
  login: (data) => api.post("/api/vendor/auth/login", data),
  me: () => api.get("/api/vendor/auth/me"),

  // Dashboard
  getDashboard: () => api.get("/api/vendor/dashboard"),

  // Managers
  getManagers: (params) => api.get("/api/vendor/managers", { params }),
  getManagerById: (id) => api.get(`/api/vendor/managers/${id}`),
  createManager: (data) => api.post("/api/vendor/managers", data),
  updateManager: (id, data) => api.put(`/api/vendor/managers/${id}`, data),
  deleteManager: (id) => api.delete(`/api/vendor/managers/${id}`),
  setManagerStatus: (id, status) => api.patch(`/api/vendor/managers/${id}/status`, { status }),

  // Farmers
  getFarmers: (params) => api.get("/api/vendor/farmers", { params }),
  getFarmerById: (id) => api.get(`/api/vendor/farmers/${id}`),
  createFarmer: (data) => api.post("/api/vendor/farmers", data),
  updateFarmer: (id, data) => api.put(`/api/vendor/farmers/${id}`, data),
  deleteFarmer: (id) => api.delete(`/api/vendor/farmers/${id}`),
  setFarmerStatus: (id, status) => api.patch(`/api/vendor/farmers/${id}/status`, { status }),
  assignFarmerManager: (farmerId, managerId) => api.put(`/api/vendor/farmers/${farmerId}/manager`, { managerId }),
};

export { VENDOR_STORAGE_KEY };
