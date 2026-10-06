import { api } from "./vendorApi";

const BASE = "/api/vendor/promotions";
const unwrap = (response) => response.data;

/** Same shape as admin couponApi, scoped to this vendor's own coupons on the server. */
export const couponApi = {
  getAllCoupons: (params = {}) => api.get(`${BASE}/coupons`, { params }).then(unwrap),
  createCoupon: (data) => api.post(`${BASE}/coupons`, data).then(unwrap),
  updateCoupon: (id, data) => api.put(`${BASE}/coupons/${id}`, data).then(unwrap),
  deleteCoupon: (id) => api.delete(`${BASE}/coupons/${id}`).then(unwrap),
  seedDefaultCoupons: () => api.post(`${BASE}/coupons/seed`).then(unwrap),
};

/** Same shape as admin rewardApi, scoped to this vendor's reward program. */
export const rewardApi = {
  getAdminSettings: () => api.get(`${BASE}/rewards/settings`).then(unwrap),
  updateAdminSettings: (data) => api.put(`${BASE}/rewards/settings`, data).then(unwrap),
  getAdminStats: () => api.get(`${BASE}/rewards/stats`).then(unwrap),
  getAdminTransactions: (params = {}) => api.get(`${BASE}/rewards/transactions`, { params }).then(unwrap),
};

/** Same shape as admin opsApi for gift cards, pricing rules, and return requests. */
export const promoOpsApi = {
  list: (path, params = {}) => api.get(`${BASE}/${path}`, { params }).then(unwrap),
  create: (path, body) => api.post(`${BASE}/${path}`, body).then(unwrap),
  update: (path, id, body) => api.put(`${BASE}/${path}/${id}`, body).then(unwrap),
  remove: (path, id) => api.delete(`${BASE}/${path}/${id}`).then(unwrap),
};
