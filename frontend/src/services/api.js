import axios from 'axios';

// Base URL from environment or fallback
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
});

// Add token automatically to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 [API Request] ${config.method.toUpperCase()} ${config.url}`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`⚠️ [API Request] No token found for ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Handle expired tokens - MODIFIED TO PREVENT AUTO-REDIRECT
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ [API Response Error] ${error.response?.status || 'No status'} ${error.config?.method?.toUpperCase() || 'No method'} ${error.config?.url || 'No URL'}`);
    console.error('   Error details:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🚨 [API] 401 Unauthorized detected!');
      
      // Check current path to avoid redirect loops
      const currentPath = window.location.pathname;
      console.log(`   Current path: ${currentPath}`);
      
      // Don't redirect if already on login page
      if (currentPath !== '/login') {
        console.log('   Clearing localStorage and redirecting to login...');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if NOT in a clerk page (to debug)
        if (currentPath.includes('/clerk')) {
          console.log('   🔍 DEBUG: Would normally redirect from clerk page, but holding for debugging');
          // Don't redirect - let the component handle the error
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;