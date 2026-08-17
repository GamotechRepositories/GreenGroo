import apiClient from "../../../services/api";
import { READY2COOK_CATEGORIES } from "../data/categories";
import { READY2COOK_PRODUCTS } from "../data/products";

export const ready2CookService = {
  async getCategories() {
    try {
      const res = await apiClient.get("/categories?section=ready2cook");
      return res.data?.data || READY2COOK_CATEGORIES;
    } catch {
      return READY2COOK_CATEGORIES;
    }
  },

  async getProducts() {
    try {
      const res = await apiClient.get("/products?section=ready2cook");
      return res.data?.data || READY2COOK_PRODUCTS;
    } catch {
      return READY2COOK_PRODUCTS;
    }
  },
};
