import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../../api/api";
import { queryKeys } from "./queryKeys";

export function useCategoriesQuery(paramsOrOptions = {}, maybeOptions = {}) {
  // If first argument is plain params like { section: 'greengrocc' }
  const isParams = paramsOrOptions && !paramsOrOptions.queryKey && !paramsOrOptions.staleTime && !paramsOrOptions.enabled;
  const params = isParams ? paramsOrOptions : {};
  const options = isParams ? maybeOptions : paramsOrOptions;

  const sectionKey = params.section || params.storeType || "all";

  return useQuery({
    queryKey: [...queryKeys.categories.all, sectionKey],
    queryFn: async () => {
      try {
        const res = await getCategories(params);
        const list = res.data?.data || res.data;
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.warn("Failed to fetch categories:", err.message);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export default useCategoriesQuery;
