import axios from 'axios';
import { getCookie } from 'cookies-next';
import { API_BASE_URL } from './base';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

apiClient.interceptors.request.use((config) => {
  // Try to get token from cookie first
  let token = getCookie('kamba_token');

  // If no cookie, try from localStorage (stored by Zustand)
  if (!token && typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('kamba-auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.token;
      }
    } catch (e) {
      console.error('Error reading token from localStorage:', e);
    }
  }

  if (
    token &&
    config.headers.Authorization !== null &&
    !config.headers.Authorization
  ) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login or clear session)
      console.warn('Unauthorized access - potential token expiration');
      // Clear storage on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kamba-auth-storage');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
