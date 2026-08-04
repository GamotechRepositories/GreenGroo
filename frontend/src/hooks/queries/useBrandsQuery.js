import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../api/api";
import { queryKeys } from "./queryKeys";

export function useBrandsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: async () => {
      const { data } = await getBrands();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
