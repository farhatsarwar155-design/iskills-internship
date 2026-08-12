import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send secure cookies (for refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add bearer token
api.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined' && !originalRequest.url?.includes('/auth/refresh')) {
        window.location.href = '/access-denied';
      }
      return Promise.reject(error);
    }

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the original request was the login or refresh request itself
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token, user } = response.data;
        setAccessToken(token);
        
        // Notify any active event listeners or contexts that the user session refreshed
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('auth-token-refreshed', { detail: { token, user } });
          window.dispatchEvent(event);
        }

        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens and notify app of logout
        setAccessToken('');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
