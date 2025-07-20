/**
 * Debounce utility function
 * Delays the execution of a function until after a specified delay has passed
 * since the last time it was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    // Clear the previous timeout
    clearTimeout(timeoutId);
    
    // Set a new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Throttle utility function
 * Limits the execution of a function to at most once per specified interval
 * 
 * @param {Function} func - The function to throttle
 * @param {number} interval - The interval in milliseconds
 * @returns {Function} - The throttled function
 */
export const throttle = (func, interval) => {
  let lastCall = 0;
  
  return function (...args) {
    const now = Date.now();
    
    if (now - lastCall >= interval) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

/**
 * Create a debounced version of an async function
 * Useful for API calls that should be debounced
 * 
 * @param {Function} asyncFunc - The async function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced async function
 */
export const debounceAsync = (asyncFunc, delay) => {
  let timeoutId;
  let currentPromise;
  
  return function (...args) {
    // Clear the previous timeout
    clearTimeout(timeoutId);
    
    // Return a promise that resolves when the debounced function executes
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await asyncFunc.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Create a memoized version of a function
 * Caches results based on function arguments
 * 
 * @param {Function} func - The function to memoize
 * @param {Function} keyGenerator - Optional function to generate cache keys
 * @returns {Function} - The memoized function
 */
export const memoize = (func, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return function (...args) {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
};

/**
 * Create a memoized version of an async function with TTL (Time To Live)
 * 
 * @param {Function} asyncFunc - The async function to memoize
 * @param {number} ttl - Time to live in milliseconds
 * @param {Function} keyGenerator - Optional function to generate cache keys
 * @returns {Function} - The memoized async function
 */
export const memoizeAsync = (asyncFunc, ttl = 300000, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return async function (...args) {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    // Check if cached result exists and is still valid
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }
    
    try {
      const result = await asyncFunc.apply(this, args);
      cache.set(key, {
        result,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      // Remove invalid cache entry
      cache.delete(key);
      throw error;
    }
  };
};
