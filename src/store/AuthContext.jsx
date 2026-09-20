import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, {
  clearAccessToken,
  getAccessToken,
  restoreAdminSession,
  setAccessToken,
  setImpersonating,
} from '../api/client';

const AuthContext = createContext(null);

const parseErrorMessage = (err, fallback) => {
  const message = err.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [impersonatedBy, setImpersonatedBy] = useState(null);
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
        setImpersonatedBy(res.data.impersonatedBy || null);
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

  // Admin: act as a customer or vendor. State is rebuilt by a full page load so the
  // cart, wishlist and dashboards all start clean for the new identity.
  const impersonate = useCallback(async (userId) => {
    const res = await api.post(`/admin/users/${userId}/impersonate`);
    setAccessToken(res.data.accessToken);
    setImpersonating(true);
    return res.data.user;
  }, []);

  const exitImpersonation = useCallback(async () => {
    setImpersonating(false);
    try {
      await restoreAdminSession();
    } catch {
      clearAccessToken();
    }
    window.location.assign('/admin');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear locally regardless
    }
    clearAccessToken();
    setImpersonating(false);
    setImpersonatedBy(null);
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
      impersonatedBy,
      impersonate,
      exitImpersonation,
      logout,
      parseErrorMessage,
    }),
    [user, loading, impersonatedBy, login, signup, becomeSeller, adminLogin, impersonate, exitImpersonation, logout]
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
