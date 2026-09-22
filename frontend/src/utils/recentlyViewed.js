const STORAGE_KEY = "bmm_recently_viewed";
const MAX_ITEMS = 20;

function normalizeEntries(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return { id: String(item), count: 1, lastAt: 0 };
      }
      if (item && item.id) {
        return {
          id: String(item.id),
          count: Math.max(1, Number(item.count) || 1),
          lastAt: Number(item.lastAt) || 0,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function readEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
  } catch {
    // Ignore storage quota or privacy mode errors.
  }
}

/** Most recently viewed product IDs (MRU order). */
export function getRecentlyViewedIds() {
  return readEntries()
    .slice()
    .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))
    .map((entry) => entry.id)
    .filter(Boolean);
}

/** Most viewed product IDs (by view count, then recency). */
export function getMostViewedIds(limit = MAX_ITEMS) {
  return readEntries()
    .slice()
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.lastAt || 0) - (a.lastAt || 0);
    })
    .slice(0, limit)
    .map((entry) => entry.id)
    .filter(Boolean);
}

export function addRecentlyViewed(productId) {
  if (!productId) return;

  const id = String(productId);
  const now = Date.now();
  const current = readEntries();
  const existing = current.find((entry) => entry.id === id);
  const rest = current.filter((entry) => entry.id !== id);
  const next = [
    {
      id,
      count: (existing?.count || 0) + 1,
      lastAt: now,
    },
    ...rest,
  ].slice(0, MAX_ITEMS);

  writeEntries(next);
}
