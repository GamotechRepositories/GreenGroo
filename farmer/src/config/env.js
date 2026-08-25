function stripSlash(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function toHttpsWhenPageIsSecure(url) {
  if (!url || typeof window === "undefined") return url;
  if (window.location.protocol !== "https:") return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" && !isLoopbackHost(parsed.hostname)) {
      parsed.protocol = "https:";
      return stripSlash(parsed.toString());
    }
  } catch {
    return url;
  }
  return url;
}

export function getApiBaseUrl() {
  const envUrl = stripSlash(import.meta.env.VITE_API_URL || "");
  const pageHost = typeof window !== "undefined" ? window.location.hostname : "";
  const onLocalPage = !pageHost || isLoopbackHost(pageHost);

  if (envUrl) {
    try {
      const envHost = new URL(envUrl).hostname;
      if (onLocalPage || !isLoopbackHost(envHost)) {
        return toHttpsWhenPageIsSecure(envUrl);
      }
    } catch {
      if (onLocalPage) return envUrl;
    }
  }

  if (!onLocalPage && typeof window !== "undefined") {
    return window.location.origin;
  }

  return envUrl || "http://localhost:5001";
}

export const API_BASE = getApiBaseUrl();
