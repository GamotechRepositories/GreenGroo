import apiClient from "../../../services/api";

export const superMallService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=supermall");
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async getProducts() {
    try {
      const res = await apiClient.get("/products?section=supermall");
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
};
