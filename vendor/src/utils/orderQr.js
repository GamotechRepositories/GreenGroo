export function parseOrderQrPayload(payload) {
  const raw = String(payload || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const scan = u.pathname.match(/\/scan\/([^/]+)/i);
    if (scan) return parseOrderQrPayload(decodeURIComponent(scan[1]));
    const q = u.searchParams.get("q") || u.searchParams.get("order") || u.searchParams.get("code");
    if (q) return parseOrderQrPayload(q);
  } catch {
    /* not a URL */
  }
  const biz = raw.match(/(GGC-ORD-[A-Za-z0-9-]+)/i);
  if (biz) return biz[1];
  const tagged = raw.match(/(?:greengroo:order:|ggp\.order\.)([A-Za-z0-9_-]+)/i);
  if (tagged) return tagged[1];
  return raw.replace(/^order[:#\s]+/i, "").trim();
}

export function orderQrLabel(payload) {
  const id = parseOrderQrPayload(payload);
  return id ? `greengroo:order:${id}` : String(payload || "");
}

export function orderQrValue(order) {
  if (!order) return "";
  return String(order.qrPayload || order.orderDisplayId || order.orderId || order.id || "").trim();
}
