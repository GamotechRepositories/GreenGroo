import apiClient from './client';

export const sectionApi = {
  // Get all sections (with search, pagination, status filter)
  getAllSections: async (params = {}) => {
    const response = await apiClient.get('/sections/all', { params });
    return response.data;
  },

  // Get active sections list
  getActiveSections: async (params = {}) => {
    const response = await apiClient.get('/sections', { params });
    return response.data;
  },

  // Get single section by ID or slug
  getSectionById: async (id) => {
    const response = await apiClient.get(`/sections/${id}`);
    return response.data;
  },

  // Create a new section
  createSection: async (sectionData) => {
    const response = await apiClient.post('/sections', sectionData);
    return response.data;
  },

  // Update existing section
  updateSection: async (id, sectionData) => {
    const response = await apiClient.put(`/sections/${id}`, sectionData);
    return response.data;
  },

  // Delete section
  deleteSection: async (id) => {
    const response = await apiClient.delete(`/sections/${id}`);
    return response.data;
  },

  // Seed default sections
  seedDefaultSections: async () => {
    const response = await apiClient.post('/sections/seed');
    return response.data;
  },
};

export default sectionApi;
