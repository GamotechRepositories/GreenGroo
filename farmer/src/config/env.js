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

function forceHttpsForLiveApi(url) {
  if (!url || !/^http:\/\//i.test(url)) return url;
  const host = hostnameOf(url);
  if (!host || isLoopbackHost(host)) return url;
  return stripSlash(url.replace(/^http:\/\//i, "https://"));
}

export function getApiBaseUrl() {
  const envUrl = stripSlash(import.meta.env.VITE_API_URL || "");
  const inBrowser = typeof window !== "undefined";
  const pageHost = inBrowser ? window.location.hostname : "";
  const onLocalPage = !pageHost || isLoopbackHost(pageHost);
  const pageIsHttps = inBrowser && window.location.protocol === "https:";

  let base = envUrl;

  if (base && !onLocalPage && isLoopbackHost(hostnameOf(base))) {
    base = "";
  }

  if (!base) {
    if (!onLocalPage && inBrowser) return window.location.origin;
    return "http://localhost:5001";
  }

  if (import.meta.env.PROD || pageIsHttps) {
    base = forceHttpsForLiveApi(base);
  }

  return base;
}
