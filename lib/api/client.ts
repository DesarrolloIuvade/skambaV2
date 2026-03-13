import axios from 'axios';
import { getCookie } from 'cookies-next';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://sm.plataformasvirtuales.pe/sk/api/',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getCookie('kamba_token');
  if (token && config.headers.Authorization !== null && !config.headers.Authorization) {
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
    }
    return Promise.reject(error);
  }
);

export default apiClient;
