import axios from 'axios';
import { useAdminStore } from '../stores/adminStore';

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
adminClient.interceptors.request.use(
  (config) => {
    const token = useAdminStore.getState().token;

    if (token) {
      console.log('[AdminClient] Adding token to header:', token.substring(0, 10) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[AdminClient] No token found in store');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch event for admin unauthorized
      window.dispatchEvent(new Event('admin:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default adminClient;
