import apiClient from "../../../services/api";
import { GREENGROCC_CATEGORIES } from "../data/categories";
import { GREENGROCC_PRODUCTS } from "../data/products";

export const greenGroccService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories");
      return res.data?.data || GREENGROCC_CATEGORIES;
    } catch {
      return GREENGROCC_CATEGORIES;
    }
  },

  async getProducts(params = {}) {
    try {
      const res = await apiClient.get("/products", { params });
      return res.data?.data || GREENGROCC_PRODUCTS;
    } catch {
      return GREENGROCC_PRODUCTS;
    }
  },

  async getProductById(id) {
    try {
      const res = await apiClient.get(`/products/${id}`);
      return res.data?.data || GREENGROCC_PRODUCTS.find((p) => p._id === id);
    } catch {
      return GREENGROCC_PRODUCTS.find((p) => p._id === id);
    }
  },
};
