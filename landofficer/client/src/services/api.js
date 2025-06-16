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
        console.log('User from storage:', user);

        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
          console.log('Added auth token to request:', config.url);
          console.log('Token used:', user.token.substring(0, 20) + '...');
        } else {
          console.log('No token found in user object:', user);
        }
      } else {
        console.log('No user found in storage');
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
      console.error('Response headers:', error.response.headers);

      // Handle 401 Unauthorized errors (token expired, etc.)
      if (error.response.status === 401) {
        console.log('Unauthorized access detected');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
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
