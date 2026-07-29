import crypto from "crypto";

// Cache TTLs (in milliseconds)
// Domain and extraction caches expire after 30 minutes to prevent stale results.
const CACHE_TTL = {
  embeddings: 60 * 60 * 1000,          // 1 hour
  structuredExtraction: 30 * 60 * 1000, // 30 minutes
  domainClassification: 30 * 60 * 1000  // 30 minutes
};

// Cache version tag — increment this when classifier logic changes to auto-invalidate old entries.
export const CACHE_VERSION = "v3";

const cache = {
  embeddings: new Map(),
  structuredExtraction: new Map(),
  domainClassification: new Map()
};

export const sha256 = (input) => {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
};

export const cacheGet = (category, key) => {
  const map = cache[category];
  if (!map) return undefined;

  const entry = map.get(key);
  if (!entry) return undefined;

  const ttl = CACHE_TTL[category];
  if (ttl && (Date.now() - entry.timestamp > ttl)) {
    map.delete(key);
    return undefined;
  }

  return entry.value;
};

export const cacheSet = (category, key, value) => {
  const map = cache[category];
  if (!map) return;
  map.set(key, { value, timestamp: Date.now() });
};

export const cacheClear = (category) => {
  const map = cache[category];
  if (map) map.clear();
};
