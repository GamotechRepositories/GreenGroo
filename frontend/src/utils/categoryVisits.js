const STORAGE_KEY = "bmm_category_visits";
const MAX_ITEMS = 30;

function normalizeName(name) {
  return String(name || "").trim();
}

function readEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const name = normalizeName(item?.name);
        if (!name) return null;
        return {
          name,
          count: Math.max(1, Number(item.count) || 1),
          lastAt: Number(item.lastAt) || 0,
        };
      })
      .filter(Boolean);
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

export function addCategoryVisit(categoryName) {
  const name = normalizeName(categoryName);
  if (!name) return;

  const now = Date.now();
  const current = readEntries();
  const key = name.toLowerCase();
  const existing = current.find((entry) => entry.name.toLowerCase() === key);
  const rest = current.filter((entry) => entry.name.toLowerCase() !== key);

  writeEntries(
    [
      {
        name: existing?.name || name,
        count: (existing?.count || 0) + 1,
        lastAt: now,
      },
      ...rest,
    ].slice(0, MAX_ITEMS)
  );
}

/** Category names ranked by visit count, then recency. */
export function getMostVisitedCategories(limit = 4) {
  return readEntries()
    .slice()
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.lastAt || 0) - (a.lastAt || 0);
    })
    .slice(0, limit)
    .map((entry) => entry.name);
}
