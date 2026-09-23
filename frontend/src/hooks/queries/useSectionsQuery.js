import { useQuery } from "@tanstack/react-query";
import { getSections } from "../../api/api";
import { queryKeys } from "./queryKeys";

export function useSectionsQuery(paramsOrOptions = {}, maybeOptions = {}) {
  const isParams =
    paramsOrOptions &&
    !paramsOrOptions.queryKey &&
    !paramsOrOptions.staleTime &&
    !paramsOrOptions.enabled;
  const params = isParams ? paramsOrOptions : {};
  const options = isParams ? maybeOptions : paramsOrOptions;

  return useQuery({
    queryKey: queryKeys.sections.all,
    queryFn: async () => {
      const { data } = await getSections(params);
      const list = data?.data;
      if (!Array.isArray(list)) return [];
      return list
        .filter((sec) => sec.isActive !== false)
        .map((sec) => ({
          ...sec,
          sectionName: String(sec.sectionName || "").trim(),
          slug: String(sec.slug || "").trim().toLowerCase(),
        }))
        .filter((sec) => sec.sectionName && sec.slug)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    staleTime: 60 * 1000,
    ...options,
  });
}

export default useSectionsQuery;
