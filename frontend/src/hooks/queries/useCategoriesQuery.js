import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getCategories } from "../../api/api";
import { queryKeys } from "./queryKeys";
import { useDeliveryLocationKey } from "../../context/LocationContext";

export function useCategoriesQuery(paramsOrOptions = {}, maybeOptions = {}) {
  // If first argument is plain params like { section: 'greengrocc' }
  const isParams = paramsOrOptions && !paramsOrOptions.queryKey && !paramsOrOptions.staleTime && !paramsOrOptions.enabled;
  const params = isParams ? paramsOrOptions : {};
  const options = isParams ? maybeOptions : paramsOrOptions;
  const locationKey = useDeliveryLocationKey();

  const sectionKey = params.section || params.storeType || "all";

  return useQuery({
    queryKey: [...queryKeys.categories.all, sectionKey, locationKey],
    queryFn: async () => {
      const res = await getCategories(params);
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    },
    placeholderData: keepPreviousData,
    ...options,
  });
}

export default useCategoriesQuery;
