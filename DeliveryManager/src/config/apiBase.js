const LIVE_API = "http://api.greengrocc.com";
const LOCAL_API = "http://localhost:5001";

export function getApiBaseUrl() {
  const live = String(
    import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      LIVE_API
  ).replace(/\/+$/, "");
  const local = String(import.meta.env.VITE_API_LOCAL_URL || LOCAL_API).replace(
    /\/+$/,
    ""
  );
  const forceLive =
    String(import.meta.env.VITE_USE_LIVE_API || "").toLowerCase() === "true";
  const forceLocal =
    String(import.meta.env.VITE_USE_LOCAL_API || "").toLowerCase() === "true";

  if (forceLocal) return local || LOCAL_API;
  if (forceLive) return live || LIVE_API;
  if (import.meta.env.DEV) return local || LOCAL_API;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return local || LOCAL_API;
    }
  }
  return live || LIVE_API;
}
