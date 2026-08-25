import axios from "axios";
import { getApiBaseUrl } from "../config/env";
export const DRIVER_STORAGE_KEY = "greengroo_driver_auth";

export const driverHttp = axios.create({
  headers: { "Content-Type": "application/json" },
});

function getStoredDriverToken() {
  try {
    const raw = localStorage.getItem(DRIVER_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

driverHttp.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getStoredDriverToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

export const driverApi = {
  login: (data) => driverHttp.post("/api/vendor/auth/driver/login", data),
  me: () => driverHttp.get("/api/vendor/auth/driver/me"),
  getPickups: (params) => driverHttp.get("/api/vendor/driver-desk/pickups", { params }),
  getPickup: (id) => driverHttp.get(`/api/vendor/driver-desk/pickups/${id}`),
  start: (id) => driverHttp.post(`/api/vendor/driver-desk/pickups/${id}/start`),
  arrive: (id) => driverHttp.post(`/api/vendor/driver-desk/pickups/${id}/arrive`),
  checkOrder: (id) => driverHttp.post(`/api/vendor/driver-desk/pickups/${id}/check-order`),
  verifyQr: (id, payload) => driverHttp.post(`/api/vendor/driver-desk/pickups/${id}/verify-qr`, payload),
  confirm: (id, payload = {}) => driverHttp.post(`/api/vendor/driver-desk/pickups/${id}/confirm`, payload),
};
