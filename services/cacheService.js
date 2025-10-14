// services/cacheService.js
// Optional in-memory cache for quick lookup
const cache = new Map();

export const cacheService = {
  get(key) {
    return cache.get(key);
  },
  set(key, value, ttl = 3600) {
    cache.set(key, value);
    setTimeout(() => cache.delete(key), ttl * 1000);
  },
  clear() {
    cache.clear();
  },
};
