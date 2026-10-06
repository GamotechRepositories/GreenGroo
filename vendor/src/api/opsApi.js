import { api } from "./vendorApi";

const BASE = "/api/vendor/hr-ops";
const unwrap = (response) => response.data;

/** Vendor HR API — same shape as admin opsApi, scoped to this vendor's team on the server. */
export const opsApi = {
  get: (path) => api.get(`${BASE}/${path}`).then(unwrap),
  list: (path, params = {}) => api.get(`${BASE}/${path}`, { params }).then(unwrap),
  create: (path, body) => api.post(`${BASE}/${path}`, body).then(unwrap),
  update: (path, id, body) => api.put(`${BASE}/${path}/${id}`, body).then(unwrap),
  patch: (path, body) => api.patch(`${BASE}/${path}`, body).then(unwrap),
  remove: (path, id) => api.delete(`${BASE}/${path}/${id}`).then(unwrap),
};

export default opsApi;
