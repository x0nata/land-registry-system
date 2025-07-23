// Simple in-memory cache for dashboard data
class DataCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 30 * 1000; // 30 seconds default TTL (reduced for fresher data)
  }

  // Set data in cache with TTL - only accepts real data
  set(key, data, ttl = this.defaultTTL) {
    // Log what we're trying to cache for debugging
    console.log(`Attempting to cache data for key: ${key}`, data);

    // Reject demo/fake data
    if (!data || this.isDemoData(data)) {
      console.warn(`Attempted to cache demo/invalid data for key: ${key}, ignoring`, data);
      return false;
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
      isRealData: true
    });
    console.log(`Successfully cached data for key: ${key}`);
    return true;
  }

  // Check if data appears to be demo/fake data
  isDemoData(data) {
    if (!data) return true;

    // Only reject very specific demo data patterns
    const demoIndicators = [
      'demo1', 'demo2', 'john doe', 'jane smith', 'plt-001', 'plt-002',
      'demo data', 'sample data', 'using fallback', 'api unavailable',
      'addis ketema.*kebele.*05', 'bole.*kebele.*03' // Specific demo patterns
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    const isDemo = demoIndicators.some(indicator => dataStr.includes(indicator));

    console.log('Cache validation - Is demo data?', isDemo, 'for data type:', typeof data);
    return isDemo;
  }

  // Get data from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Check if key exists and is not expired
  has(key) {
    return this.get(key) !== null;
  }

  // Delete specific key
  delete(key) {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    this.cache.forEach((item) => {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
      }
    });

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  // Clean expired items
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Create singleton instance
const dataCache = new DataCache();

// Expose globally for debugging and cache management
if (typeof window !== 'undefined') {
  window.dataCache = dataCache;
}

// Cache keys for different data types
export const CACHE_KEYS = {
  PROPERTY_STATS: 'property_stats',
  DOCUMENT_STATS: 'document_stats',
  PENDING_PROPERTIES: 'pending_properties_dashboard',
  PENDING_DOCUMENTS: 'pending_documents_dashboard',
  RECENT_ACTIVITIES: 'recent_activities'
};

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  STATS: 30 * 1000,        // 30 seconds for stats (reduced for fresher data)
  PENDING_DATA: 15 * 1000,  // 15 seconds for pending items (reduced for fresher data)
  ACTIVITIES: 30 * 1000     // 30 seconds for activities (reduced for fresher data)
};

// Helper functions for common operations
export const cachePropertyStats = (data) => {
  dataCache.set(CACHE_KEYS.PROPERTY_STATS, data, CACHE_TTL.STATS);
};

export const getCachedPropertyStats = () => {
  return dataCache.get(CACHE_KEYS.PROPERTY_STATS);
};

export const cacheDocumentStats = (data) => {
  dataCache.set(CACHE_KEYS.DOCUMENT_STATS, data, CACHE_TTL.STATS);
};

export const getCachedDocumentStats = () => {
  return dataCache.get(CACHE_KEYS.DOCUMENT_STATS);
};

export const cachePendingProperties = (data) => {
  dataCache.set(CACHE_KEYS.PENDING_PROPERTIES, data, CACHE_TTL.PENDING_DATA);
};

export const getCachedPendingProperties = () => {
  return dataCache.get(CACHE_KEYS.PENDING_PROPERTIES);
};

export const cachePendingDocuments = (data) => {
  dataCache.set(CACHE_KEYS.PENDING_DOCUMENTS, data, CACHE_TTL.PENDING_DATA);
};

export const getCachedPendingDocuments = () => {
  return dataCache.get(CACHE_KEYS.PENDING_DOCUMENTS);
};

export const cacheRecentActivities = (data) => {
  dataCache.set(CACHE_KEYS.RECENT_ACTIVITIES, data, CACHE_TTL.ACTIVITIES);
};

export const getCachedRecentActivities = () => {
  return dataCache.get(CACHE_KEYS.RECENT_ACTIVITIES);
};

// Invalidate related caches when data changes
export const invalidatePropertyCaches = () => {
  dataCache.delete(CACHE_KEYS.PROPERTY_STATS);
  dataCache.delete(CACHE_KEYS.PENDING_PROPERTIES);
  dataCache.delete(CACHE_KEYS.RECENT_ACTIVITIES);
};

export const invalidateDocumentCaches = () => {
  dataCache.delete(CACHE_KEYS.DOCUMENT_STATS);
  dataCache.delete(CACHE_KEYS.PENDING_DOCUMENTS);
  dataCache.delete(CACHE_KEYS.RECENT_ACTIVITIES);
};

// Clear all cache
export const clearAllCache = () => {
  dataCache.clear();
};

// Clear specific cache key
export const clearCache = (key) => {
  dataCache.cache.delete(key);
  console.log(`Cache cleared for key: ${key}`);
};

// Auto cleanup expired items every 5 minutes
setInterval(() => {
  const cleaned = dataCache.cleanup();
  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    console.log(`🧹 Cleaned ${cleaned} expired cache items`);
  }
}, 5 * 60 * 1000);

export default dataCache;
