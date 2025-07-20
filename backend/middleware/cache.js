// Simple in-memory cache for serverless environments
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = 300000) { // Default 5 minutes TTL
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  size() {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Create global cache instance
const cache = new MemoryCache();

// Cache middleware factory
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300000, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = false
  } = options;

  return (req, res, next) => {
    // Skip caching if disabled or condition not met
    if (skipCache || !condition(req)) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`📦 Cache HIT for ${key}`);
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    console.log(`🔍 Cache MISS for ${key}`);
    res.set('X-Cache', 'MISS');

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data) {
        cache.set(key, data, ttl);
        console.log(`💾 Cached response for ${key}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Specific cache configurations for different endpoints
export const dashboardCache = cacheMiddleware({
  ttl: 120000, // 2 minutes for dashboard data
  keyGenerator: (req) => `dashboard:${req.user?.role}:${req.originalUrl}`,
  condition: (req) => req.query.dashboard === 'true'
});

export const statsCache = cacheMiddleware({
  ttl: 300000, // 5 minutes for stats
  keyGenerator: (req) => `stats:${req.originalUrl}:${req.query.timeframe || 'month'}`
});

export const recentActivitiesCache = cacheMiddleware({
  ttl: 60000, // 1 minute for recent activities
  keyGenerator: (req) => `activities:${req.user?.role}:${req.query.limit || 10}`
});

// Cache invalidation helpers
export const invalidateCache = (pattern) => {
  const keys = Array.from(cache.cache.keys());
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  matchingKeys.forEach(key => {
    cache.delete(key);
    console.log(`🗑️ Invalidated cache for ${key}`);
  });
  
  return matchingKeys.length;
};

export const invalidateDashboardCache = () => {
  return invalidateCache('dashboard:');
};

export const invalidateStatsCache = () => {
  return invalidateCache('stats:');
};

export const invalidateActivitiesCache = () => {
  return invalidateCache('activities:');
};

// Cache management endpoints
export const getCacheStats = () => {
  return cache.getStats();
};

export const clearAllCache = () => {
  cache.clear();
  console.log('🧹 All cache cleared');
};

// Export the cache instance for direct access if needed
export { cache };

// Cleanup function for graceful shutdown
export const cleanup = () => {
  cache.clear();
};
