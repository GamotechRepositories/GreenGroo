import apiClient from "../../../services/api";
import { READY2COOK_CATEGORIES } from "../data/categories";

export const ready2CookService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=ready2cook");
      return res.data?.data || res.data || READY2COOK_CATEGORIES;
    } catch {
      return READY2COOK_CATEGORIES;
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

