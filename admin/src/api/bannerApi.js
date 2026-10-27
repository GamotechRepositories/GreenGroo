import apiClient from './client';

export const bannerApi = {
  list: async (params = {}) => {
    const response = await apiClient.get('/banners/all', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/banners', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/banners/${id}`, data);
    return response.data;
  },

  reorder: async (ids) => {
    const response = await apiClient.put('/banners/reorder', { ids });
    return response.data;
  },

  importDefaults: async () => {
    const response = await apiClient.post('/banners/import-defaults', {}, { timeout: 180000 });
    return response.data;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/banners/${id}`);
    return response.data;
  },

  uploadImage: async (file) => {
    const form = new FormData();
    form.append('files', file);
    form.append('folder', 'banners');
    const response = await apiClient.post('/upload', form);
    const data = response.data;
    const url = Array.isArray(data.urls) ? data.urls[0] : data.url;
    if (!data.success || !url) throw new Error(data.message || 'Image upload failed');
    return url;
  },
};

export default bannerApi;
