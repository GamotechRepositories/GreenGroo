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

function toHttpsIfKnownApi(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" && (u.hostname === "api.greengrocc.com" || u.hostname === "api.greengrocc.in")) {
      u.protocol = "https:";
      return stripSlash(u.toString());
    }
  } catch {
    // ignore
  }
  return url;
}

const LIVE_HTTPS_API = "https://api.greengrocc.com";

export function getApiBaseUrl() {
  const envUrl = stripSlash(import.meta.env.VITE_API_URL || "");
  const inBrowser = typeof window !== "undefined";
  const pageHost = inBrowser ? window.location.hostname : "";
  const onLocalPage = !pageHost || isLoopbackHost(pageHost);

  if (envUrl.startsWith("https://")) {
    return envUrl;
  }

  // HTTPS pages cannot call http:// APIs (mixed content).
  // Live API is HTTPS — call it directly. Same-origin /api only works with a Render rewrite.
  if (inBrowser && window.location.protocol === "https:") {
    if (envUrl) return toHttpsIfKnownApi(envUrl);
    return LIVE_HTTPS_API;
  }

  if (envUrl) {
    const envHost = hostnameOf(envUrl);
    if (onLocalPage || (envHost && !isLoopbackHost(envHost))) {
      return envUrl;
    }
  }

  if (!onLocalPage && inBrowser) return LIVE_HTTPS_API;
  return envUrl || "http://localhost:5001";
}
