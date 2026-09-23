import { useQuery } from "@tanstack/react-query";
import { getSections } from "../../api/api";
import { queryKeys } from "./queryKeys";

/** Offline / error fallback — mirrors seeded admin defaults */
export const DEFAULT_FALLBACK_SECTIONS = [
  {
    sectionName: "PreOrder",
    slug: "preorder",
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
    color: "#EAB308",
    order: 2,
    isActive: true,
  },
  {
    sectionName: "InstantOrder",
    slug: "instantorder",
    storeType: "mall",
    description: "Top brand groceries, dry fruits, snacks & packaged foods",
    emoji: "⚡",
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
        const list = data?.data;
        if (Array.isArray(list) && list.length > 0) {
          return list
            .filter((sec) => sec.isActive !== false)
            .map((sec) => ({
              ...sec,
              sectionName: String(sec.sectionName || "").trim(),
              slug: String(sec.slug || "").trim().toLowerCase(),
            }))
            .filter((sec) => sec.sectionName && sec.slug)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        console.warn("[sections] Empty API payload — using fallback names");
        return DEFAULT_FALLBACK_SECTIONS;
      } catch (err) {
        console.warn("[sections] Fetch failed — using fallback names:", err.message);
        return DEFAULT_FALLBACK_SECTIONS;
      }
    },
    staleTime: 60 * 1000,
    placeholderData: DEFAULT_FALLBACK_SECTIONS,
    ...options,
  });
}

export default useSectionsQuery;
