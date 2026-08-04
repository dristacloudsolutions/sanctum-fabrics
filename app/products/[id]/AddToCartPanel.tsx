'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Heart } from 'lucide-react';
import { Product } from '@/lib/dristaService';
import { useCart } from '@/app/contexts/CartContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { formatINR } from '@/lib/format';

// Common apparel/fabric color names → swatch hex — covers the values this
// catalog actually uses. Falls back to a plain text chip for anything unmapped
// (e.g. a stray custom shade) rather than guessing a wrong color.
const COLOR_SWATCHES: Record<string, string> = {
  red: '#DC2626', maroon: '#7B1E2B', crimson: '#B91C3C',
  pink: '#EC4899', rose: '#F43F5E', magenta: '#C026D3',
  orange: '#EA580C', peach: '#FDBA74', coral: '#FB7185',
  yellow: '#EAB308', mustard: '#CA9A2C', gold: '#D4AF37',
  green: '#16A34A', 'emerald green': '#0F9D58', olive: '#556B2F', mint: '#6EE7B7',
  teal: '#0D9488', turquoise: '#14B8A6',
  blue: '#2563EB', navy: '#1E3A8A', indigo: '#3730A3', 'royal blue': '#1D4ED8', sky: '#38BDF8',
  purple: '#7C3AED', lavender: '#C4B5FD', violet: '#8B5CF6',
  brown: '#78350F', tan: '#D2B48C', beige: '#E8DCC8', cream: '#F5EFE0', ivory: '#FFFFF0',
  white: '#FFFFFF', black: '#111111', grey: '#9CA3AF', gray: '#9CA3AF', silver: '#C0C0C0',
};
const colorSwatchHex = (value: string) => COLOR_SWATCHES[value.trim().toLowerCase()];

export default function AddToCartPanel({
  product,
  onVariantImageChange,
}: {
  product: Product;
  onVariantImageChange?: (url: string | undefined) => void;
}) {
  const { cart, addItem } = useCart();
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
  // Matches on the exact same variant selection (or no-variant product) already
  // sitting in the cart — picking a different color/size shouldn't read as "in cart".
  const alreadyInCart = (cart?.items || []).some(
    (i) => i.item_id === product.id && (i.variant_id || null) === (matchedVariant?.id || null)
  );
  const price = matchedVariant?.selling_price ?? product.selling_price ?? product.base_price;
  // Variants don't carry their own MRP in this catalog — the base product's
  // list price is what's struck through regardless of which variant is picked.
  const mrp = product.base_price;
  const hasDiscount = mrp !== undefined && price !== undefined && mrp > price;
  const discountPct = hasDiscount ? Math.round(((mrp! - price!) / mrp!) * 100) : 0;
  const stock = matchedVariant ? matchedVariant.current_stock : product.current_stock;
  const outOfStock = product.maintain_stock !== false && stock !== undefined && stock <= 0;
  const canAdd = !needsSelection && !outOfStock;

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
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-semibold text-[color:var(--accent)]">₹{formatINR(price)}</p>
          {hasDiscount && (
            <>
              <p className="text-base text-[color:var(--ink)]/40 line-through">₹{formatINR(mrp)}</p>
              <p className="text-sm font-semibold text-emerald-600">{discountPct}% off</p>
            </>
          )}
        </div>
      )}

      {attributeKeys.map((key) => {
        const isColorAttribute = key.toLowerCase() === 'color';
        return (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">
              {key.replace(/_/g, ' ')}
              {selected[key] && <span className="ml-1.5 normal-case tracking-normal text-[color:var(--ink)]/70">— {selected[key]}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {valuesFor(key).map((value) => {
                const isSelected = selected[key] === value;
                const swatch = isColorAttribute ? colorSwatchHex(value) : undefined;

                if (swatch) {
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
                      aria-label={value}
                      title={value}
                      className={`h-9 w-9 rounded-full ring-offset-2 transition-all ${
                        isSelected ? 'ring-2 ring-[color:var(--accent)]' : 'ring-1 ring-[color:var(--border)] hover:ring-[color:var(--ink)]/40'
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  );
                }

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
        );
      })}

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

      {needsSelection && !error && (
        <p className="text-sm text-[color:var(--ink)]/50">Select {attributeKeys.map((k) => k.replace(/_/g, ' ')).join(' and ')} to continue.</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {wishlistError && <p className="text-sm text-red-500">{wishlistError}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting || !canAdd}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {added || alreadyInCart ? <Check size={16} /> : <ShoppingBag size={16} />}
          {added ? 'Added to cart' : submitting ? 'Adding…' : alreadyInCart ? 'Added in Cart' : 'Add to Cart'}
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

        {(added || alreadyInCart) && (
          <>
            <button
              type="button"
              onClick={() => router.push('/cart')}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)]/20 px-6 py-3 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--ink)]/40"
            >
              View Cart
            </button>
            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Checkout
            </button>
          </>
        )}
      </div>

      {/* Sticky mobile buy bar — keeps price + Add to Cart reachable without
          scrolling back up, once the gallery/description push this panel down. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[color:var(--border)] bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
        {price !== undefined && (
          <div className="min-w-0 shrink-0">
            <p className="text-lg font-semibold text-[color:var(--accent)]">₹{formatINR(price)}</p>
            {hasDiscount && <p className="text-xs text-[color:var(--ink)]/40 line-through">₹{formatINR(mrp)}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting || !canAdd}
          className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {added || alreadyInCart ? <Check size={16} /> : <ShoppingBag size={16} />}
          {added ? 'Added' : submitting ? 'Adding…' : outOfStock ? 'Out of stock' : needsSelection ? 'Select options' : alreadyInCart ? 'Added in Cart' : 'Add to Cart'}
        </button>
      </div>
      {/* Spacer so the sticky bar above never overlaps the last bit of page content on mobile. */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
