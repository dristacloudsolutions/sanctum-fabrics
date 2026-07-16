'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart } from '@/lib/dristaService';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  addItem: (itemId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (itemId: string, variantId?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, initialCart }: { children: ReactNode; initialCart: Cart | null }) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const res = await fetch('/api/cart');
    const payload = await res.json();
    if (res.ok) setCart(payload.cart);
  };

  // No cart_id cookie existed yet at server-render time (first-ever visit) —
  // /api/cart is a Route Handler, so it's allowed to create one and set the cookie.
  useEffect(() => {
    if (!initialCart) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = async (itemId: string, quantity: number, variantId?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity, variantId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to add to cart');
      setCart(payload.cart);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number, variantId?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, variantId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to update item');
      setCart(payload.cart);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string, variantId?: string) => {
    setLoading(true);
    try {
      const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
      const res = await fetch(`/api/cart/items/${itemId}${qs}`, { method: 'DELETE' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to remove item');
      setCart(payload.cart);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = (cart?.items || []).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, addItem, updateQuantity, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
}
