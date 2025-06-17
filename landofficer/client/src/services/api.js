import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies
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

export default api;
