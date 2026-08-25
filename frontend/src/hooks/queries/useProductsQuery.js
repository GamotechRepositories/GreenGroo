import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getProducts } from "../../api/api";
import { getRecentlyViewedIds } from "../../utils/recentlyViewed";
import { queryKeys } from "./queryKeys";
import { useDeliveryLocationKey } from "../../context/LocationContext";

const HOME_PRODUCT_LIMIT = 12;
export const PRODUCTS_PAGE_SIZE = 50;

export function useInfiniteProductsQuery(params, options = {}) {
  const locationKey = useDeliveryLocationKey();

  return useInfiniteQuery({
    queryKey: queryKeys.products.infiniteList({ ...params, locationKey }),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await getProducts({
        ...params,
        page: pageParam,
        limit: PRODUCTS_PAGE_SIZE,
      });

      return {
        products: data.data || [],
        pagination: data.pagination || {
          page: pageParam,
          limit: PRODUCTS_PAGE_SIZE,
          total: data.data?.length || 0,
          totalPages: 1,
        },
        store: data.store || null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page = 1, totalPages = 1 } = lastPage.pagination || {};
      return page < totalPages ? page + 1 : undefined;
    },
    ...options,
  });
}

export function useProductsQuery(params, options = {}) {
  const locationKey = useDeliveryLocationKey();

  return useQuery({
    queryKey: queryKeys.products.list({ ...params, locationKey }),
    queryFn: async () => {
      const { data } = await getProducts(params);
      return data.data || [];
    },
    ...options,
  });
}

export function useHotSellingProductsQuery(options = {}) {
  const locationKey = useDeliveryLocationKey();

  return useQuery({
    queryKey: [...queryKeys.products.hotSelling, locationKey],
    queryFn: async () => {
      const { data } = await getProducts({
        hotSelling: true,
        limit: HOME_PRODUCT_LIMIT,
      });
      return (data.data || []).slice(0, HOME_PRODUCT_LIMIT);
    },
    staleTime: 3 * 60 * 1000,
    ...options,
  });
}

export function useRecentlyViewedProductsQuery(options = {}) {
  const ids = getRecentlyViewedIds().slice(0, HOME_PRODUCT_LIMIT);
  const locationKey = useDeliveryLocationKey();

  return useQuery({
    queryKey: [...queryKeys.products.recentlyViewed(ids), locationKey],
    queryFn: async () => {
      if (!ids.length) return [];

      const { data } = await getProducts({
        ids: ids.join(","),
        limit: HOME_PRODUCT_LIMIT,
      });
      const fetched = data.data || [];
      const byId = new Map(fetched.map((product) => [String(product._id), product]));

      return ids
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .slice(0, HOME_PRODUCT_LIMIT);
    },
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
    ...options,
  });
}

