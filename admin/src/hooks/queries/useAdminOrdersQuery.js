import { useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "../../api/api";
import { adminQueryKeys } from "./queryKeys";

export function useAdminOrdersQuery(params, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.orders.list(params),
    queryFn: async ({ queryKey }) => {
      const queryParams = queryKey[3];
      const { data } = await getAdminOrders(queryParams);
      return {
        items: data.data || [],
        pagination: data.pagination || null,
        statusCounts: data.statusCounts || null,
        amountTotal: data.amountTotal ?? 0,
      };
    },
    ...options,
  });
}
