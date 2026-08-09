import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/cart');
        if (active) setCart(res.data.cart);
      } catch {
        // ignore — cart will load lazily on next action
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    const res = await api.get('/cart');
    setCart(res.data.cart);
    return res.data.cart;
  }, []);

  const addToCart = useCallback(
    async ({ productId, quantity = 1, size = '', color = '' }) => {
      setLoading(true);
      try {
        const res = await api.post('/cart', { productId, quantity, size, color });
        setCart(res.data.cart);
        return { ok: true, cart: res.data.cart };
      } catch (err) {
        return { ok: false, message: err?.response?.data?.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateItem = useCallback(async (itemId, quantity) => {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    setCart(res.data.cart);
    return res.data.cart;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    setCart(res.data.cart);
    return res.data.cart;
  }, []);

  const clearCart = useCallback(async () => {
    const res = await api.delete('/cart');
    setCart(res.data.cart);
    return res.data.cart;
  }, []);

  const itemCount = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [cart]
  );

  const subtotal = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0,
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      subtotal,
      refresh,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, itemCount, subtotal, refresh, addToCart, updateItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};
