// Simple in-memory cache with TTL for frontend data caching
class DataCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt
    });
    console.log(`📦 Cached data for key: ${key}`);
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      console.log(`🗑️ Expired cache for key: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit for key: ${key}`);
    return cached.data;
  }

  delete(key) {
    this.cache.delete(key);
    console.log(`🗑️ Deleted cache for key: ${key}`);
  }

  clear() {
    this.cache.clear();
    console.log('🧹 Cleared all cache');
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const cache = new DataCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache keys
const CACHE_KEYS = {
  USER_PROPERTIES: 'user_properties',
  USER_STATS: 'user_stats',
  PROPERTY_DETAILS: 'property_details_',
  PAYMENT_HISTORY: 'payment_history',
  RECENT_ACTIVITIES: 'recent_activities'
};

// Property-related caching
export const getCachedUserProperties = () => {
  return cache.get(CACHE_KEYS.USER_PROPERTIES);
};

export const cacheUserProperties = (properties) => {
  cache.set(CACHE_KEYS.USER_PROPERTIES, properties, 3 * 60 * 1000); // 3 minutes
};

export const getCachedUserStats = () => {
  return cache.get(CACHE_KEYS.USER_STATS);
};

export const cacheUserStats = (stats) => {
  cache.set(CACHE_KEYS.USER_STATS, stats, 5 * 60 * 1000); // 5 minutes
};

// Property details caching
export const getCachedPropertyDetails = (propertyId) => {
  return cache.get(CACHE_KEYS.PROPERTY_DETAILS + propertyId);
};

export const cachePropertyDetails = (propertyId, details) => {
  cache.set(CACHE_KEYS.PROPERTY_DETAILS + propertyId, details, 2 * 60 * 1000); // 2 minutes
};

// Payment history caching
export const getCachedPaymentHistory = () => {
  return cache.get(CACHE_KEYS.PAYMENT_HISTORY);
};

export const cachePaymentHistory = (payments) => {
  cache.set(CACHE_KEYS.PAYMENT_HISTORY, payments, 5 * 60 * 1000); // 5 minutes
};

// Recent activities caching
export const getCachedRecentActivities = () => {
  return cache.get(CACHE_KEYS.RECENT_ACTIVITIES);
};

export const cacheRecentActivities = (activities) => {
  cache.set(CACHE_KEYS.RECENT_ACTIVITIES, activities, 2 * 60 * 1000); // 2 minutes
};

// Cache invalidation functions
export const invalidateUserCaches = () => {
  cache.delete(CACHE_KEYS.USER_PROPERTIES);
  cache.delete(CACHE_KEYS.USER_STATS);
  cache.delete(CACHE_KEYS.PAYMENT_HISTORY);
  cache.delete(CACHE_KEYS.RECENT_ACTIVITIES);
};

export const invalidatePropertyCache = (propertyId) => {
  cache.delete(CACHE_KEYS.PROPERTY_DETAILS + propertyId);
  // Also invalidate user properties since they might have changed
  cache.delete(CACHE_KEYS.USER_PROPERTIES);
  cache.delete(CACHE_KEYS.USER_STATS);
};

// Clear all caches (useful for logout)
export const clearAllCaches = () => {
  cache.clear();
};

export default cache;
