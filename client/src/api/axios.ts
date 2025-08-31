import axios from 'axios';

// Better environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

console.log('🌍 Environment detected:', {
  isProduction,
  isDevelopment,
  baseURL: isProduction ? '/api' : 'http://localhost:3000'
});

// Main API instance for auth and general requests
const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:3000',
  withCredentials: true, // This enables sending/receiving cookies
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
});

// HARD GUARD: never let defaults drift for auth-critical POSTs
export function postJson<T>(url: string, data: any) {
  return api.post<T>(url, data, {
    headers: { 
      "Content-Type": "application/json", 
      "Accept": "application/json" 
    },
  });
}

// Separate API instance for chat/upload operations to prevent header contamination
export const chatApi = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:3000',
  withCredentials: true,
  timeout: 20000, // Longer timeout for chat operations
});

// Add request interceptor for logging (no more token handling needed)
api.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials,
      contentType: config.headers?.['Content-Type']
    });
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    console.log('📥 Response received:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  error => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      responseData: error.response?.data
    });

    if (error.response?.status === 401) {
      // Clear any stored auth state on 401
      console.log('🔒 Unauthorized - clearing auth state');
      
      // Redirect to login if we're not already there
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;