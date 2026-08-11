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

export const staffApi = {
  login: (data) => api.post("/api/staff/login", data),
  me: () => api.get("/api/staff/me"),
  list: (params) => api.get("/api/staff", { params }),
  create: (data) => api.post("/api/staff", data),
  hierarchy: () => api.get("/api/staff/hierarchy"),
};
