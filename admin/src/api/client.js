import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('greengrocc_admin_token');
  if (token && token !== 'demo_admin_jwt_token' && token !== 'mock_jwt_token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary — default application/json breaks FormData
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const onLogin = window.location.pathname.includes('/login');
      localStorage.removeItem('greengrocc_admin_token');
      localStorage.removeItem('greengrocc_admin_user');
      if (!onLogin) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
