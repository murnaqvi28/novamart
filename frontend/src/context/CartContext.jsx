import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const EMPTY = { items: [], itemCount: 0, totals: { subtotal: 0, discount: 0, shippingFee: 0, total: 0 } };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY); return EMPTY; }
    const c = await api('/cart'); setCart(c); return c;
  }, [user]);

  useEffect(() => { refresh().catch(() => setCart(EMPTY)); }, [refresh]);

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
    <CartContext.Provider value={{ cart, refresh, addItem, updateItem, removeItem, clear, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
