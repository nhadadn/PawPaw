import axios from 'axios';
// import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add Authorization header
    let token = null;
    try {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        token = parsed.state?.token;
      }
    } catch {
      // Ignore error
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Idempotency-Key for mutating requests if not present
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = crypto.randomUUID();
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors if needed (e.g., 401 Unauthorized -> logout)
    if (error.response?.status === 401) {
       // We can't import the store here directly to avoid circular dependency
       // Dispatch a custom event or handle it in the UI
       window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
