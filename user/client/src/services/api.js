import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3003/api',
  headers: {
    'Content-Type': 'application/json'
  }
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
        console.log('User from storage:', user);

        if (user && user.token) {
          token = user.token;
          console.log('Token found in user object, length:', token.length);
        }
      }

      // If no token from user object, try direct token
      if (!token && directToken) {
        token = directToken;
        console.log('Token found in direct storage');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth token to request:', config.url);
        console.log('Token used:', token.substring(0, 20) + '...');
      } else {
        console.log('No token found in any storage');
      }

      // For blob requests (downloads/previews), don't override Content-Type
      if (config.responseType === 'blob') {
        // Remove Content-Type header for blob requests to let browser handle it
        delete config.headers['Content-Type'];
        console.log('Removed Content-Type header for blob request');
      }

      // For multipart/form-data requests (file uploads), let browser set Content-Type
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        // Remove Content-Type header to let browser set it with boundary
        delete config.headers['Content-Type'];
        console.log('Removed Content-Type header for multipart/form-data request');
      }
    } catch (error) {
      console.error('Error parsing user from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);

      // Handle 401 Unauthorized errors (token expired, etc.)
      if (error.response.status === 401) {
        console.log('Unauthorized access detected');

        // Get the current path to determine which login page to redirect to
        const currentPath = window.location.pathname;

        // Clear user data from localStorage
        localStorage.removeItem('user');

        console.log('User data cleared from localStorage due to 401 error');

        // Don't automatically redirect - let the components handle redirection
        // This prevents redirect loops and allows components to properly handle auth state

        // Log the path for debugging
        if (currentPath.includes('/admin') || currentPath.includes('/dashboard/admin')) {
          console.log('Admin route detected:', currentPath);
        } else if (currentPath.includes('/land-officer')) {
          console.log('Land officer route detected:', currentPath);
        } else {
          console.log('Regular user route detected:', currentPath);
        }
      }

      // Handle 403 Forbidden errors
      if (error.response.status === 403) {
        console.log('Forbidden access');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
