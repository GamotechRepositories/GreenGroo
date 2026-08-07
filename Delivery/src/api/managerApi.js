import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(
  /\/+$/,
  ""
);

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

const BASE = "/api/delivery-managers";

export const managerApi = {
  register: (data) => api.post(`${BASE}/register`, data),
  login: (data) => api.post(`${BASE}/login`, data),
  me: () => api.get(`${BASE}/me`),
  dashboard: () => api.get(`${BASE}/dashboard`),
  orders: (params) => api.get(`${BASE}/orders`, { params }),
  inventory: () => api.get(`${BASE}/inventory`),
  riders: () => api.get(`${BASE}/riders`),
  pendingRiders: () => api.get(`${BASE}/riders/pending`),
  verifyRider: (riderId, body) =>
    api.post(`${BASE}/riders/${riderId}/verify`, body),
  informCustomer: (orderId, itemId) =>
    api.post(`${BASE}/orders/${orderId}/inform-customer`, { itemId }),
  assignOrder: (orderId, riderId) =>
    api.post(`${BASE}/orders/${orderId}/assign`, { riderId }),
  markDelivered: (orderId) =>
    api.patch(`${BASE}/orders/${orderId}/delivered`),
};
