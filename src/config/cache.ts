// In-memory cache helper with TTL support
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get cached data by key
 * @param key - Cache key
 * @returns Cached data or undefined if expired/not found
 */
export function getCache(key: string): unknown {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return entry.data;
}

/**
 * Set cache data with TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds
 */
export function setCache(key: string, data: unknown, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Clear specific cache key
 * @param key - Cache key to clear
 */
export function clearCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache keys matching a pattern
 * @param pattern - Pattern to match (supports prefix matching with *)
 */
export function clearCachePattern(pattern: string): void {
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.delete(pattern);
  }
}

/**
 * Get all cache keys (useful for debugging)
 */
export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}

export default {
  getCache,
  setCache,
  clearCache,
  clearCachePattern,
  getCacheKeys,
};
