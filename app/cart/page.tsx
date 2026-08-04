'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, Tag } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { CouponPreview } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, loading } = useCart();
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
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">Your Cart</h1>

      <div className="mt-8 divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
        {items.map((item) => {
          const price = item.variant?.selling_price ?? item.item?.selling_price ?? 0;
          const imageUrl = item.variant?.image_url;
          return (
            <div key={item.id} className="flex items-center gap-4 py-5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[color:var(--cream)]">
                {imageUrl ? (
                  <Image src={imageUrl} alt={item.item?.name || ''} fill unoptimized className="object-cover" />
                ) : null}
              </div>

              <div className="flex-1">
                <p className="font-medium text-[color:var(--ink)]">{item.item?.name}</p>
                {item.variant?.attributes && (
                  <p className="mt-0.5 text-xs text-[color:var(--ink)]/50">
                    {Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <p className="mt-1 text-sm text-[color:var(--ink)]/70">₹{formatINR(price)}</p>
              </div>

              <div className="flex items-center rounded-full border border-[color:var(--border)]">
                <button
                  disabled={loading}
                  onClick={() => updateQuantity(item.item_id, item.quantity - 1, item.variant_id)}
                  className="px-3 py-1.5 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  disabled={loading}
                  onClick={() => updateQuantity(item.item_id, item.quantity + 1, item.variant_id)}
                  className="px-3 py-1.5 text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                >
                  +
                </button>
              </div>

              <p className="w-24 text-right text-sm font-semibold text-[color:var(--ink)]">
                ₹{formatINR(price * item.quantity)}
              </p>

              <button
                aria-label="Remove"
                disabled={loading}
                onClick={() => removeItem(item.item_id, item.variant_id)}
                className="text-[color:var(--ink)]/40 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4">
        <div className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
          <div className="relative flex-1">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="w-full rounded-full border border-[color:var(--border)] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <button
            onClick={applyCoupon}
            disabled={applyingCoupon}
            className="rounded-full border border-[color:var(--ink)]/20 px-4 py-2 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--ink)]/40 disabled:opacity-60"
          >
            {applyingCoupon ? 'Checking…' : 'Apply'}
          </button>
        </div>
        {couponError && <p className="text-sm text-red-500">{couponError}</p>}
        {couponPreview && <p className="text-sm text-emerald-600">"{couponPreview.name}" applied — you save ₹{formatINR(couponPreview.discount_amount)}</p>}

        <div className="w-full max-w-sm space-y-1.5 text-sm">
          <div className="flex justify-between text-[color:var(--ink)]/70">
            <span>Subtotal</span>
            <span>₹{formatINR(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>−₹{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[color:var(--border)] pt-2 text-base font-semibold text-[color:var(--ink)]">
            <span>Total</span>
            <span>₹{formatINR(total)}</span>
          </div>
        </div>

        <button
          onClick={goToCheckout}
          className="w-full max-w-sm rounded-full bg-[color:var(--primary)] px-6 py-3 text-center text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
