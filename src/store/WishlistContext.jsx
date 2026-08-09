import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIds([]);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/wishlist');
        if (active) setIds(res.data.wishlist?.products?.map((p) => String(p._id || p)) || []);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const toggle = useCallback(
    async (productId) => {
      const res = await api.post('/wishlist', { productId });
      setIds(res.data.wishlist?.products?.map((p) => String(p._id || p)) || []);
      return res.data.added;
    },
    []
  );

  const value = useMemo(
    () => ({
      ids,
      isWishlisted: (productId) => ids.includes(String(productId)),
      toggle,
    }),
    [ids, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
};
