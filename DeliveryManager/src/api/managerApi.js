import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://api.greengrocc.com"
).replace(/\/+$/, "");

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
  listInventoryRequests: (params) =>
    api.get(`${BASE}/inventory-requests`, { params }),
  requestInventory: (data) => api.post(`${BASE}/inventory-requests`, data),
  riders: () => api.get(`${BASE}/riders`),
  getDriverDetails: (driverId) => api.get(`${BASE}/drivers/${driverId}`),
  toggleRiderActive: (driverId) => api.post(`${BASE}/drivers/${driverId}/toggle-active`),
  createRider: (data) => api.post(`${BASE}/riders`, data),
  pendingRiders: () => api.get(`${BASE}/riders/pending`),
  verifyRider: (riderId, body) =>
    api.post(`${BASE}/riders/${riderId}/verify`, body),
  informCustomer: (orderId, itemId) =>
    api.post(`${BASE}/orders/${orderId}/inform-customer`, { itemId }),
  packOrder: (orderId) => api.post(`${BASE}/orders/${orderId}/pack`),
  createDemoOrder: (body) => api.post(`${BASE}/orders/demo`, body || {}),
  assignOrder: (orderId, riderId) =>
    api.post(`${BASE}/orders/${orderId}/assign`, { riderId }),
  markDelivered: (orderId) =>
    api.patch(`${BASE}/orders/${orderId}/delivered`),

  // Shift & Slot Management APIs
  createShift: (data) => api.post(`${BASE}/shifts`, data),
  getShifts: () => api.get(`${BASE}/shifts`),
  getManagerSlots: (date) => api.get(`${BASE}/shifts/slots`, { params: { date } }),
  updateSlotDateWise: (slotId, data) => api.put(`${BASE}/shifts/slots/${slotId}`, data),
  deleteSlotDateWise: (slotId) => api.delete(`${BASE}/shifts/slots/${slotId}`),
  getSlotDetailsWithRiders: (slotId) => api.get(`${BASE}/shifts/slots/${slotId}/details`),

  // Gig & Incentive Management APIs
  createGig: (data) => api.post(`${BASE}/gigs`, data),
  getGigs: (date) => api.get(`${BASE}/gigs`, { params: { date } }),
  updateGig: (gigId, data) => api.put(`${BASE}/gigs/${gigId}`, data),
  deleteGig: (gigId) => api.delete(`${BASE}/gigs/${gigId}`),

  // Alerts & Incentives APIs
  getAlerts: (params) => api.get(`/api/alerts`, { params }),
  markAlertRead: (alertId) => api.patch(`/api/alerts/${alertId}/read`),
  getStoreIncentives: (params) => api.get(`/api/incentives/store-summary`, { params }),
  getRiderIncentives: (riderId, params) => api.get(`/api/incentives/rider`, { params: { riderId, ...params } }),
};
