import { changeFeed } from "../realtime/changeFeed.js";

/**
 * Per-process TTL cache for shared, non-user-specific GET data.
 *
 * Entries are dropped when any listed collection changes (MongoDB change feed,
 * or the wildcard "*" event the feed emits in fallback mode), when the owning
 * controller calls invalidate() after a write, or when the TTL runs out.
 * Concurrent misses for one key share a single loader call. A loader that was
 * started before an invalidation never stores its (possibly stale) result.
 *
 * The cache lives in this Node process only; it is not shared between
 * instances. Set CACHE_DISABLED=1 to bypass every cache.
 */

const DISABLED = process.env.CACHE_DISABLED === "1";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEV_TTL_CAP_MS = 30_000;
const DEBUG = process.env.CACHE_DEBUG === "1";

const registry = new Map();

function approxBytes(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value) || "");
  } catch {
    return Infinity;
  }
}

export function createMemoryCache({
  name,
  ttlMs,
  collections = [],
  maxEntries = 100,
  maxBytes = 2_000_000,
}) {
  const ttl = IS_PRODUCTION ? ttlMs : Math.min(ttlMs, DEV_TTL_CAP_MS);
  const watched = new Set(collections.map((c) => String(c).toLowerCase()));
  const entries = new Map();
  const inflight = new Map();
  const stats = { hits: 0, coalesced: 0, misses: 0, sets: 0, skipped: 0, invalidations: 0, errors: 0 };
  let generation = 0;

  function store(key, value) {
    if (approxBytes(value) > maxBytes) {
      stats.skipped += 1;
      return;
    }
    const now = Date.now();
    for (const [k, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(k);
    }
    while (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
    entries.set(key, { value, expiresAt: now + ttl });
    stats.sets += 1;
  }

  async function get(key, loader) {
    if (DISABLED) return loader();
    try {
      const entry = entries.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        stats.hits += 1;
        return entry.value;
      }
      const pending = inflight.get(key);
      if (pending) {
        stats.coalesced += 1;
        return pending;
      }
    } catch (err) {
      stats.errors += 1;
      if (DEBUG) console.warn(`[cache:${name}] read failed:`, err.message);
      return loader();
    }

    stats.misses += 1;
    const startedAt = generation;
    const promise = loader().then((value) => {
      if (startedAt === generation) {
        try {
          store(key, value);
        } catch (err) {
          stats.errors += 1;
          if (DEBUG) console.warn(`[cache:${name}] write failed:`, err.message);
        }
      }
      return value;
    });
    inflight.set(key, promise);
    promise
      .finally(() => {
        if (inflight.get(key) === promise) inflight.delete(key);
      })
      .catch(() => {});
    return promise;
  }

  function invalidate() {
    generation += 1;
    entries.clear();
    inflight.clear();
    stats.invalidations += 1;
    if (DEBUG) console.log(`[cache:${name}] invalidated`);
  }

  if (watched.size) {
    changeFeed.on("change", (change) => {
      const coll = String(change?.coll || "").toLowerCase();
      if (coll === "*" || watched.has(coll)) invalidate();
    });
  }

  const cache = {
    name,
    get,
    invalidate,
    stats: () => ({ ...stats, entries: entries.size, ttlMs: ttl, disabled: DISABLED }),
  };
  registry.set(name, cache);
  return cache;
}

export function memoryCacheStats() {
  return Object.fromEntries([...registry].map(([name, cache]) => [name, cache.stats()]));
}
