import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "../../api/api";
import { adminQueryKeys } from "./queryKeys";

export function useAdminCategoriesQuery(params, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.categories.list(params),
    queryFn: async () => {
      const { data } = await getAllCategories(params);
      return {
        items: data.data || [],
        pagination: data.pagination || null,
      };
    },
    ...options,
  });
}

export function useAdminCategoryOptionsQuery(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.categories.options,
    queryFn: async () => {
      const { data } = await getAllCategories({ limit: 500 });
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
