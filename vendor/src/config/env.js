function stripSlash(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function getApiBaseUrl() {
  const envUrl = stripSlash(import.meta.env.VITE_API_URL || "");
  const inBrowser = typeof window !== "undefined";
  const pageHost = inBrowser ? window.location.hostname : "";
  const onLocalPage = !pageHost || isLoopbackHost(pageHost);

  // HTTPS pages cannot call http:// (browser mixed-content block).
  // Use the page origin so /api is proxied to the HTTP backend.
  if (inBrowser && window.location.protocol === "https:") {
    return window.location.origin;
  }

  if (envUrl) {
    const envHost = hostnameOf(envUrl);
    if (onLocalPage || (envHost && !isLoopbackHost(envHost))) {
      return envUrl;
    }
  }

  if (!onLocalPage && inBrowser) return window.location.origin;
  return envUrl || "http://localhost:5001";
}
