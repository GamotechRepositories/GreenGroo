import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../../api/api";
import { queryKeys } from "./queryKeys";

export function useCategoriesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const { data } = await getCategories();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
