import axios from "axios";
import { getApiBaseUrl } from "../config/env";
const VENDOR_STORAGE_KEY = "greengroo_vendor_auth";

export const api = axios.create({
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

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getStoredVendorToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

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
  getFarmerCrops: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/crops`),
  getFarmerCrop: (farmerId, cropId) => api.get(`/api/vendor/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`),
  createFarmerCrop: (farmerId, data) => api.post(`/api/vendor/farmers/${encodeURIComponent(farmerId)}/crops`, data),
  updateFarmerCrop: (farmerId, cropId, data) => api.put(`/api/vendor/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`, data),
  deleteFarmerCrop: (farmerId, cropId) => api.delete(`/api/vendor/farmers/${encodeURIComponent(farmerId)}/crops/${encodeURIComponent(cropId)}`),
  getFarmerProducts: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/products`),
  getFarmerInventory: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/inventory`),
  getFarmerOrders: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/orders`),
  getFarmerEarnings: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/earnings`),
  getFarmerDocuments: (id) => api.get(`/api/vendor/farmers/${encodeURIComponent(id)}/documents`),
  uploadFarmerDocument: (id, data) => api.post(`/api/vendor/farmers/${encodeURIComponent(id)}/documents`, data),
  createFarmer: (data) => api.post("/api/vendor/farmers", data),
  updateFarmer: (id, data) => api.put(`/api/vendor/farmers/${id}`, data),
  deleteFarmer: (id) => api.delete(`/api/vendor/farmers/${id}`),
  setFarmerStatus: (id, status) => api.patch(`/api/vendor/farmers/${id}/status`, { status }),
  assignFarmerManager: (farmerId, managerId) => api.put(`/api/vendor/farmers/${farmerId}/manager`, { managerId }),

  // Drivers
  getDrivers: (params) => api.get("/api/vendor/drivers", { params }),
  getDriverById: (id) => api.get(`/api/vendor/drivers/${id}`),
  createDriver: (data) => api.post("/api/vendor/drivers", data),
  updateDriver: (id, data) => api.put(`/api/vendor/drivers/${id}`, data),
  setDriverStatus: (id, status) => api.patch(`/api/vendor/drivers/${id}/status`, { status }),

  // Pickups
  getPickups: (params) => api.get("/api/vendor/pickups", { params }),
  getPickup: (id) => api.get(`/api/vendor/pickups/${id}`),
  assignPickupDriver: (id, driverId) => api.post(`/api/vendor/pickups/${id}/assign`, { driverId }),
  reassignPickupDriver: (id, driverId) => api.post(`/api/vendor/pickups/${id}/reassign`, { driverId }),
  startPickup: (id, driverId) => api.post(`/api/vendor/pickups/${id}/start`, { driverId }),
  arrivePickup: (id, driverId) => api.post(`/api/vendor/pickups/${id}/arrive`, { driverId }),
  receivePickup: (id, data) => api.post(`/api/vendor/pickups/${id}/receive`, data),
  getPickupReceipt: (id) => api.get(`/api/vendor/pickups/${id}/receipt`),
  getCollectionCentres: () => api.get("/api/vendor/collection-centres"),
  createCollectionCentre: (data) => api.post("/api/vendor/collection-centres", data),

  // Quality & Grading
  getQualityPending: (params) => api.get("/api/quality/pending", { params }),
  getQuality: (orderId) => api.get(`/api/quality/${orderId}`),
  startQuality: (orderId) => api.post(`/api/quality/${orderId}/start`),
  uploadQualityPhotos: (orderId, data) => api.post(`/api/quality/${orderId}/photos`, data),
  saveQualityParameters: (orderId, data) => api.patch(`/api/quality/${orderId}/parameters`, data),
  saveQualityGrading: (orderId, data) => api.patch(`/api/quality/${orderId}/grading`, data),
  confirmQuality: (orderId) => api.post(`/api/quality/${orderId}/confirm`),
  getQualitySummary: (orderId) => api.get(`/api/quality/${orderId}/final-summary`),
  verifyQualityQr: (data) => api.post("/api/quality/verify-qr", data),
};

export { VENDOR_STORAGE_KEY };
