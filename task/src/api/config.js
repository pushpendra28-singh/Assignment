import axios from 'axios';

// ─── API Base URL ─────────────────────────────────────────────────────────────
// Priority: .env → fallback to localhost
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // ✅ important for cookies / auth (future-safe)
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('nexus_token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Token read error:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — handle auth errors ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      try {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
      } catch (err) {
        console.error('Storage clear error:', err);
      }

      const isAuthPage =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register');

      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;