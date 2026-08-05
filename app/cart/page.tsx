'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, Tag, Heart, ShieldCheck } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { CouponPreview } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, loading } = useCart();
  const { toggle: toggleWishlist } = useWishlist();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * (i.variant?.selling_price ?? i.item?.selling_price ?? 0), 0);
  const discount = couponPreview?.discount_amount || 0;
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/cart/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Invalid coupon');
      setCouponPreview(payload.preview);
    } catch (err: any) {
      setCouponPreview(null);
      setCouponError(err.message || 'Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const goToCheckout = () => {
    const query = couponPreview?.code ? `?coupon=${encodeURIComponent(couponPreview.code)}` : '';
    router.push(`/checkout${query}`);
  };

  const moveToWishlist = async (item: (typeof items)[number]) => {
    await toggleWishlist(item.item_id).catch(() => {});
    await removeItem(item.item_id, item.variant_id).catch(() => {});
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">Your cart is empty</h1>
        <p className="mt-3 text-[color:var(--ink)]/60">Browse the catalog to find something you love.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
        >
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">Your Cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* ─── Cart items ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {items.map((item) => {
            const price = item.variant?.selling_price ?? item.item?.selling_price ?? 0;
            const imageUrl = item.variant?.image_url;
            return (
              <div key={item.id} className="relative flex gap-4 rounded-xl border border-[color:var(--border)] bg-white p-4">
                <button
                  aria-label="Remove"
                  disabled={loading}
                  onClick={() => removeItem(item.item_id, item.variant_id)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink)]/40 transition-colors hover:bg-[color:var(--cream)] hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>

                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-[color:var(--cream)]">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={item.item?.name || ''} fill unoptimized className="object-cover" />
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col pr-6">
                  <p className="text-lg font-semibold text-[color:var(--ink)]">₹{formatINR(price)}</p>
                  <p className="mt-1 font-serif text-sm text-[color:var(--ink)]">{item.item?.name}</p>
                  {item.variant?.attributes && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[color:var(--ink)]/50">
                      {Object.entries(item.variant.attributes).map(([k, v]) => (
                        <span key={k}>{k}: <span className="font-medium text-[color:var(--ink)]/70">{String(v)}</span></span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/40">Qty</span>
                    <div className="flex items-center rounded-full border border-[color:var(--border)]">
                      <button
                        disabled={loading}
                        onClick={() => updateQuantity(item.item_id, item.quantity - 1, item.variant_id)}
                        className="px-3 py-1 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        disabled={loading}
                        onClick={() => updateQuantity(item.item_id, item.quantity + 1, item.variant_id)}
                        className="px-3 py-1 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => moveToWishlist(item)}
                    disabled={loading}
                    className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[color:var(--ink)]/70 transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                  >
                    <Heart size={12} /> Move to Wishlist
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Order summary ─────────────────────────────────────────────── */}
        <div className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-[color:var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--ink)]">Apply Coupon Code</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="w-full rounded-full border border-[color:var(--border)] bg-white px-3.5 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
              />
              <button
                onClick={applyCoupon}
                disabled={applyingCoupon}
                className="shrink-0 rounded-full border border-[color:var(--ink)]/20 px-4 py-2 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--ink)]/40 disabled:opacity-60"
              >
                {applyingCoupon ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
            {couponPreview && (
              <p className="mt-2 text-xs text-emerald-600">
                &quot;{couponPreview.name}&quot; applied — you save ₹{formatINR(couponPreview.discount_amount)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--ink)]">Summary</h2>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Total Price</span>
                <span className="font-medium text-[color:var(--ink)]">₹{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>−₹{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Shipping Charges</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-[color:var(--border)] pt-3 text-base font-bold text-[color:var(--ink)]">
              <span>Amount Payable</span>
              <span>₹{formatINR(total)}</span>
            </div>
          </div>

          <button
            onClick={goToCheckout}
            className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white hover:-translate-y-0.5 transition-transform"
          >
            Proceed to Checkout
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[color:var(--ink)]/40">
            <ShieldCheck size={13} /> 100% secure checkout — UPI, Cards &amp; Net Banking
          </p>
        </div>
      </div>
    </div>
  );
}
