import apiClient from './client';

export const erpApi = {
  dashboard: () => apiClient.get('/erp/ceo/dashboard'),
  search: (q) => apiClient.get('/erp/search', { params: { q } }),
  modules: () => apiClient.get('/erp/modules'),
  farmers: (params) => apiClient.get('/erp/farmers', { params }),
  farmerManagers: () => apiClient.get('/erp/farmer-managers'),
  farmer: (id) => apiClient.get(`/erp/farmers/${encodeURIComponent(id)}`),
  assignFarmerManager: (farmerId, managerId) =>
    apiClient.put(`/erp/farmers/${encodeURIComponent(farmerId)}/manager`, { managerId }),
  deleteFarmer: (farmerId) =>
    apiClient.delete(`/erp/farmers/${encodeURIComponent(farmerId)}`),
  createFarmer: (body) =>
    apiClient.post('/erp/farmers', body),
  reviewFarmerDocument: (farmerId, documentId, body) =>
    apiClient.patch(
      `/erp/farmers/${encodeURIComponent(farmerId)}/documents/${encodeURIComponent(documentId)}/status`,
      body
    ),
  list: (resource, params) => apiClient.get(`/erp/${resource}`, { params }),
  get: (resource, id) => apiClient.get(`/erp/${resource}/${encodeURIComponent(id)}`),
  create: (resource, body) => apiClient.post(`/erp/${resource}`, body),
  update: (resource, id, body) => apiClient.patch(`/erp/${resource}/${encodeURIComponent(id)}`, body),
  remove: (resource, id) => apiClient.delete(`/erp/${resource}/${encodeURIComponent(id)}`),
  report: (resource, params) => apiClient.get(`/erp/reports/${resource}`, { params }),
  generateId: (body) => apiClient.post('/erp/ids/generate', body),
};

export default erpApi;
