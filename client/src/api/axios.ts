import axios from 'axios';

// Get API URL from environment variable with better fallback handling
const getApiUrl = () => {
  // In production, we need a deployed backend
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-url.com';
  }
  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // This enables sending/receiving cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors (backend not available)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Backend server not available');
      error.message = 'Backend server is not available. Please try again later.';
    }
    
    if (error.response?.status === 401) {
      // Clear any stored auth state on 401
      console.log('Unauthorized - clearing auth state');
      // You might want to trigger a logout here or redirect
    }
    return Promise.reject(error);
  }
);

export default api;