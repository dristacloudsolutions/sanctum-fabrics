'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { WishlistEntry, productUrl } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { toggle } = useWishlist();
  const [entries, setEntries] = useState<WishlistEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setEntries(payload.wishlist);
      })
      .catch((err) => setError(err.message || 'Failed to load wishlist'));
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (itemId: string) => {
    await toggle(itemId);
    setEntries((prev) => prev?.filter((e) => e.item_id !== itemId) || null);
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Wishlist</h1>
        <p className="mt-3 text-[color:var(--ink)]/60">Sign in to save and view your favorite pieces.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Wishlist</h1>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {entries === null && !error ? (
        <p className="mt-8 text-sm text-[color:var(--ink)]/50">Loading…</p>
      ) : entries && entries.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart size={40} className="mx-auto text-[color:var(--ink)]/30" />
          <p className="mt-4 text-[color:var(--ink)]/60">Nothing saved yet.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
          >
            Browse the Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {entries?.map((entry) => {
            const product = entry.item;
            if (!product) return null;
            const image = product.images?.find((i) => i.is_primary) || product.images?.[0];
            const price = product.selling_price ?? product.base_price;
            return (
              <div key={entry.id} className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white transition-shadow hover:shadow-lg">
                <button
                  onClick={() => handleRemove(entry.item_id)}
                  aria-label="Remove from wishlist"
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-[color:var(--ink)]/60 shadow hover:text-red-500"
                >
                  <X size={14} />
                </button>
                <Link href={productUrl(product)} className="block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--cream)]">
                    {image?.url ? (
                      <Image src={image.url} alt={product.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">No image yet</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-base text-[color:var(--ink)] leading-snug">{product.name}</h3>
                    {price !== undefined && (
                      <p className="mt-1 text-sm font-semibold text-[color:var(--accent)]">₹{formatINR(price)}</p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
