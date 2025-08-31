import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3000',
  withCredentials: true, // This enables sending/receiving cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear any stored auth state on 401
      console.log('Unauthorized - clearing auth state');
      localStorage.removeItem('authToken');
      // You might want to trigger a logout here or redirect
    }
    return Promise.reject(error);
  }
);

export default api;