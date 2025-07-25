import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'https://land-registry-backend-plum.vercel.app/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Enable sending cookies
  timeout: 15000 // 15 seconds default timeout
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    try {
      // First check localStorage for user object
      const userStr = localStorage.getItem('user');

      // Also check for direct token storage
      const directToken = localStorage.getItem('token');

      // If not in localStorage, check sessionStorage
      const sessionUserStr = !userStr ? sessionStorage.getItem('user') : null;

      // Use whichever storage has the user data
      const storageUserStr = userStr || sessionUserStr;

      let token = null;

      if (storageUserStr) {
        const user = JSON.parse(storageUserStr);

        if (user && user.token) {
          token = user.token;
        }
      }

      // If no token from user object, try direct token
      if (!token && directToken) {
        token = directToken;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // For blob requests (downloads/previews), don't override Content-Type
      if (config.responseType === 'blob') {
        // Remove Content-Type header for blob requests to let browser handle it
        delete config.headers['Content-Type'];
      }

      // For multipart/form-data requests (file uploads), let browser set Content-Type
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        // Remove Content-Type header to let browser set it with boundary
        delete config.headers['Content-Type'];
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

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors (token expired, etc.)
      if (error.response.status === 401) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

// Create specialized API instances for different use cases
export const dashboardApi = axios.create({
  ...api.defaults,
  timeout: 5000, // 5 seconds for dashboard calls
});

// Create a specialized API instance for recent activities with longer timeout
export const recentActivitiesApi = axios.create({
  ...api.defaults,
  timeout: 12000, // 12 seconds for recent activities to handle large datasets
});

// Apply the same interceptors to specialized APIs
dashboardApi.interceptors.request = api.interceptors.request;
dashboardApi.interceptors.response = api.interceptors.response;
recentActivitiesApi.interceptors.request = api.interceptors.request;
recentActivitiesApi.interceptors.response = api.interceptors.response;

export default api;
