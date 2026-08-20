import apiClient from "../../../services/api";
import { GREENGROCC_CATEGORIES } from "../data/categories";

export const greenGroccService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=greengrocc");
      return res.data?.data || res.data || GREENGROCC_CATEGORIES;
    } catch {
      return GREENGROCC_CATEGORIES;
    }
  },

  async getProducts(params = {}) {
    try {
      const res = await apiClient.get("/products", { params: { section: "greengrocc", ...params } });
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async getProductById(id) {
    try {
      const res = await apiClient.get(`/products/${id}`);
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },
};

