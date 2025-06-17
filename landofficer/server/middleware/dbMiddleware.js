import mongoose from "mongoose";

// Circuit breaker state
let circuitBreaker = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: null,
  successCount: 0,
  halfOpenAttempts: 0
};

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  recoveryTimeout: 30000, // 30 seconds before attempting recovery
  halfOpenMaxAttempts: 3, // Max attempts in half-open state
  successThreshold: 2 // Successes needed to close circuit
};

// Database operation retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Calculate retry delay with exponential backoff
const calculateRetryDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelay
  );
  return delay + Math.random() * 1000; // Add jitter
};

// Check if circuit breaker should be opened
const shouldOpenCircuit = () => {
  return circuitBreaker.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold;
};

// Check if circuit breaker should attempt recovery
const shouldAttemptRecovery = () => {
  if (!circuitBreaker.isOpen) return false;
  
  const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
  return timeSinceLastFailure >= CIRCUIT_BREAKER_CONFIG.recoveryTimeout;
};

// Record operation success
const recordSuccess = () => {
  if (circuitBreaker.isOpen) {
    circuitBreaker.halfOpenAttempts++;
    circuitBreaker.successCount++;
    
    // Close circuit if enough successes in half-open state
    if (circuitBreaker.successCount >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
      console.log('🔄 Circuit breaker: Closing circuit after successful operations');
      circuitBreaker.isOpen = false;
      circuitBreaker.failureCount = 0;
      circuitBreaker.successCount = 0;
      circuitBreaker.halfOpenAttempts = 0;
      circuitBreaker.lastFailureTime = null;
    }
  } else {
    // Reset failure count on success
    circuitBreaker.failureCount = 0;
  }
};

// Record operation failure
const recordFailure = (error) => {
  circuitBreaker.failureCount++;
  circuitBreaker.lastFailureTime = Date.now();
  circuitBreaker.successCount = 0;

  if (shouldOpenCircuit() && !circuitBreaker.isOpen) {
    console.error(`🚨 Circuit breaker: Opening circuit after ${circuitBreaker.failureCount} failures`);
    circuitBreaker.isOpen = true;
    circuitBreaker.halfOpenAttempts = 0;
  }

  console.error(`💥 Database operation failed (${circuitBreaker.failureCount}/${CIRCUIT_BREAKER_CONFIG.failureThreshold}):`, error.message);
};

// Check if operation should be allowed
const isOperationAllowed = () => {
  if (!circuitBreaker.isOpen) return true;
  
  if (shouldAttemptRecovery()) {
    if (circuitBreaker.halfOpenAttempts < CIRCUIT_BREAKER_CONFIG.halfOpenMaxAttempts) {
      console.log('🔄 Circuit breaker: Attempting recovery (half-open state)');
      return true;
    }
  }
  
  return false;
};

// Check if error is retryable
const isRetryableError = (error) => {
  const retryableErrors = [
    'MongoNetworkError',
    'MongoTimeoutError',
    'MongoServerSelectionError',
    'MongoWriteConcernError'
  ];
  
  return retryableErrors.includes(error.name) || 
         error.message.includes('connection') ||
         error.message.includes('timeout') ||
         error.message.includes('network');
};

// Execute database operation with retry logic
const executeWithRetry = async (operation, context = 'database operation') => {
  // Check circuit breaker
  if (!isOperationAllowed()) {
    const error = new Error('Circuit breaker is open - database operations temporarily disabled');
    error.name = 'CircuitBreakerOpenError';
    throw error;
  }

  let lastError;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Check connection state before operation
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not connected (state: ${mongoose.connection.readyState})`);
      }

      const result = await operation();
      recordSuccess();
      
      if (attempt > 0) {
        console.log(`✅ ${context} succeeded after ${attempt} retries`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        recordFailure(error);
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === RETRY_CONFIG.maxRetries) {
        recordFailure(error);
        break;
      }
      
      const delay = calculateRetryDelay(attempt);
      console.warn(`⚠️ ${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Middleware for database operations
const dbOperationMiddleware = (req, res, next) => {
  // Add database operation helper to request object
  req.dbOperation = async (operation, context) => {
    return executeWithRetry(operation, context);
  };
  
  // Add circuit breaker status to request
  req.circuitBreakerStatus = () => ({
    isOpen: circuitBreaker.isOpen,
    failureCount: circuitBreaker.failureCount,
    lastFailureTime: circuitBreaker.lastFailureTime,
    successCount: circuitBreaker.successCount
  });
  
  next();
};

// Health check middleware
const dbHealthCheckMiddleware = async (req, res, next) => {
  try {
    // Quick connection state check
    if (mongoose.connection.readyState !== 1) {
      req.dbHealthy = false;
      req.dbError = `Database not connected (state: ${mongoose.connection.readyState})`;
    } else {
      req.dbHealthy = true;
    }
  } catch (error) {
    req.dbHealthy = false;
    req.dbError = error.message;
  }
  
  next();
};

// Get circuit breaker status
const getCircuitBreakerStatus = () => ({
  ...circuitBreaker,
  config: CIRCUIT_BREAKER_CONFIG
});

// Reset circuit breaker (for manual recovery)
const resetCircuitBreaker = () => {
  console.log('🔄 Manually resetting circuit breaker');
  circuitBreaker.isOpen = false;
  circuitBreaker.failureCount = 0;
  circuitBreaker.lastFailureTime = null;
  circuitBreaker.successCount = 0;
  circuitBreaker.halfOpenAttempts = 0;
};

export {
  dbOperationMiddleware,
  dbHealthCheckMiddleware,
  executeWithRetry,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  isRetryableError
};
