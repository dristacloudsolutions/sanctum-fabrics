'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  itemIds: Set<string>;
  loading: boolean;
  isWishlisted: (itemId: string) => boolean;
  toggle: (itemId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setItemIds(new Set());
      return;
    }
    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.wishlist) setItemIds(new Set(payload.wishlist.map((w: any) => w.item_id)));
      })
      .catch(() => {});
  }, [user]);

  const toggle = async (itemId: string) => {
    if (!user) throw new Error('Please sign in to save items to your wishlist');
    setLoading(true);
    const wasWishlisted = itemIds.has(itemId);
    try {
      if (wasWishlisted) {
        await fetch(`/api/wishlist/${itemId}`, { method: 'DELETE' });
        setItemIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
      } else {
        await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
        setItemIds((prev) => new Set(prev).add(itemId));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider value={{ itemIds, loading, isWishlisted: (id) => itemIds.has(id), toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
