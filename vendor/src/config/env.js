function stripSlash(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isPrivateHost(hostname) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
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

  if (envUrl.startsWith("https://")) {
    return envUrl;
  }

  if (inBrowser && window.location.protocol === "https:") {
    const envHost = hostnameOf(envUrl);
    if (envHost && !isLoopbackHost(envHost) && !isPrivateHost(envHost)) {
      return envUrl.replace(/^http:\/\//i, "https://");
    }
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
