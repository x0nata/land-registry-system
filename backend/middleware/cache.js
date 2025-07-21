/**
 * Cache middleware for optimizing API responses
 */

// Simple in-memory cache for development/testing
// In production, you would use Redis or similar
const cache = new Map();

/**
 * Generic cache middleware
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl || req.url}`;
    
    // Check if we have cached data
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = cachedData;
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < duration * 1000) {
        console.log(`Cache hit for: ${cacheKey}`);
        return res.json(data);
      } else {
        // Remove expired cache entry
        cache.delete(cacheKey);
      }
    }

    // Store original res.json function
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response data
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log(`Cached response for: ${cacheKey}`);
      
      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache middleware specifically for statistics endpoints
 * Caches for 5 minutes (300 seconds)
 */
export const statsCache = cacheMiddleware(300);

/**
 * Cache middleware for user data
 * Caches for 2 minutes (120 seconds)
 */
export const userCache = cacheMiddleware(120);

/**
 * Cache middleware for property data
 * Caches for 1 minute (60 seconds)
 */
export const propertyCache = cacheMiddleware(60);

/**
 * Clear all cache entries
 */
export const clearCache = () => {
  cache.clear();
  console.log('Cache cleared');
};

/**
 * Clear specific cache entry
 * @param {string} key - Cache key to clear
 */
export const clearCacheKey = (key) => {
  cache.delete(key);
  console.log(`Cache cleared for key: ${key}`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    memoryUsage: process.memoryUsage()
  };
};

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [key, value] of cache.entries()) {
    // Default expiration of 5 minutes if not specified
    const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (now - value.timestamp > maxAge) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => cache.delete(key));
  
  if (expiredKeys.length > 0) {
    console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
  }
}, 10 * 60 * 1000); // Run every 10 minutes

export default {
  cacheMiddleware,
  statsCache,
  userCache,
  propertyCache,
  clearCache,
  clearCacheKey,
  getCacheStats
};
