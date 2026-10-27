import { changeFeed } from "../realtime/changeFeed.js";

/**
 * Per-process TTL cache for shared, non-user-specific GET data.
 *
 * Entries are dropped when any listed collection changes (MongoDB change feed,
 * or the wildcard "*" event the feed emits in fallback mode), when the owning
 * controller calls invalidate() after a write, or when the TTL runs out.
 * `invalidateOn(change)` narrows that: return a predicate over cache keys to
 * drop only some entries, `true` to drop everything, or `false` to ignore.
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
  invalidateOn = null,
  maxEntries = 100,
  maxBytes = 2_000_000,
  maxTotalBytes = 50_000_000,
}) {
  const ttl = IS_PRODUCTION ? ttlMs : Math.min(ttlMs, DEV_TTL_CAP_MS);
  const watched = new Set(collections.map((c) => String(c).toLowerCase()));
  const entries = new Map();
  const inflight = new Map();
  const stats = { hits: 0, coalesced: 0, misses: 0, sets: 0, skipped: 0, invalidations: 0, errors: 0 };
  let generation = 0;
  let totalBytes = 0;

  function drop(key) {
    const entry = entries.get(key);
    if (!entry) return;
    totalBytes -= entry.bytes;
    entries.delete(key);
  }

  function store(key, value) {
    const bytes = approxBytes(value);
    if (bytes > maxBytes) {
      stats.skipped += 1;
      return;
    }
    const now = Date.now();
    for (const [k, entry] of entries) {
      if (entry.expiresAt <= now) drop(k);
    }
    drop(key);
    while (entries.size && (entries.size >= maxEntries || totalBytes + bytes > maxTotalBytes)) {
      drop(entries.keys().next().value);
    }
    entries.set(key, { value, bytes, expiresAt: now + ttl, generation });
    totalBytes += bytes;
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
        return pending.promise;
      }
    } catch (err) {
      stats.errors += 1;
      if (DEBUG) console.warn(`[cache:${name}] read failed:`, err.message);
      return loader();
    }

    stats.misses += 1;
    const job = { startedAt: generation, stale: false, promise: null };
    job.promise = loader().then((value) => {
      if (job.startedAt === generation && !job.stale) {
        try {
          store(key, value);
        } catch (err) {
          stats.errors += 1;
          if (DEBUG) console.warn(`[cache:${name}] write failed:`, err.message);
        }
      }
      return value;
    });
    inflight.set(key, job);
    job.promise
      .finally(() => {
        if (inflight.get(key) === job) inflight.delete(key);
      })
      .catch(() => {});
    return job.promise;
  }

  function invalidate() {
    generation += 1;
    entries.clear();
    inflight.clear();
    totalBytes = 0;
    stats.invalidations += 1;
    if (DEBUG) console.log(`[cache:${name}] invalidated`);
  }

  /** Drop only the entries (and in-flight loads) whose key matches. */
  function invalidateWhere(matches) {
    for (const key of [...entries.keys()]) {
      if (matches(key)) drop(key);
    }
    for (const [key, job] of inflight) {
      if (matches(key)) {
        job.stale = true;
        inflight.delete(key);
      }
    }
    stats.invalidations += 1;
  }

  if (watched.size || invalidateOn) {
    changeFeed.on("change", (change) => {
      const coll = String(change?.coll || "").toLowerCase();
      if (coll === "*") return invalidate();
      if (invalidateOn) {
        const result = invalidateOn({ ...change, coll });
        if (result === true) return invalidate();
        if (typeof result === "function") return invalidateWhere(result);
        if (result === false) return;
      }
      if (watched.has(coll)) invalidate();
    });
  }

  const cache = {
    name,
    get,
    invalidate,
    invalidateWhere,
    stats: () => ({ ...stats, entries: entries.size, bytes: totalBytes, ttlMs: ttl, disabled: DISABLED }),
  };
  registry.set(name, cache);
  return cache;
}

export function memoryCacheStats() {
  return Object.fromEntries([...registry].map(([name, cache]) => [name, cache.stats()]));
}
