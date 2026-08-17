import apiClient from "../../../services/api";
import { SUPERMALL_CATEGORIES } from "../data/categories";
import { SUPERMALL_PRODUCTS } from "../data/products";

export const superMallService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=supermall");
      return res.data?.data || SUPERMALL_CATEGORIES;
    } catch {
      return SUPERMALL_CATEGORIES;
    }
  },

  async getProducts() {
    try {
      const res = await apiClient.get("/products?section=supermall");
      return res.data?.data || SUPERMALL_PRODUCTS;
    } catch {
      return SUPERMALL_PRODUCTS;
    }
  },
};
