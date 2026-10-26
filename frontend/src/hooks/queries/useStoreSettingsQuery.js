import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "../../api/api";
import { queryKeys } from "./queryKeys";

/** Admin store settings (minimum order, delivery slabs, pre-order slots). */
export function useStoreSettingsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.storeSettings,
    queryFn: async () => {
      const { data } = await getStoreSettings();
      return data?.data || null;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export default useStoreSettingsQuery;
