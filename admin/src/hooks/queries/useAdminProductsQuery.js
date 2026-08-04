import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "../../api/api";
import { adminQueryKeys } from "./queryKeys";

export function useAdminProductsQuery(params, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.products.list(params),
    queryFn: async ({ queryKey }) => {
      const queryParams = queryKey[3];
      const { data } = await getAllProducts(queryParams);
      return {
        items: data.data || [],
        pagination: data.pagination || null,
        statusCounts: data.statusCounts || null,
      };
    },
    ...options,
  });
}
