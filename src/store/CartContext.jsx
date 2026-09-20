import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_KEY = 'tc-guest-cart';

const readGuest = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuest = (items) => {
  try {
    if (items.length) localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    // storage unavailable — the guest cart just won't survive a reload
  }
};

// Deterministic id so the same product/size/color is always the same line.
const guestLineId = (productId, size, color) => `${productId}|${size}|${color}`;

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [serverCart, setServerCart] = useState(null);
  const [guestItems, setGuestItems] = useState(readGuest);
  const guestRef = useRef(guestItems);
  const [loading, setLoading] = useState(false);

  const commitGuest = useCallback((items) => {
    guestRef.current = items;
    setGuestItems(items);
    writeGuest(items);
  }, []);

  // Signed in: fold any guest cart into the server cart, then load it.
  // The merge is idempotent server-side, so a replayed run is harmless.
  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      setServerCart(null);
      commitGuest(readGuest());
      return undefined;
    }
    let active = true;
    const load = async () => {
      try {
        const pending = readGuest();
        if (pending.length) {
          try {
            const res = await api.post('/cart/merge', {
              items: pending.map(({ productId, quantity, size, color }) => ({
                productId,
                quantity,
                size,
                color,
              })),
            });
            // Clear only after the server has the items.
            commitGuest([]);
            if (active) setServerCart(res.data.cart);
            return;
          } catch {
            // keep the guest cart so the merge is retried next time
          }
        }
        const res = await api.get('/cart');
        if (active) setServerCart(res.data.cart);
      } catch {
        // ignore — cart will load lazily on next action
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated, authLoading, commitGuest]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return { items: guestRef.current };
    const res = await api.get('/cart');
    setServerCart(res.data.cart);
    return res.data.cart;
  }, [isAuthenticated]);

  const addToGuestCart = useCallback(
    async ({ productId, quantity, size, color }) => {
      let product;
      try {
        const res = await api.get(`/products/${productId}`);
        product = res.data.product;
      } catch (err) {
        return { ok: false, message: err?.response?.data?.message || 'Product not found or unavailable' };
      }
      if (!product || product.status !== 'active') {
        return { ok: false, message: 'Product not found or unavailable' };
      }

      const id = guestLineId(productId, size, color);
      const items = guestRef.current;
      const existing = items.find((i) => i._id === id);
      const nextQty = (existing?.quantity || 0) + quantity;
      if (product.stockQuantity < nextQty) {
        return { ok: false, message: 'Insufficient stock' };
      }

      const line = {
        _id: id,
        productId: product._id,
        shopId: product.shopId?._id || product.shopId,
        title: product.title,
        image: product.images?.[0] || '',
        price: product.effectivePrice ?? product.price,
        stock: product.stockQuantity,
        size,
        color,
        quantity: nextQty,
      };
      commitGuest(existing ? items.map((i) => (i._id === id ? line : i)) : [...items, line]);
      return { ok: true, cart: { items: guestRef.current } };
    },
    [commitGuest]
  );

  const addToCart = useCallback(
    async ({ productId, quantity = 1, size = '', color = '' }) => {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          return await addToGuestCart({ productId, quantity, size, color });
        }
        const res = await api.post('/cart', { productId, quantity, size, color });
        setServerCart(res.data.cart);
        return { ok: true, cart: res.data.cart };
      } catch (err) {
        return { ok: false, message: err?.response?.data?.message };
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, addToGuestCart]
  );

  const updateItem = useCallback(
    async (itemId, quantity) => {
      if (!isAuthenticated) {
        const items = guestRef.current;
        const next =
          quantity < 1
            ? items.filter((i) => i._id !== itemId)
            : items.map((i) =>
                i._id === itemId ? { ...i, quantity: Math.min(quantity, i.stock ?? quantity) } : i
              );
        commitGuest(next);
        return { items: next };
      }
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      setServerCart(res.data.cart);
      return res.data.cart;
    },
    [isAuthenticated, commitGuest]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (!isAuthenticated) {
        const next = guestRef.current.filter((i) => i._id !== itemId);
        commitGuest(next);
        return { items: next };
      }
      const res = await api.delete(`/cart/items/${itemId}`);
      setServerCart(res.data.cart);
      return res.data.cart;
    },
    [isAuthenticated, commitGuest]
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      commitGuest([]);
      return { items: [] };
    }
    const res = await api.delete('/cart');
    setServerCart(res.data.cart);
    return res.data.cart;
  }, [isAuthenticated, commitGuest]);

  const cart = useMemo(
    () => (isAuthenticated ? serverCart : { items: guestItems }),
    [isAuthenticated, serverCart, guestItems]
  );

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
      isGuest: !isAuthenticated,
      itemCount,
      subtotal,
      refresh,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, isAuthenticated, itemCount, subtotal, refresh, addToCart, updateItem, removeItem, clearCart]
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
