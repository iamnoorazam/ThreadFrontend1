import axios from 'axios';

const ACCESS_TOKEN_KEY = 'tco_access_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retried && original.url !== '/auth/login') {
      original._retried = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

export default api;
