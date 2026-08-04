import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "../../api/api";
import { adminQueryKeys } from "./queryKeys";

export function useAdminBrandsQuery(params, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.brands.list(params),
    queryFn: async () => {
      const { data } = await getAllBrands(params);
      return {
        items: data.data || [],
        pagination: data.pagination || null,
      };
    },
    ...options,
  });
}

export function useAdminBrandOptionsQuery(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.brands.options,
    queryFn: async () => {
      const { data } = await getAllBrands({ limit: 500 });
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
