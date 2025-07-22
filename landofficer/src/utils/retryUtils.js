// Retry utility with exponential backoff for API calls
class RetryManager {
  constructor() {
    this.defaultConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
      jitterFactor: 0.1 // 10% jitter to prevent thundering herd
    };
  }

  // Calculate delay with exponential backoff and jitter
  calculateDelay(attempt, config = {}) {
    const { baseDelay, maxDelay, backoffMultiplier, jitterFactor } = {
      ...this.defaultConfig,
      ...config
    };

    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }

  // Check if error is retryable
  isRetryableError(error) {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      return true;
    }

    // Timeout errors
    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    // Server errors (5xx)
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Rate limiting (429)
    if (error.response && error.response.status === 429) {
      return true;
    }

    return false;
  }

  // Execute function with retry logic
  async executeWithRetry(fn, context = 'operation', config = {}) {
    const retryConfig = { ...this.defaultConfig, ...config };
    let lastError;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 0 && process.env.NODE_ENV === 'development') {
          console.log(`✅ ${context} succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry if error is not retryable
        if (!this.isRetryableError(error)) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ ${context} failed with non-retryable error:`, error.message);
          }
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ ${context} failed after ${retryConfig.maxRetries} retries:`, error.message);
          }
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, retryConfig);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ ${context} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Create a retryable version of an async function
  createRetryableFunction(fn, context, config = {}) {
    return (...args) => this.executeWithRetry(() => fn(...args), context, config);
  }
}

// Create singleton instance
const retryManager = new RetryManager();

// Export convenience functions
export const executeWithRetry = (fn, context, config) => 
  retryManager.executeWithRetry(fn, context, config);

export const createRetryableFunction = (fn, context, config) => 
  retryManager.createRetryableFunction(fn, context, config);

export const isRetryableError = (error) => 
  retryManager.isRetryableError(error);

export default retryManager;
