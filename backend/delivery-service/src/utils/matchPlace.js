export function normalizePlace(value, { stripPhase = false } = {}) {
  let s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/hinjawadi/g, "hinjewadi");
  if (stripPhase) s = s.replace(/phase\s*\d+/g, "");
  return s.replace(/[^a-z0-9]+/g, " ").trim();
}

export function placesEqual(a, b) {
  const na = normalizePlace(a);
  const nb = normalizePlace(b);
  return Boolean(na && nb && na === nb);
}

export function areaMatches(stored, query) {
  // Keep phase numbers so Hinjewadi Phase 1 / 2 / 3 stay distinct.
  return placesEqual(stored, query);
}
