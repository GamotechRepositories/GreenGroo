const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-10-24" → "24 Oct 2026"; anything else is returned trimmed as-is. */
export function formatProduceDate(value) {
  const raw = String(value || "").trim();
  if (!ISO_DATE_RE.test(raw)) return raw;
  return new Date(`${raw}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isProduceDate(value) {
  return ISO_DATE_RE.test(String(value || "").trim());
}
