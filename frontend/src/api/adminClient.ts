import axios from 'axios';

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
adminClient.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      const storage = localStorage.getItem('admin-storage');
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
