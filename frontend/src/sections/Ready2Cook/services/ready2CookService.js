import apiClient from "../../../services/api";

export const ready2CookService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=ready2cook");
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async getProducts() {
    try {
      const res = await apiClient.get("/products?section=ready2cook");
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
};
