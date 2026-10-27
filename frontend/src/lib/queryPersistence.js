import { dehydrate, hydrate } from "@tanstack/react-query";
import { readPersisted, writePersisted } from "../realtime/persistentCache";

/**
 * Keeps the shared catalog part of the React Query cache on the device, so a
 * returning shopper sees products immediately. Restored queries are marked
 * stale: mounted ones revalidate once in the background, and React Query's
 * structural sharing re-renders only the items that actually changed. After
 * that, socket pushes (useCatalogSync) patch single items as before.
 */

const STORAGE_KEY = "react-query:catalog:v1";
const PERSISTED_ROOTS = new Set(["products", "categories", "sections", "brands", "banners", "store-settings", "nearest-store"]);
const RESTORE_WAIT_MS = 400;
const SAVE_DEBOUNCE_MS = 1500;

const isPersisted = (query) => PERSISTED_ROOTS.has(query.queryKey?.[0]) && query.state.status === "success";

export async function restoreQueryCache(queryClient) {
  const saved = await Promise.race([
    readPersisted(STORAGE_KEY).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), RESTORE_WAIT_MS)),
  ]);
  if (!saved?.data) return;
  try {
    hydrate(queryClient, saved.data);
    queryClient.invalidateQueries({
      predicate: (query) => PERSISTED_ROOTS.has(query.queryKey?.[0]),
      refetchType: "none",
    });
  } catch {
    // A copy from an older build may not fit; the network fills the cache instead.
  }
}

export function persistQueryCache(queryClient) {
  let timer = null;
  const save = () => {
    timer = null;
    writePersisted(STORAGE_KEY, dehydrate(queryClient, { shouldDehydrateQuery: isPersisted }), "");
  };
  return queryClient.getQueryCache().subscribe((event) => {
    if (!PERSISTED_ROOTS.has(event?.query?.queryKey?.[0])) return;
    if (event.type !== "updated" && event.type !== "removed") return;
    if (event.type === "updated" && event.action?.type !== "success") return;
    if (!timer) timer = setTimeout(save, SAVE_DEBOUNCE_MS);
  });
}
