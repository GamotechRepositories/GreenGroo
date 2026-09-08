export function parseBatchQrPayload(payload) {
  const raw = String(payload || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const batch = u.pathname.match(/\/batches\/([^/]+)/i);
    if (batch) return decodeURIComponent(batch[1]);
    const q = u.searchParams.get("q") || u.searchParams.get("batch") || u.searchParams.get("code");
    if (q) return parseBatchQrPayload(q);
  } catch {
    /* not a URL */
  }
  const biz = raw.match(/(GGC-BAT-[A-Za-z0-9-]+)/i);
  if (biz) return biz[1];
  const tagged = raw.match(/(?:greengroo:batch:|ggp\.batch\.)([A-Za-z0-9_-]+)/i);
  if (tagged) return tagged[1];
  return "";
}
