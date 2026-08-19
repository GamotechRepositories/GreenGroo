import apiClient from './client';

export const categoryApi = {
  // Get all categories (with search, pagination, status filter)
  getAllCategories: async (params = {}) => {
    const response = await apiClient.get('/categories/all', { params });
    return response.data;
  },

  // Get active categories list
  getActiveCategories: async (params = {}) => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  // Get single category by ID
  getCategoryById: async (id) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // Create a new category
  createCategory: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  // Update existing category
  updateCategory: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  // Seed default categories
  seedDefaultCategories: async () => {
    const response = await apiClient.post('/categories/seed');
    return response.data;
  },
};

export default categoryApi;
