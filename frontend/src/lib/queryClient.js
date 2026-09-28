import { QueryClient } from "@tanstack/react-query";

// Catalog queries are kept fresh by socket pushes (see realtime/useCatalogSync),
// so they never go stale on a timer and are not refetched on focus/reconnect.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
