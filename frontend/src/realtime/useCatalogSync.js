import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, onRealtimeConnect, onSync } from "./liveClient";
import { useNearestStore } from "../hooks/useNearestStore";
import { queryKeys } from "../hooks/queries/queryKeys";
import { normalizeSections } from "../hooks/queries/useSectionsQuery";

const catalogListeners = new Set();

/**
 * Subscribe to catalog pushes that already match the shopper's dark store.
 * Listener receives `{ type, entity, action, id, data }`.
 */
export function onCatalogEvent(listener) {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}

function sameId(item, id) {
  return item && String(item._id ?? item.id) === String(id);
}

function patchList(list, event, merge) {
  if (!Array.isArray(list)) return list;
  if (event.action === "deleted" || event.data?.isActive === false) {
    return list.some((item) => sameId(item, event.id))
      ? list.filter((item) => !sameId(item, event.id))
      : list;
  }
  if (!event.data || !list.some((item) => sameId(item, event.id))) return list;
  return list.map((item) => (sameId(item, event.id) ? merge(item, event.data) : item));
}

function patchProducts(data, event) {
  const replace = (_old, next) => next;
  if (Array.isArray(data)) return patchList(data, event, replace);
  if (Array.isArray(data?.pages)) {
    let changed = false;
    const pages = data.pages.map((page) => {
      if (!Array.isArray(page?.products)) return page;
      const products = patchList(page.products, event, replace);
      if (products === page.products) return page;
      changed = true;
      return { ...page, products };
    });
    return changed ? { ...data, pages } : data;
  }
  return data;
}

const mergeDoc = (old, next) => ({ ...old, ...next });

function handleCatalogEvent(queryClient, event) {
  if (event.entity === "product") {
    queryClient.setQueriesData({ queryKey: ["products"] }, (data) => patchProducts(data, event));
    if (event.action === "created") {
      queryClient.invalidateQueries({ queryKey: ["products"], refetchType: "none" });
    }
  } else if (event.entity === "category") {
    queryClient.setQueriesData({ queryKey: queryKeys.categories.all }, (data) =>
      patchList(data, event, mergeDoc)
    );
    if (event.action === "created") {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, refetchType: "none" });
    }
  } else if (event.entity === "section") {
    queryClient.setQueriesData({ queryKey: queryKeys.sections.all }, (data) => {
      if (!Array.isArray(data)) return data;
      if (event.action === "created" && event.data) return normalizeSections([...data, event.data]);
      const next = patchList(data, event, mergeDoc);
      return next === data ? data : normalizeSections(next);
    });
  }
  catalogListeners.forEach((listener) => listener(event));
}

/**
 * Keeps React Query's catalog caches in sync with socket pushes, so admin
 * edits reach the storefront without any refetch. Mount once at the app root.
 */
export function useCatalogSync() {
  const queryClient = useQueryClient();
  const { data: nearest } = useNearestStore();
  const storeId = nearest?.store?.id ? String(nearest.store.id) : "none";

  useEffect(() => {
    const socket = getSocket();
    const watch = () => socket.emit("catalog:watch", { storeId });
    if (socket.connected) watch();

    const offConnect = onRealtimeConnect(({ reconnect }) => {
      watch();
      if (reconnect) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
      }
    });

    const offSync = onSync((event) => {
      if (!event?.entity) return;
      if (event.entity === "product" && event.storeId && event.storeId !== storeId) return;
      handleCatalogEvent(queryClient, event);
    });

    return () => {
      offConnect();
      offSync();
    };
  }, [queryClient, storeId]);
}

export function CatalogSync() {
  useCatalogSync();
  return null;
}
