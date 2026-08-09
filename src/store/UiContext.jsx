import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UiContext = createContext(null);

// Lightweight global UI state (cart drawer) shared across pages.
export function UiProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = useMemo(
    () => ({ cartOpen, openCart, closeCart }),
    [cartOpen, openCart, closeCart]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within a UiProvider');
  return ctx;
};
