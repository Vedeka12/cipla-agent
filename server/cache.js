// In-memory 20-minute server cache for NewsAPI response candidates
class SimpleCache {
  constructor(ttlMinutes = 20) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.cache = new Map();
  }

  generateKey(explicitTopics = [], freeTextInterests = []) {
    const sortedTopics = [...explicitTopics].map(t => t.toLowerCase()).sort().join(',');
    const sortedFree = [...freeTextInterests].map(f => f.trim().toLowerCase()).sort().join(',');
    return `news_cache:${sortedTopics}|${sortedFree}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return {
      data: entry.data,
      cachedAt: entry.timestamp,
      ttlRemainingSeconds: Math.round((this.ttlMs - (now - entry.timestamp)) / 1000)
    };
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const newsCache = new SimpleCache(20);
