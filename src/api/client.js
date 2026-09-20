import axios from 'axios';

const ACCESS_TOKEN_KEY = 'tco_access_token';
const IMPERSONATING_KEY = 'tco_impersonating';

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

    if (error.response?.status === 401 && localStorage.getItem(IMPERSONATING_KEY)) {
      // The 30-minute "acting as" token ended. Never replay the request as the admin
      // (it was meant for another user): restore the admin session and go back.
      localStorage.removeItem(IMPERSONATING_KEY);
      try {
        await refreshAccessToken();
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      window.location.assign('/admin');
      return Promise.reject(error);
    }

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
export const setImpersonating = (on) =>
  on ? localStorage.setItem(IMPERSONATING_KEY, '1') : localStorage.removeItem(IMPERSONATING_KEY);
// Swaps an "acting as" token back for the admin's own session (via the refresh cookie).
export const restoreAdminSession = () => refreshAccessToken();

export default api;
