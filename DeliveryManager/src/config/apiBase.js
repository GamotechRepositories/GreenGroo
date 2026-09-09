const LIVE_API = "https://api.greengrocc.com";
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

  // Prefer https live host if someone still has http://api.greengrocc.com in .env
  const normalizeLive = (url) => {
    if (!url) return LIVE_API;
    try {
      const u = new URL(url);
      if (u.hostname === "api.greengrocc.com" && u.protocol === "http:") {
        u.protocol = "https:";
        return u.toString().replace(/\/+$/, "");
      }
    } catch (_) {}
    return url;
  };

  if (forceLocal) return local || LOCAL_API;
  if (forceLive) return normalizeLive(live || LIVE_API);
  if (import.meta.env.DEV) return local || LOCAL_API;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return local || LOCAL_API;
    }
  }
  return normalizeLive(live || LIVE_API);
}
