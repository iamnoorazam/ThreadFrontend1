import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearAccessToken, getAccessToken, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

const parseErrorMessage = (err, fallback) => {
  const message = err.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const res = await api.post('/auth/signup', payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const becomeSeller = useCallback(async (payload) => {
    const res = await api.post('/auth/vendor/signup', payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const adminLogin = useCallback(async (credentials) => {
    const res = await api.post('/auth/admin/login', credentials);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear locally regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      becomeSeller,
      adminLogin,
      logout,
      parseErrorMessage,
    }),
    [user, loading, login, signup, becomeSeller, adminLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
