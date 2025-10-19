// services/cacheService.js
// Stub cacheService — hiện chưa sử dụng.
// Có thể bật lại để giảm chi phí OpenAI khi lượng người dùng tăng.

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

