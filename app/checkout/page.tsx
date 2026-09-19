'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  ShoppingBag,
  Check,
  Truck,
  CreditCard,
  Lock,
  ShieldCheck,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Receipt,
  Sparkles,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCart } from '@/app/contexts/CartContext';
import { ShippingOption, CouponPreview, AddressDetails } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';
import { INDIAN_STATES, COUNTRIES } from '@/lib/addressData';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import AddressBook from './AddressBook';
import AuthModal from '@/app/components/AuthModal';

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function CheckoutForm() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponFromUrl = searchParams.get('coupon') || '';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');

  // Address state
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [phone, setPhone] = useState(user?.phone || '');

  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // GST details
  const [showGstField, setShowGstField] = useState(false);
  const [gstin, setGstin] = useState('');

  // Payment
  const paymentMethod = 'online';
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Shipping estimate
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingChecked, setShippingChecked] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Coupons
  const [couponCodeInput, setCouponCodeInput] = useState(couponFromUrl);
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(Boolean(couponFromUrl));
  const [couponError, setCouponError] = useState<string | null>(null);

  // Mobile Order Summary accordion toggle
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, i) => sum + i.quantity * (i.variant?.selling_price ?? i.item?.selling_price ?? 0),
    0
  );

  const selectedOption = shippingOptions.find((o) => o.optionId === selectedOptionId) || null;
  const shippingCost = selectedOption?.rate || 0;
  const discountAmount = couponPreview?.discount_amount || 0;
  const total = Math.max(0, subtotal - discountAmount) + shippingCost;
  const activePhone = phone || user?.phone || '';

  // If coupon was passed from cart URL, validate & apply automatically on mount
  useEffect(() => {
    if (!couponFromUrl) return;
    let active = true;
    fetch('/api/cart/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponFromUrl.trim().toUpperCase() }),
    })
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        if (payload?.preview) {
          setCouponPreview(payload.preview);
          setCouponCodeInput(payload.preview.code || couponFromUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCouponLoading(false);
      });

    return () => {
      active = false;
    };
  }, [couponFromUrl]);

  // Shipping estimation on pincode change
  useEffect(() => {
    if (!/^\d{6}$/.test(address.pincode)) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      setShippingLoading(true);
      fetch('/api/shipping/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: address.pincode }),
      })
        .then((res) => res.json())
        .then((payload) => {
          if (!isMounted) return;
          const options = (payload.options || []) as ShippingOption[];
          setShippingOptions(options);
          if (options.length > 0) {
            setSelectedOptionId((prev) => (prev && options.some((o) => o.optionId === prev) ? prev : options[0].optionId));
          } else {
            setSelectedOptionId(null);
          }
        })
        .catch(() => {
          if (isMounted) {
            setShippingOptions([]);
            setSelectedOptionId(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setShippingLoading(false);
            setShippingChecked(true);
          }
        });
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [address.pincode]);

  const handleAddressSelect = useCallback((details: AddressDetails) => {
    setAddress({
      line1: details.line1,
      line2: details.line2 || '',
      city: details.city,
      state: details.state,
      pincode: details.pincode,
      country: details.country || 'India',
    });
    if (details.phone) setPhone(details.phone);
  }, []);

  const handleValidateCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/cart/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Invalid or expired coupon');
      setCouponPreview(payload.preview);
      setCouponCodeInput(payload.preview.code || code);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid coupon';
      setCouponPreview(null);
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponPreview(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhone || activePhone.trim().length < 10) {
      setError('Please provide a valid 10-digit delivery phone number');
      return;
    }
    if (shippingOptions.length > 0 && !selectedOptionId) {
      setError('Please choose a preferred delivery method');
      return;
    }
    setError(null);
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const activeCoupon = couponPreview?.code || couponCodeInput.trim() || undefined;

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: address,
          phone: activePhone.trim() || undefined,
          coupon_code: activeCoupon,
          shipping_option_id: selectedOptionId || (shippingOptions.length > 0 ? shippingOptions[0].optionId : undefined),
          gstin: gstin.trim() || undefined,
          payment_method: paymentMethod,
          ...(!user && {
            guest_name: guestName.trim(),
            guest_email: guestEmail.trim() || undefined,
            guest_phone: activePhone.trim(),
          }),
        }),
      });

      const checkoutPayload = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutPayload?.error || 'Failed to place order');
      const order = checkoutPayload.order;

      // Online payment via Razorpay
      const initiateRes = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const initiatePayload = await initiateRes.json();
      if (!initiateRes.ok) {
        if (/no active payment gateway/i.test(initiatePayload?.error || '')) {
          throw new Error(
            'Online payment gateway is temporarily unavailable for this store. Please try again shortly or contact customer support.'
          );
        }
        throw new Error(initiatePayload?.error || 'Failed to start payment');
      }
      const payment = initiatePayload.payment;

      if (!scriptReady || !window.Razorpay) {
        throw new Error('Payment gateway is still initializing — please tap again in a moment.');
      }

      const rzp = new window.Razorpay({
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.razorpay_order_id,
        name: 'Sanctum Fabrics',
        description: `Order ${order.so_number}`,
        prefill: {
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : guestName,
          email: user?.email || guestEmail || undefined,
          contact: activePhone,
        },
        theme: {
          color: '#2b3a67',
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyPayload = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyPayload?.error || 'Payment verification failed');
            await refresh();
            router.push(`/order-success?orderId=${order.id}&method=online`);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Payment verification failed';
            setError(message);
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-[color:var(--border)] bg-white p-10 text-center shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--cream)] text-[color:var(--accent)]">
          <ShoppingBag size={28} />
        </div>
        <h2 className="mt-5 font-serif text-2xl text-[color:var(--ink)]">Your shopping bag is empty</h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink)]/60">
          Discover our curated collection of authentic handlooms, pure mulberry silks, and hand-block prints.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5"
        >
          Explore Catalog <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 outline-none transition-all focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10';

  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/70 mb-1.5';

  return (
    <div className="mx-auto max-w-6xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />

      {/* ─── Luxury 2-Step Progress Stepper ────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Step 1 Item */}
          <button
            type="button"
            onClick={() => setStep('details')}
            className={`group flex items-center gap-3 text-left transition-colors ${
              step === 'details' ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step === 'details'
                  ? 'bg-[color:var(--primary)] text-white ring-4 ring-[color:var(--primary)]/15 shadow-sm'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {step === 'payment' ? <Check size={18} /> : '1'}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50">Step 1</p>
              <p
                className={`text-sm font-medium sm:text-base ${
                  step === 'details' ? 'font-bold text-[color:var(--ink)]' : 'text-[color:var(--ink)]/80 group-hover:text-[color:var(--accent)]'
                }`}
              >
                Shipping Details
              </p>
            </div>
          </button>

          {/* Stepper Connector Bar */}
          <div className="relative mx-2 flex-1 hidden sm:block">
            <div className="h-0.5 w-full bg-[color:var(--border)]" />
            <div
              className={`absolute top-0 left-0 h-0.5 bg-[color:var(--primary)] transition-all duration-500 ${
                step === 'payment' ? 'w-full' : 'w-1/2'
              }`}
            />
          </div>

          {/* Step 2 Item */}
          <div
            className={`flex items-center gap-3 text-left ${
              step === 'payment' ? 'cursor-default' : 'opacity-60'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step === 'payment'
                  ? 'bg-[color:var(--primary)] text-white ring-4 ring-[color:var(--primary)]/15 shadow-sm'
                  : 'border border-[color:var(--border)] bg-[color:var(--cream)] text-[color:var(--ink)]/50'
              }`}
            >
              2
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50">Step 2</p>
              <p
                className={`text-sm font-medium sm:text-base ${
                  step === 'payment' ? 'font-bold text-[color:var(--ink)]' : 'text-[color:var(--ink)]/70'
                }`}
              >
                Review & Payment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Collapsible Order Summary Drawer ─────────────────────────── */}
      <div className="mb-6 block rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-xs lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <ShoppingBag size={18} className="text-[color:var(--accent)]" />
            <span>{mobileSummaryOpen ? 'Hide' : 'Show'} order summary ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            {mobileSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="font-serif text-base font-bold text-[color:var(--ink)]">₹{formatINR(total)}</span>
        </button>

        {mobileSummaryOpen && (
          <div className="mt-4 pt-4 border-t border-[color:var(--border)] space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const price = item.variant?.selling_price ?? item.item?.selling_price ?? 0;
                const imageUrl = item.variant?.image_url;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[color:var(--cream)] border border-[color:var(--border)]">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={item.item?.name || ''} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[color:var(--ink)]/30">
                          <ShoppingBag size={18} />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[color:var(--ink)] text-[10px] font-bold text-white shadow-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-[color:var(--ink)]">{item.item?.name}</p>
                      <p className="text-[11px] text-[color:var(--ink)]/50">Qty {item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-[color:var(--ink)]">₹{formatINR(item.quantity * price)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-[color:var(--border)] pt-3 text-xs">
              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Subtotal</span>
                <span>₹{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({couponPreview?.code})</span>
                  <span>−₹{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Shipping</span>
                <span>{shippingCost > 0 ? `₹${formatINR(shippingCost)}` : 'Free'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[color:var(--ink)] pt-1 border-t border-[color:var(--border)]">
                <span>Total Amount</span>
                <span>₹{formatINR(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Two-Column Layout ─────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
        {/* Left Column: Form Steps */}
        <div>
          {authModalOpen && (
            <AuthModal
              onClose={() => setAuthModalOpen(false)}
              subtitle="Sign in to save your address, track your shipments, and complete your order seamlessly."
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 1: DETAILS & SHIPPING
             ═══════════════════════════════════════════════════════════════════ */}
          {step === 'details' && (
            <form onSubmit={handleContinueToPayment} className="space-y-6">
              {/* Guest / Account Callout */}
              {!user ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-[color:var(--border)] bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4.5 text-sm shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[color:var(--accent)] uppercase tracking-wider">Fast Mobile Sign In</p>
                      <p className="text-xs sm:text-sm text-[color:var(--ink)]/80">
                        Sign in to save your address, track your shipments, and complete your order seamlessly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] px-4.5 py-2.5 text-xs font-semibold text-white hover:bg-[color:var(--primary)]/90 transition-all self-start sm:self-auto shadow-xs"
                  >
                    <span>Sign in for faster checkout</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white p-4 text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--primary)] text-white text-xs font-semibold">
                      {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--ink)]">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-[color:var(--ink)]/50">{user.email || user.phone}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <Check size={12} /> Logged In
                  </span>
                </div>
              )}

              {/* Saved Addresses (Logged in) */}
              {user && (
                <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
                  <AddressBook onSelect={handleAddressSelect} />
                </div>
              )}

              {/* Guest Contact Details */}
              {!user && (
                <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <Mail size={18} className="text-[color:var(--accent)]" />
                    <h2 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Contact Information</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input
                        required
                        placeholder="e.g. Ananya Sharma"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Email (For Order Updates)</label>
                      <input
                        type="email"
                        placeholder="ananya@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address Form */}
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                  <MapPin size={18} className="text-[color:var(--accent)]" />
                  <h2 className="font-serif text-lg font-semibold text-[color:var(--ink)]">
                    {user ? 'Delivery Address' : 'Shipping Address'}
                  </h2>
                </div>

                <div>
                  <label className={labelCls}>Flat / House / Building / Street *</label>
                  <input
                    required
                    placeholder="e.g. Flat 402, Lotus Enclave, 14th Main Road"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Landmark / Area (Optional)</label>
                  <input
                    placeholder="e.g. Near Indiranagar Metro Station"
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>City *</label>
                    <input
                      required
                      placeholder="e.g. Bengaluru"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <select
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className={inputCls}
                    >
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>6-Digit Pincode *</label>
                    <div className="relative">
                      <input
                        required
                        placeholder="e.g. 560038"
                        maxLength={6}
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                        className={inputCls}
                      />
                      {shippingLoading && (
                        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-xs text-[color:var(--accent)]">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <select
                      required
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      className={inputCls}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Delivery Contact Phone *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-semibold text-[color:var(--ink)]/50">+91</span>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={activePhone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className={`${inputCls} pl-14`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[color:var(--ink)]/40">Used exclusively by the courier for delivery coordinates &amp; OTP.</p>
                </div>

                {/* Delivery Options Selector */}
                {/^\d{6}$/.test(address.pincode) && (
                  <div className="pt-3 border-t border-[color:var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck size={17} className="text-[color:var(--accent)]" />
                      <h3 className="font-serif text-sm font-semibold text-[color:var(--ink)]">Delivery Method</h3>
                    </div>

                    {shippingLoading && (
                      <div className="flex items-center gap-2 rounded-xl bg-[color:var(--cream)] p-4 text-xs text-[color:var(--ink)]/60">
                        <Loader2 size={15} className="animate-spin text-[color:var(--accent)]" />
                        Checking available courier partners for pincode {address.pincode}…
                      </div>
                    )}

                    {!shippingLoading && shippingChecked && shippingOptions.length === 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800">
                        Standard courier delivery will be assigned automatically for pincode {address.pincode}.
                      </div>
                    )}

                    {!shippingLoading && shippingOptions.length > 0 && (
                      <div className="space-y-2.5">
                        {shippingOptions.map((option) => {
                          const isSelected = selectedOptionId === option.optionId;
                          return (
                            <label
                              key={option.optionId}
                              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                                isSelected
                                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5 ring-1 ring-[color:var(--accent)] shadow-xs'
                                  : 'border-[color:var(--border)] bg-white hover:border-[color:var(--ink)]/30'
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="shipping_option"
                                  checked={isSelected}
                                  onChange={() => setSelectedOptionId(option.optionId)}
                                  className="accent-[color:var(--accent)] h-4 w-4"
                                />
                                <span>
                                  <span className="block text-sm font-semibold text-[color:var(--ink)]">{option.label}</span>
                                  {option.etaDays ? (
                                    <span className="text-xs text-[color:var(--ink)]/50">
                                      Estimated transit: {option.etaDays} business {option.etaDays === 1 ? 'day' : 'days'}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              <span className="text-sm font-bold">
                                {option.rate > 0 ? `₹${formatINR(option.rate)}` : (
                                  <span className="text-emerald-600 font-bold">FREE</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Business GSTIN */}
                <div className="pt-2 border-t border-[color:var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowGstField(!showGstField)}
                    className="flex items-center gap-2 text-xs font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    <Building2 size={14} />
                    <span>{showGstField ? 'Hide GST invoice details' : '+ Add GSTIN for Business Tax Invoice (Optional)'}</span>
                  </button>

                  {showGstField && (
                    <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]/40 p-4 space-y-2">
                      <label className={labelCls}>GSTIN Number</label>
                      <input
                        placeholder="e.g. 29AAAAA0000A1Z5"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        maxLength={15}
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[color:var(--ink)]/50">
                        A tax compliant B2B invoice with your GST number will be generated upon checkout.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5"
              >
                <span>Continue to Payment</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 2: REVIEW & PAYMENT
             ═══════════════════════════════════════════════════════════════════ */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Deliver To Review Box */}
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[color:var(--accent)]" />
                    <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Deliver To</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="rounded-full border border-[color:var(--border)] px-3.5 py-1 text-xs font-semibold text-[color:var(--accent)] hover:border-[color:var(--accent)] transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[color:var(--ink)]/80">
                  {((user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : guestName) || user?.first_name || guestName) && (
                    <div className="flex items-center gap-2 font-semibold text-[color:var(--ink)]">
                      <User size={15} className="text-[color:var(--accent)] shrink-0" />
                      <span>
                        {(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : guestName) || user?.first_name || guestName}
                      </span>
                    </div>
                  )}
                  <p className="leading-relaxed">
                    {[address.line1, address.line2, address.city, address.state, address.pincode, address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[color:var(--ink)]/60 pt-2 border-t border-[color:var(--border)]/60">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-[color:var(--accent)]" /> {activePhone}
                    </span>
                    {(user?.email || guestEmail) && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-[color:var(--accent)]" /> {user?.email || guestEmail}
                      </span>
                    )}
                    {selectedOption && (
                      <span className="flex items-center gap-1.5">
                        <Truck size={13} className="text-[color:var(--accent)]" /> {selectedOption.label}
                      </span>
                    )}
                    {gstin && (
                      <span className="flex items-center gap-1.5">
                        <Receipt size={13} className="text-[color:var(--accent)]" /> GSTIN: {gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                  <CreditCard size={18} className="text-[color:var(--accent)]" />
                  <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Payment Method</h3>
                </div>

                <div className="mt-4">
                  {/* Online Payment Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[color:var(--accent)] bg-[color:var(--accent)]/5 ring-1 ring-[color:var(--accent)] p-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[color:var(--ink)]">Pay Online</span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Instant &amp; Secure
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[color:var(--ink)]/60">
                          UPI (GPay, PhonePe, Paytm), Credit &amp; Debit Cards, Net Banking
                        </p>
                      </div>
                    </div>
                    {/* Payment badges */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--ink)]/40 pl-8 sm:pl-0">
                      <span className="rounded border border-[color:var(--border)] bg-white px-2 py-0.5">UPI</span>
                      <span className="rounded border border-[color:var(--border)] bg-white px-2 py-0.5">Cards</span>
                      <span className="rounded border border-[color:var(--border)] bg-white px-2 py-0.5">NetBanking</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[color:var(--cream)]/60 p-3 text-xs text-[color:var(--ink)]/60">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Your transaction is secured with 256-bit bank-grade encryption via Razorpay.</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-6 py-4 text-sm font-semibold text-[color:var(--ink)]/70 hover:border-[color:var(--ink)]/40 transition-colors"
                >
                  <ArrowLeft size={16} /> Back to Details
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="flex flex-1 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {placing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Order…</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Pay ₹{formatINR(total)} Securely</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            Right Column: Order Summary & Coupon (Desktop Sticky)
           ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-5 lg:sticky lg:top-8 self-start">
          {/* Summary Box */}
          <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
              <h2 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Order Summary</h2>
              <span className="text-xs font-semibold text-[color:var(--ink)]/50">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Product items preview */}
            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => {
                const price = item.variant?.selling_price ?? item.item?.selling_price ?? 0;
                const imageUrl = item.variant?.image_url;
                return (
                  <div key={item.id} className="flex items-center gap-3.5">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-[color:var(--cream)] border border-[color:var(--border)]">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={item.item?.name || ''} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[color:var(--ink)]/30">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--ink)] text-[11px] font-bold text-white shadow-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--ink)]">{item.item?.name}</p>
                      {item.variant?.attributes && Object.keys(item.variant.attributes).length > 0 && (
                        <p className="truncate text-xs text-[color:var(--ink)]/50 mt-0.5">
                          {Object.entries(item.variant.attributes)
                            .filter(([k]) => !k.toLowerCase().endsWith(' hex'))
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-[color:var(--ink)]/40 mt-0.5">₹{formatINR(price)} each</p>
                    </div>
                    <span className="text-sm font-semibold text-[color:var(--ink)] shrink-0">
                      ₹{formatINR(item.quantity * price)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="mt-5 border-t border-[color:var(--border)] pt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag size={14} className="text-[color:var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/70">
                  Discount Coupon
                </span>
              </div>

              {couponPreview ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                        {couponPreview.code} applied
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        You save ₹{formatINR(couponPreview.discount_amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    aria-label="Remove coupon"
                    className="rounded-full p-1 text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="Enter promo code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider outline-none focus:border-[color:var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleValidateCoupon()}
                      disabled={couponLoading || !couponCodeInput.trim()}
                      className="shrink-0 rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:bg-[color:var(--primary)]/90 disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="mt-5 space-y-2.5 border-t border-[color:var(--border)] pt-4 text-sm">
              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Items Subtotal</span>
                <span className="font-medium text-[color:var(--ink)]">₹{formatINR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag size={13} /> Coupon Discount
                  </span>
                  <span>−₹{formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[color:var(--ink)]/70">
                <span>Shipping ({selectedOption ? selectedOption.label : 'Standard'})</span>
                <span>
                  {shippingCost > 0 ? (
                    <span className="font-medium text-[color:var(--ink)]">₹{formatINR(shippingCost)}</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">FREE</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-t border-[color:var(--border)] pt-3 text-base">
                <span className="font-serif font-bold text-[color:var(--ink)]">Total Payable</span>
                <span className="font-serif text-xl font-bold text-[color:var(--ink)]">
                  ₹{formatINR(total)}
                </span>
              </div>
              <p className="text-right text-[11px] text-[color:var(--ink)]/40">Includes all applicable GST</p>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--cream)]/60 p-5 space-y-3 text-xs">
            <div className="flex items-start gap-2.5 text-[color:var(--ink)]/80">
              <Sparkles size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[color:var(--ink)]">100% Authentic Handpicked Fabrics</p>
                <p className="text-[11px] text-[color:var(--ink)]/60">Sourced directly from certified artisan clusters across India.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-[color:var(--ink)]/80">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[color:var(--ink)]">Safe &amp; Encrypted Checkout</p>
                <p className="text-[11px] text-[color:var(--ink)]/60">Protected by industry-standard 256-bit SSL encryption.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[color:var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[color:var(--ink)]/50">Questions about your order?</span>
              <a
                href={buildWhatsAppLink("Hi Sanctum Fabrics, I have a question about my order checkout.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
              >
                <MessageCircle size={13} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[color:var(--border)] pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-[color:var(--ink)]">Checkout</h1>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--accent)] hover:underline"
        >
          <ArrowLeft size={13} /> Return to Shopping Bag
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 text-[color:var(--ink)]/50">
            <Loader2 size={32} className="animate-spin text-[color:var(--accent)]" />
            <p className="mt-3 text-sm">Preparing your checkout experience…</p>
          </div>
        }
      >
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
