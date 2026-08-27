import { useQuery } from "@tanstack/react-query";
import { getSections } from "../../api/api";
import { queryKeys } from "./queryKeys";

export const DEFAULT_FALLBACK_SECTIONS = [
  {
    sectionName: "GreenGrocc",
    slug: "greengrocc",
    storeType: "main",
    description: "Fresh Farm Produce, Fruits, Daily Veggies & Essentials",
    emoji: "🥦",
    badge: "10 Mins Delivery",
    color: "#10B981",
    order: 1,
    isActive: true,
  },
  {
    sectionName: "Ready2Cook",
    slug: "ready2cook",
    storeType: "festive",
    description: "Pre-cut, peeled & sliced vegetables & meal kits for 10-min cooking",
    emoji: "🍳",
    badge: "Fast Cooking",
    color: "#EA580C",
    order: 2,
    isActive: true,
  },
  {
    sectionName: "SuperMall",
    slug: "supermall",
    storeType: "mall",
    description: "Top brand groceries, dry fruits, snacks & packaged foods",
    emoji: "🏬",
    badge: "Mega Deals",
    color: "#2563EB",
    order: 3,
    isActive: true,
  },
];

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
      try {
        const { data } = await getSections(params);
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data;
        }
        return DEFAULT_FALLBACK_SECTIONS;
      } catch (err) {
        console.warn("Failed to fetch sections, using fallback:", err.message);
        return DEFAULT_FALLBACK_SECTIONS;
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_FALLBACK_SECTIONS,
    ...options,
  });
}

export default useSectionsQuery;
