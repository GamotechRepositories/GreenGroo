import apiClient from "../../../services/api";
import { SUPERMALL_CATEGORIES } from "../data/categories";

export const superMallService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=supermall");
      return res.data?.data || res.data || SUPERMALL_CATEGORIES;
    } catch {
      return SUPERMALL_CATEGORIES;
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

