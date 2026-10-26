import apiClient from './client';

export const baseProductApi = {
  list: async (params = {}) => {
    const response = await apiClient.get('/base-products', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/base-products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/base-products/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/base-products/${id}`);
    return response.data;
  },

  uploadImage: async (file) => {
    const form = new FormData();
    form.append('files', file);
    form.append('folder', 'products');
    const response = await apiClient.post('/upload', form);
    const data = response.data;
    const url = Array.isArray(data.urls) ? data.urls[0] : data.url;
    if (!data.success || !url) throw new Error(data.message || 'Image upload failed');
    return url;
  },
};

export default baseProductApi;
