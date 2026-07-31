'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Heart } from 'lucide-react';
import { Product } from '@/lib/dristaService';
import { useCart } from '@/app/contexts/CartContext';
import { useWishlist } from '@/app/contexts/WishlistContext';

export default function AddToCartPanel({
  product,
  onVariantImageChange,
}: {
  product: Product;
  onVariantImageChange?: (url: string | undefined) => void;
}) {
  const { addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const router = useRouter();
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = async () => {
    setWishlistError(null);
    try {
      await toggleWishlist(product.id);
    } catch (err: any) {
      setWishlistError(err.message || 'Could not update wishlist');
    }
  };
  const variants = product.variants?.filter((v) => v.is_active) || [];

  // Every distinct attribute key across all variants (e.g. "color", "length_m"),
  // each rendered as its own row of selectable chips.
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes || {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const valuesFor = (key: string) => Array.from(new Set(variants.map((v) => String(v.attributes?.[key])).filter(Boolean)));

  const matchedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    if (attributeKeys.some((k) => !selected[k])) return null;
    return variants.find((v) => attributeKeys.every((k) => String(v.attributes?.[k]) === selected[k])) || null;
  }, [variants, attributeKeys, selected]);

  useEffect(() => {
    onVariantImageChange?.(matchedVariant?.image_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedVariant?.image_url]);

  const needsSelection = variants.length > 0 && !matchedVariant;
  const price = matchedVariant?.selling_price ?? product.selling_price ?? product.base_price;
  const stock = matchedVariant ? matchedVariant.current_stock : product.current_stock;
  const outOfStock = product.maintain_stock !== false && stock !== undefined && stock <= 0;

  const handleAdd = async () => {
    setError(null);
    if (needsSelection) {
      setError('Please choose ' + attributeKeys.join(' and ') + ' first.');
      return;
    }
    setSubmitting(true);
    try {
      await addItem(product.id, quantity, matchedVariant?.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Could not add to cart');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      {price !== undefined && (
        <p className="text-2xl font-semibold text-[color:var(--accent)]">₹{Number(price).toLocaleString('en-IN')}</p>
      )}

      {attributeKeys.map((key) => (
        <div key={key}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">{key.replace(/_/g, ' ')}</p>
          <div className="flex flex-wrap gap-2">
            {valuesFor(key).map((value) => {
              const isSelected = selected[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                      : 'border-[color:var(--border)] text-[color:var(--ink)]/70 hover:border-[color:var(--accent)]'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-[color:var(--border)]">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-[color:var(--ink)]">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
          >
            +
          </button>
        </div>
        {outOfStock && <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Out of stock</span>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {wishlistError && <p className="text-sm text-red-500">{wishlistError}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting || outOfStock}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {added ? <Check size={16} /> : <ShoppingBag size={16} />}
          {added ? 'Added to cart' : submitting ? 'Adding…' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`inline-flex items-center justify-center rounded-full border p-3 transition-colors ${
            wishlisted ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : 'border-[color:var(--ink)]/20 text-[color:var(--ink)]/60 hover:border-[color:var(--ink)]/40'
          }`}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {added && (
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)]/20 px-6 py-3 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--ink)]/40"
          >
            View Cart
          </button>
        )}
      </div>
    </div>
  );
}
