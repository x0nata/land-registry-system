import axios from 'axios';

// Get the API base URL - always use the unified backend
const getApiBaseUrl = () => {
  return 'https://land-registry-backend-plum.vercel.app/api';
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Enable sending cookies
  timeout: 15000, // 15 seconds default timeout (reduced from 30s)
  // Optimized retry configuration for faster dashboard loading
  retry: 2, // Reduced from 3 to 2 retries
  retryDelay: 300, // Reduced from 1000ms to 300ms initial delay
  retryCondition: (error) => {
    // Only retry on specific network errors and 5xx server errors
    // Don't retry on 4xx client errors or timeouts to avoid long delays
    return error.code === 'NETWORK_ERROR' ||
           (error.response && error.response.status >= 500 && error.response.status < 600);
  }
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    try {
      // First check localStorage
      const userStr = localStorage.getItem('user');

      // If not in localStorage, check sessionStorage
      const sessionUserStr = !userStr ? sessionStorage.getItem('user') : null;

      // Use whichever storage has the user data
      const storageUserStr = userStr || sessionUserStr;

      if (storageUserStr) {
        const user = JSON.parse(storageUserStr);

        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      // Silent error handling for production
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry logic with exponential backoff
const retryRequest = async (error) => {
  const config = error.config;

  // Initialize retry count if not present
  if (!config.__retryCount) {
    config.__retryCount = 0;
  }

  // Check if we should retry
  if (config.__retryCount >= api.defaults.retry || !api.defaults.retryCondition(error)) {
    return Promise.reject(error);
  }

  // Increment retry count
  config.__retryCount += 1;

  // Calculate delay with optimized exponential backoff (much shorter delays)
  const baseDelay = config.retryDelay || api.defaults.retryDelay;
  const delay = Math.min(baseDelay * Math.pow(1.5, config.__retryCount - 1), 1000); // Cap at 1 second

  console.log(`🔄 Retrying request (attempt ${config.__retryCount}/${config.retry || api.defaults.retry}) after ${delay}ms delay`);

  // Wait for the delay
  await new Promise(resolve => setTimeout(resolve, delay));

  // Retry the request
  return api(config);
};

// Add a response interceptor to handle common errors and retries
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      // Don't retry 401 errors
      return Promise.reject(error);
    }

    // Handle timeout and network errors with retry logic
    if (error.code === 'ECONNABORTED' ||
        error.code === 'NETWORK_ERROR' ||
        !error.response ||
        (error.response && error.response.status >= 500)) {

      try {
        return await retryRequest(error);
      } catch (retryError) {
        // If all retries failed, return the original error with additional context
        const enhancedError = {
          ...retryError,
          message: `Request failed after ${api.defaults.retry} retries: ${retryError.message}`,
          isRetryExhausted: true
        };
        return Promise.reject(enhancedError);
      }
    }

    return Promise.reject(error);
  }
);

// Create specialized API instances for different use cases
export const dashboardApi = axios.create({
  ...api.defaults,
  timeout: 8000, // Increased to 8 seconds for better reliability
  retry: 1, // Allow 1 retry for dashboard calls
  retryDelay: 200, // Very short delay for dashboard calls
  retryCondition: (error) => {
    // Only retry on network errors, not server errors
    return error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED';
  }
});

// Apply the same interceptors to dashboard API
dashboardApi.interceptors.request = api.interceptors.request;
dashboardApi.interceptors.response = api.interceptors.response;

// Create a specialized API instance for recent activities with longer timeout
export const recentActivitiesApi = axios.create({
  ...api.defaults,
  timeout: 12000, // 12 seconds for recent activities to handle large datasets
  retry: 1, // Allow 1 retry for recent activities
  retryDelay: 500, // Short delay for retries
  retryCondition: (error) => {
    // Only retry on network errors and 5xx server errors
    return error.code === 'NETWORK_ERROR' ||
           (error.response && error.response.status >= 500 && error.response.status < 600);
  }
});

// Apply the same interceptors to recent activities API
recentActivitiesApi.interceptors.request = api.interceptors.request;
recentActivitiesApi.interceptors.response = api.interceptors.response;

// Create a fast API instance for critical calls
export const fastApi = axios.create({
  ...api.defaults,
  timeout: 3000, // Reduced to 3 seconds for very fast calls
  retry: 0, // No retries for fast calls to prevent delays
  retryDelay: 0, // No delay for fast calls
  retryCondition: () => false // Never retry fast calls
});

// Apply the same interceptors to fast API
fastApi.interceptors.request = api.interceptors.request;
fastApi.interceptors.response = api.interceptors.response;

// Helper function to create API calls with custom timeout
export const createApiCall = (customTimeout = 30000, customRetries = 3) => {
  const customApi = axios.create({
    ...api.defaults,
    timeout: customTimeout,
    retry: customRetries,
    retryDelay: Math.min(customTimeout / 10, 2000) // Dynamic delay based on timeout
  });

  customApi.interceptors.request = api.interceptors.request;
  customApi.interceptors.response = api.interceptors.response;

  return customApi;
};

export default api;
