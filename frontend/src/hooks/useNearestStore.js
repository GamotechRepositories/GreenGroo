import { useQuery } from "@tanstack/react-query";
import { getNearestStore } from "../api/api";
import { useLocation } from "../context/LocationContext";

export function useNearestStore() {
  const { locationKey } = useLocation();

  return useQuery({
    queryKey: ["nearest-store", locationKey],
    queryFn: async () => {
      const { data } = await getNearestStore();
      return data;
    },
    staleTime: 60 * 1000,
  });
}
