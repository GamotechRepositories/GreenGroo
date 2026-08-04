const STORAGE_KEY = "bmm_recently_viewed";
const MAX_ITEMS = 20;

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId) {
  if (!productId) return;

  const id = String(productId);
  const current = getRecentlyViewedIds().filter((item) => item !== id);
  const next = [id, ...current].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or privacy mode errors.
  }
}
