import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const EMPTY = { items: [], itemCount: 0, totals: { subtotal: 0, discount: 0, shippingFee: 0, total: 0 } };

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY); setLoaded(!authLoading); return EMPTY; }
    const c = await api('/cart'); setCart(c); setLoaded(true); return c;
  }, [user, authLoading]);

  useEffect(() => { setLoaded(false); refresh().catch(() => { setCart(EMPTY); setLoaded(true); }); }, [refresh]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const c = await api('/cart/items', { method: 'POST', body: { productId, quantity } }); setCart(c); return c;
  }, []);
  const updateItem = useCallback(async (productId, quantity) => {
    const c = await api(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity } }); setCart(c); return c;
  }, []);
  const removeItem = useCallback(async (productId) => {
    const c = await api(`/cart/items/${productId}`, { method: 'DELETE' }); setCart(c); return c;
  }, []);
  const clear = useCallback(async () => { const c = await api('/cart', { method: 'DELETE' }); setCart(c); }, []);

  return (
    <CartContext.Provider value={{ cart, loaded, refresh, addItem, updateItem, removeItem, clear, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
