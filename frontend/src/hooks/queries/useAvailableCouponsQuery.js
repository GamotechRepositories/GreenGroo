import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAvailableCoupons } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { queryKeys } from "./queryKeys";

/** Coupons with unlock status for the given cart subtotal. */
export function useAvailableCouponsQuery(subtotal, options = {}) {
  const { user } = useAuth();
  const amount = Math.round((Number(subtotal) || 0) * 100) / 100;

  return useQuery({
    queryKey: queryKeys.availableCoupons(amount, user?._id),
    queryFn: async () => {
      const { data } = await getAvailableCoupons({ subtotal: amount });
      return Array.isArray(data?.data) ? data.data : [];
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    ...options,
  });
}

export default useAvailableCouponsQuery;
