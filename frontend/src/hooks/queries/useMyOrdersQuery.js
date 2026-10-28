import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { getLifetimeOrderSpend } from "../../utils/orderUtils";
import { queryKeys } from "./queryKeys";

export function useMyOrdersQuery(options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.orders.mine(user?._id),
    queryFn: async () => {
      const { data } = await getMyOrders();
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: Boolean(user),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useLifetimeOrderSpend() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useMyOrdersQuery();
  const spent = useMemo(() => getLifetimeOrderSpend(orders), [orders]);
  return {
    spent,
    ready: Boolean(user) && !isLoading,
    loggedIn: Boolean(user),
  };
}

export default useMyOrdersQuery;
