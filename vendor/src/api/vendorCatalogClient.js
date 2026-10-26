import { api } from './vendorApi';
import { getApiBaseUrl } from '../config/env';

/**
 * Drop-in for the admin panel's apiClient / categoryApi / sectionApi / baseProductApi, used by the
 * vendor copy of the admin Products page. Reads are scoped to the vendor; every product or category
 * write becomes an approval request for admin. Sections are fixed and cannot be changed by vendors.
 */

export const API_ORIGIN = getApiBaseUrl();

const SECTIONS_LOCKED = 'Sections (Pre-order, Instant order, Ready2Cook) are managed by admin only';
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

const sendRequest = (kind, action, targetId, payload) =>
  api.post('/api/vendor/catalog/requests', { kind, action, targetId, payload });

const lockedSections = () => Promise.reject(Object.assign(new Error(SECTIONS_LOCKED), { response: { data: { message: SECTIONS_LOCKED } } }));

function route(method, url, data, config) {
  const path = String(url || '').split('?')[0];
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  const categoryMatch = path.match(/^\/categories\/([^/]+)$/);

  if (method === 'get') {
    if (path === '/products/all' || path === '/products') return api.get('/api/vendor/catalog/products', config);
    if (path === '/categories/all' || path === '/categories') return api.get('/api/vendor/catalog/categories', config);
    return api.get(`/api${url}`, config);
  }

  if (path === '/upload' || path === '/upload/image') return api.post(`/api${path}`, data, { ...multipart, ...config });
  if (path.startsWith('/sections')) return lockedSections();

  if (path === '/products' && method === 'post') return sendRequest('product', 'create', '', data);
  if (productMatch && method === 'put') return sendRequest('product', 'update', productMatch[1], data);
  if (productMatch && method === 'delete') return sendRequest('product', 'delete', productMatch[1], {});
  if (path === '/categories' && method === 'post') return sendRequest('category', 'create', '', data);
  if (categoryMatch && method === 'put') return sendRequest('category', 'update', categoryMatch[1], data);
  if (categoryMatch && method === 'delete') return sendRequest('category', 'delete', categoryMatch[1], {});

  const message = 'This action is not available in the vendor panel';
  return Promise.reject(Object.assign(new Error(message), { response: { data: { message } } }));
}

const apiClient = {
  get: (url, config) => route('get', url, undefined, config),
  post: (url, data, config) => route('post', url, data, config),
  put: (url, data, config) => route('put', url, data, config),
  patch: (url, data, config) => route('put', url, data, config),
  delete: (url, config) => route('delete', url, undefined, config),
};

export default apiClient;

export const categoryApi = {
  getAllCategories: async (params = {}) => (await apiClient.get('/categories/all', { params })).data,
  getActiveCategories: async (params = {}) => (await apiClient.get('/categories', { params })).data,
  createCategory: async (data) => (await apiClient.post('/categories', data)).data,
  updateCategory: async (id, data) => (await apiClient.put(`/categories/${id}`, data)).data,
  deleteCategory: async (id) => (await apiClient.delete(`/categories/${id}`)).data,
};

export const sectionApi = {
  getAllSections: async (params = {}) => (await api.get('/api/sections/all', { params })).data,
  getActiveSections: async (params = {}) => (await api.get('/api/sections', { params })).data,
  createSection: lockedSections,
  updateSection: lockedSections,
  deleteSection: lockedSections,
};

export const baseProductApi = {
  list: async (params = {}) => (await api.get('/api/base-products', { params })).data,
};

export const catalogRequestsApi = {
  list: async (params = {}) => (await api.get('/api/vendor/catalog/requests', { params })).data,
  cancel: async (id) => (await api.post(`/api/vendor/catalog/requests/${encodeURIComponent(id)}/cancel`)).data,
};
