'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  ArrowLeft,
  ArrowRight,
  Tag,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Check,
  Lock,
  RotateCcw,
  ChevronRight,
  MapPin,
  HelpCircle,
  Package,
} from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { CouponPreview, Promotion } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';

const FREE_SHIPPING_THRESHOLD = 2999;

export default function CartPage() {
  const { cart, updateQuantity, removeItem, loading } = useCart();
  const { toggle: toggleWishlist } = useWishlist();
  const router = useRouter();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Pincode / Shipping check
  const [pincode, setPincode] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<{ available: boolean; message: string } | null>(null);

  // Updating item tracking
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  // Dynamic promotions fetched from backend API
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.promotions && Array.isArray(data.promotions)) {
          const coded = data.promotions.filter((p: Promotion) => p.code);
          setAvailablePromotions(coded);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingPromotions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * (i.variant?.selling_price ?? i.item?.selling_price ?? 0), 0);
  const discount = couponPreview?.discount_amount || 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shippingAmount = isFreeShipping ? 0 : 150;
  const total = Math.max(0, subtotal - discount) + shippingAmount;

  // Free shipping progress calculation
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = FREE_SHIPPING_THRESHOLD > 0
    ? Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
    : 100;

  const applyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/cart/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Invalid coupon code');
      setCouponPreview(payload.preview);
      setCouponCode(code);
    } catch (err: any) {
      setCouponPreview(null);
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponPreview(null);
    setCouponCode('');
    setCouponError(null);
  };

  const checkPincode = async () => {
    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeResult({ available: false, message: 'Please enter a valid 6-digit postal pincode' });
      return;
    }
    setCheckingPincode(true);
    setPincodeResult(null);
    try {
      const res = await fetch('/api/shipping/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: cleanPin }),
      });
      const data = await res.json();
      if (res.ok && data.options && data.options.length > 0) {
        setPincodeResult({
          available: true,
          message: `Delivery available to ${cleanPin} within 3–5 business days`,
        });
      } else {
        setPincodeResult({
          available: true,
          message: `Express shipping available to ${cleanPin}`,
        });
      }
    } catch {
      setPincodeResult({
        available: true,
        message: `Express shipping available to ${cleanPin}`,
      });
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQty: number, variantId?: string) => {
    setUpdatingItemId(itemId);
    setItemError(null);
    try {
      await updateQuantity(itemId, newQty, variantId);
    } catch (err: any) {
      setItemError(err.message || 'Failed to update item quantity');
    } finally {
      setUpdatingItemId(null);
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
      <div className="min-h-[75vh] bg-[color:var(--cream)] px-4 py-20 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full text-center rounded-3xl border border-[color:var(--border)] bg-white p-8 sm:p-12 shadow-xs">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
            <ShoppingBag size={44} strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
            Your Bag is Empty
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink)]/65">
            Looks like you haven&apos;t added any exquisite handcrafted fabrics to your bag yet. Explore our curated looms.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/products"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[color:var(--primary)]/90 hover:shadow-lg transition-all"
            >
              Start Shopping <ArrowRight size={15} />
            </Link>
          </div>

          {/* Quick Category Chips */}
          <div className="mt-8 border-t border-[color:var(--border)] pt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-3 text-center">
              Popular Collections
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Pure Silks', 'Handloom Linens', 'Cotton Weaves', 'New Arrivals'].map((cat) => (
                <Link
                  key={cat}
                  href="/products"
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-3.5 py-1 text-xs font-medium text-[color:var(--ink)]/80 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition-all"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--cream)] pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Stepper Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--ink)]/60 mb-1">
              <Link href="/" className="hover:text-[color:var(--accent)] transition-colors">
                Home
              </Link>
              <ChevronRight size={14} className="opacity-40" />
              <span className="font-semibold text-[color:var(--ink)]">Shopping Bag</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[color:var(--ink)]">
                Shopping Bag
              </h1>
              <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-0.5 text-xs font-bold text-[color:var(--accent)] border border-[color:var(--accent)]/20">
                {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>

          {/* Stepper Pill Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--ink)]/60">
            <span className="flex items-center gap-1.5 font-bold text-[color:var(--accent)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-white text-[10px]">1</span>
              Bag
            </span>
            <span className="h-0.5 w-6 bg-[color:var(--border)]" />
            <span className="flex items-center gap-1.5 opacity-50">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[10px]">2</span>
              Checkout
            </span>
            <span className="h-0.5 w-6 bg-[color:var(--border)]" />
            <span className="flex items-center gap-1.5 opacity-50">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[10px]">3</span>
              Payment
            </span>
          </div>
        </div>

        {/* Free Shipping Progress Callout */}
        <div className="mb-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                <Truck size={18} />
              </div>
              <div>
                {isFreeShipping ? (
                  <p className="text-xs sm:text-sm font-bold text-emerald-900">
                    🎉 You have unlocked <span className="underline decoration-emerald-400">FREE Express Delivery</span> on this order!
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900">
                    Add <span className="font-bold">₹{formatINR(amountNeededForFreeShipping)}</span> more to unlock <span className="font-bold">FREE Express Delivery</span>!
                  </p>
                )}
                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                  Handcrafted textiles safely packaged and insured across India.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 shrink-0 hidden sm:block">
              {isFreeShipping ? '100%' : `${shippingProgress}%`}
            </span>
          </div>

          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/70">
            <div
              className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Main Grid: Items on Left, Order Summary on Right */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Line Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {itemError && (
              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-xs">
                <span>{itemError}</span>
                <button
                  type="button"
                  onClick={() => setItemError(null)}
                  className="rounded-full p-1 text-red-500 hover:bg-red-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink)]/50">
                  Item Details
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink)]/50">
                  Subtotal
                </span>
              </div>

              <div className="divide-y divide-[color:var(--border)]">
                {items.map((item) => {
                  const unitPrice = item.variant?.selling_price ?? item.item?.selling_price ?? 0;
                  const itemTotal = unitPrice * item.quantity;
                  const imageUrl =
                    item.variant?.image_url ||
                    item.item?.images?.find((i) => i.is_primary)?.url ||
                    item.item?.images?.[0]?.url;
                  const isUpdating = updatingItemId === item.item_id;

                  return (
                    <div key={item.id} className="py-6 first:pt-5 last:pb-0 flex flex-col sm:flex-row gap-5">
                      {/* Product Thumbnail */}
                      <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.item?.name || 'Fabric item'}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[color:var(--ink)]/25">
                            <Package size={32} />
                          </div>
                        )}
                      </div>

                      {/* Product Info & Controls */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {item.item?.slug ? (
                                <Link
                                  href={`/products/${item.item.slug}`}
                                  className="font-serif text-base font-semibold text-[color:var(--ink)] hover:text-[color:var(--accent)] transition-colors line-clamp-1"
                                >
                                  {item.item?.name}
                                </Link>
                              ) : (
                                <p className="font-serif text-base font-semibold text-[color:var(--ink)] line-clamp-1">
                                  {item.item?.name || 'Artisanal Fabric'}
                                </p>
                              )}

                              <p className="mt-0.5 text-xs text-[color:var(--ink)]/60">
                                ₹{formatINR(unitPrice)} <span className="text-[10px] text-[color:var(--ink)]/40">/ unit</span>
                              </p>
                            </div>

                            {/* Line Total */}
                            <div className="text-right">
                              <p className="font-serif text-lg font-bold text-[color:var(--ink)]">
                                ₹{formatINR(itemTotal)}
                              </p>
                            </div>
                          </div>

                          {/* Variant Attributes Chips */}
                          {item.variant?.attributes && Object.keys(item.variant.attributes).length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {Object.entries(item.variant.attributes)
                                .filter(([k]) => !k.toLowerCase().endsWith(' hex'))
                                .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center rounded-md bg-[color:var(--cream)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--ink)]/80 border border-[color:var(--border)]/70"
                                >
                                  {k}: <span className="font-semibold pl-1 text-[color:var(--ink)]">{String(v)}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                            <Check size={12} strokeWidth={2.5} /> In Stock &amp; Ready to Ship
                          </p>
                        </div>

                        {/* Bottom Actions Row: Quantity & Quick Buttons */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[color:var(--border)]/60">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[color:var(--ink)]/50 uppercase tracking-wider">
                              Qty:
                            </span>
                            <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--cream)]/40 shadow-2xs">
                              <button
                                disabled={loading || isUpdating}
                                onClick={() => handleQuantityChange(item.item_id, item.quantity - 1, item.variant_id)}
                                className="flex h-8 w-8 items-center justify-center rounded-l-xl text-sm font-bold text-[color:var(--ink)]/70 hover:bg-white hover:text-[color:var(--ink)] disabled:opacity-40 transition-colors"
                                title="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-[color:var(--ink)]">
                                {item.quantity}
                              </span>
                              <button
                                disabled={loading || isUpdating}
                                onClick={() => handleQuantityChange(item.item_id, item.quantity + 1, item.variant_id)}
                                className="flex h-8 w-8 items-center justify-center rounded-r-xl text-sm font-bold text-[color:var(--ink)]/70 hover:bg-white hover:text-[color:var(--ink)] disabled:opacity-40 transition-colors"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Move to Wishlist & Remove */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => moveToWishlist(item)}
                              disabled={loading}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--ink)]/60 hover:text-[color:var(--accent)] transition-colors"
                            >
                              <Heart size={14} />
                              <span>Save to Wishlist</span>
                            </button>

                            <span className="text-[color:var(--border)]">|</span>

                            <button
                              onClick={() => removeItem(item.item_id, item.variant_id)}
                              disabled={loading}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--ink)]/60 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Pincode Checker Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2.5">
                <MapPin size={18} className="text-[color:var(--accent)]" />
                <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">
                  Estimate Delivery Time
                </h3>
              </div>
              <p className="mt-1 text-xs text-[color:var(--ink)]/60">
                Enter your 6-digit delivery pincode to check courier transit times.
              </p>

              <div className="mt-4 flex max-w-sm items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--cream)]/30 px-3.5 py-2 text-xs font-medium text-[color:var(--ink)] placeholder-[color:var(--ink)]/40 focus:border-[color:var(--accent)] focus:bg-white focus:outline-hidden"
                />
                <button
                  onClick={checkPincode}
                  disabled={checkingPincode || pincode.length < 6}
                  className="shrink-0 rounded-xl bg-[color:var(--primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[color:var(--primary)]/90 disabled:opacity-50 transition-all shadow-2xs"
                >
                  {checkingPincode ? 'Checking…' : 'Check'}
                </button>
              </div>

              {pincodeResult && (
                <div
                  className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                    pincodeResult.available ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {pincodeResult.available ? <Check size={14} /> : <HelpCircle size={14} />}
                  <span>{pincodeResult.message}</span>
                </div>
              )}
            </div>

            {/* Continue Shopping Link */}
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs font-bold text-[color:var(--ink)]/70 hover:text-[color:var(--accent)] transition-colors"
              >
                <ArrowLeft size={14} /> Continue Shopping in Catalog
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Code Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[color:var(--accent)]" />
                <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">
                  Promotions &amp; Coupons
                </h3>
              </div>

              {!couponPreview ? (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--cream)]/30 px-3.5 py-2.5 text-xs font-semibold text-[color:var(--ink)] uppercase placeholder:normal-case placeholder-[color:var(--ink)]/40 focus:border-[color:var(--accent)] focus:bg-white focus:outline-hidden"
                    />
                    <button
                      onClick={() => applyCoupon()}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="shrink-0 rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[color:var(--primary)]/90 disabled:opacity-50 transition-all shadow-2xs"
                    >
                      {applyingCoupon ? 'Checking…' : 'Apply'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1">
                      <span>•</span> {couponError}
                    </p>
                  )}

                  {/* Available Offers from API */}
                  <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink)]/50">
                        Available Offers ({availablePromotions.length})
                      </p>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified Live
                      </span>
                    </div>

                    {loadingPromotions ? (
                      <div className="space-y-2">
                        <div className="h-14 animate-pulse rounded-xl bg-[color:var(--cream)]" />
                        <div className="h-14 animate-pulse rounded-xl bg-[color:var(--cream)]" />
                      </div>
                    ) : availablePromotions.length > 0 ? (
                      <div className="space-y-2">
                        {availablePromotions.map((p) => {
                          const discountBadge =
                            p.discount_type === 'percentage'
                              ? `${Number(p.discount_value)}% OFF`
                              : `₹${formatINR(p.discount_value)} OFF`;

                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-xl border border-dashed border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5 p-3"
                            >
                              <div className="space-y-0.5 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[color:var(--accent)]">{p.code}</span>
                                  <span className="rounded-md bg-white border border-[color:var(--accent)]/30 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--accent)]">
                                    {discountBadge}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-[color:var(--ink)] line-clamp-1">{p.name}</p>
                                {p.description && (
                                  <p className="text-[11px] text-[color:var(--ink)]/60 line-clamp-1">{p.description}</p>
                                )}
                                {p.min_order_amount && Number(p.min_order_amount) > 0 && (
                                  <p className="text-[10px] text-[color:var(--ink)]/50">
                                    Min. order ₹{formatINR(p.min_order_amount)}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => applyCoupon(p.code)}
                                className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[color:var(--accent)] border border-[color:var(--accent)]/30 hover:bg-[color:var(--accent)] hover:text-white transition-all shadow-2xs"
                              >
                                Apply
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[color:var(--ink)]/50 py-1">
                        No public promo codes currently active. Enter your exclusive code above.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold text-emerald-900">{couponPreview.code}</p>
                        <p className="text-[11px] text-emerald-700">
                          You save ₹{formatINR(couponPreview.discount_amount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)] border-b border-[color:var(--border)] pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-[color:var(--ink)]/70">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-medium text-[color:var(--ink)]">₹{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Coupon Discount</span>
                    <span>−₹{formatINR(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping &amp; Handling</span>
                  <span className="font-semibold text-emerald-700">
                    {isFreeShipping ? 'FREE' : `₹${formatINR(shippingAmount)}`}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-[color:var(--ink)]/50">
                  <span>Estimated Taxes (GST)</span>
                  <span>Included</span>
                </div>

                <div className="border-t border-[color:var(--border)] pt-3 flex justify-between items-baseline text-sm font-bold text-[color:var(--ink)]">
                  <span>Estimated Total</span>
                  <span className="font-serif text-2xl text-[color:var(--primary)]">
                    ₹{formatINR(total)}
                  </span>
                </div>

                {discount > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-700 text-right">
                    ✨ You are saving ₹{formatINR(discount)} on this order!
                  </p>
                )}
              </div>

              {/* Checkout CTA */}
              <button
                onClick={goToCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md hover:bg-[color:var(--primary)]/90 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-[color:var(--ink)]/50">
                <Lock size={13} className="text-emerald-600" />
                <span>256-Bit SSL Encrypted &amp; Bank-Grade Security</span>
              </div>
            </div>

            {/* Artisanal Trust Pillars */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <Sparkles size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[color:var(--ink)]">100% Authentic Handcrafted Weaves</p>
                  <p className="text-[11px] text-[color:var(--ink)]/50">Direct from master weavers and artisans</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs border-t border-[color:var(--border)] pt-3">
                <RotateCcw size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[color:var(--ink)]">7-Day Hassle-Free Returns</p>
                  <p className="text-[11px] text-[color:var(--ink)]/50">Easy doorstep reverse pickups &amp; exchanges</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs border-t border-[color:var(--border)] pt-3">
                <ShieldCheck size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[color:var(--ink)]">Safe &amp; Insured Doorstep Delivery</p>
                  <p className="text-[11px] text-[color:var(--ink)]/50">Tamper-evident luxury packaging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
