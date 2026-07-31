'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCart } from '@/app/contexts/CartContext';
import { ShippingOption } from '@/lib/dristaService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]';

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-[color:var(--border)] bg-white p-6">
      <div className="mb-5 flex gap-4 border-b border-[color:var(--border)]">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`pb-3 text-sm font-semibold uppercase tracking-wide ${
              mode === m ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--ink)]' : 'text-[color:var(--ink)]/40'
            }`}
          >
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
            <input required placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
          </div>
        )}
        {mode === 'register' && (
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account & Continue'}
        </button>
      </form>
    </div>
  );
}

function CheckoutForm() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponFromCart = searchParams.get('coupon') || '';

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
  const [gstin, setGstin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingChecked, setShippingChecked] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * (i.variant?.selling_price ?? i.item?.selling_price ?? 0), 0);
  const selectedOption = shippingOptions.find((o) => o.optionId === selectedOptionId) || null;
  const total = subtotal + (selectedOption?.rate || 0);

  // Preview only — checkout recomputes the chosen option itself server-side
  // from the real address, so a stale/tampered rate here can't affect what's
  // actually charged. Silently shows no options if the lookup fails (e.g. the
  // store hasn't set up any delivery method yet) rather than an error.
  useEffect(() => {
    setShippingOptions([]);
    setSelectedOptionId(null);
    setShippingChecked(false);
    if (!/^\d{6}$/.test(address.pincode)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setShippingLoading(true);
      fetch('/api/shipping/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: address.pincode }),
      })
        .then((res) => res.json())
        .then((payload) => {
          const options = (payload.options || []) as ShippingOption[];
          setShippingOptions(options);
          if (options.length > 0) setSelectedOptionId(options[0].optionId);
        })
        .catch(() => {})
        .finally(() => {
          setShippingLoading(false);
          setShippingChecked(true);
        });
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address.pincode]);

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingOptions.length > 0 && !selectedOptionId) {
      setError('Please choose a delivery method');
      return;
    }
    setError(null);
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: address,
          coupon_code: couponFromCart || undefined,
          shipping_option_id: selectedOptionId || undefined,
          gstin: gstin.trim() || undefined,
          payment_method: paymentMethod,
        }),
      });
      const checkoutPayload = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutPayload?.error || 'Failed to place order');
      const order = checkoutPayload.order;

      // Cash on Delivery has no online payment step — the order is already
      // fully placed (confirmed + billed) the moment checkout succeeds.
      if (paymentMethod === 'cod') {
        await refresh();
        router.push(`/order-success?orderId=${order.id}`);
        return;
      }

      const initiateRes = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const initiatePayload = await initiateRes.json();
      if (!initiateRes.ok) {
        // The store hasn't got an online gateway switched on — Cash on Delivery
        // is still available, so switch the form to it instead of a dead end.
        // (This particular order stays as an unpaid 'online' order — placing
        // again below creates a fresh order under the COD method.)
        if (/no active payment gateway/i.test(initiatePayload?.error || '')) {
          setPaymentMethod('cod');
          throw new Error('Online payment isn\'t available for this store right now. We\'ve switched you to Cash on Delivery — please place your order again.');
        }
        throw new Error(initiatePayload?.error || 'Failed to start payment');
      }
      const payment = initiatePayload.payment;

      if (!scriptReady || !window.Razorpay) throw new Error('Payment gateway is still loading — please try again in a moment.');

      const rzp = new window.Razorpay({
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.razorpay_order_id,
        name: 'Sanctum',
        description: `Order ${order.so_number}`,
        prefill: { name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(), email: user?.email, contact: user?.phone },
        handler: async (response: any) => {
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
            router.push(`/order-success?orderId=${order.id}`);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setPlacing(false);
    }
  };

  if (!user) return <AuthPanel />;
  if (items.length === 0) {
    return <p className="text-center text-[color:var(--ink)]/60">Your cart is empty.</p>;
  }

  const inputCls = 'w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]';

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />

      <div>
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink)]/40">
          <span className={step === 'details' ? 'text-[color:var(--accent)]' : ''}>1. Details</span>
          <span>→</span>
          <span className={step === 'payment' ? 'text-[color:var(--accent)]' : ''}>2. Payment</span>
        </div>

        {step === 'details' && (
          <form onSubmit={handleContinueToPayment} className="space-y-3">
            <h2 className="font-serif text-xl text-[color:var(--ink)]">Shipping Address</h2>
            <input required placeholder="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className={inputCls} />
            <input placeholder="Address line 2 (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={inputCls} />
              <input required placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className={inputCls} />
            </div>
            <input required placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className={inputCls} />

            {/^\d{6}$/.test(address.pincode) && (
              <div className="pt-2">
                <h3 className="mb-2 text-sm font-semibold text-[color:var(--ink)]">Delivery Method</h3>
                {shippingLoading && <p className="text-xs text-[color:var(--ink)]/50">Checking delivery options…</p>}
                {!shippingLoading && shippingChecked && shippingOptions.length === 0 && (
                  <p className="text-xs text-[color:var(--ink)]/50">No delivery method is available for this pincode yet.</p>
                )}
                {!shippingLoading && shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.optionId}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                          selectedOptionId === option.optionId
                            ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5'
                            : 'border-[color:var(--border)]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shipping_option"
                            checked={selectedOptionId === option.optionId}
                            onChange={() => setSelectedOptionId(option.optionId)}
                          />
                          <span>
                            {option.label}
                            {option.etaDays ? <span className="text-[color:var(--ink)]/50"> · {option.etaDays} day{option.etaDays > 1 ? 's' : ''}</span> : null}
                          </span>
                        </span>
                        <span className="font-semibold">{option.rate > 0 ? `₹${option.rate.toLocaleString('en-IN')}` : 'Free'}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <h3 className="mb-1 text-sm font-semibold text-[color:var(--ink)]">Business / GST Details</h3>
              <p className="mb-2 text-xs text-[color:var(--ink)]/50">Optional — only needed if you want a GST invoice for a registered business.</p>
              <input placeholder="GSTIN (optional)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className={inputCls} maxLength={15} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
            >
              Continue to Payment
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white p-5 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[color:var(--ink)]">Deliver To</h3>
                <button onClick={() => setStep('details')} className="text-xs font-semibold text-[color:var(--accent)] hover:underline">Edit</button>
              </div>
              <p className="mt-2 text-[color:var(--ink)]/70">
                {[address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
              </p>
              {selectedOption && <p className="mt-2 text-[color:var(--ink)]/70">Delivery: {selectedOption.label}</p>}
              {gstin && <p className="mt-2 text-[color:var(--ink)]/70">GSTIN: {gstin}</p>}
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[color:var(--ink)]">Payment Method</h3>
              <div className="space-y-2">
                {([
                  { value: 'online', label: 'Pay Online', sub: 'UPI, Cards & Net Banking' },
                  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                      paymentMethod === opt.value ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5' : 'border-[color:var(--border)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                    />
                    <span>
                      <span className="font-medium text-[color:var(--ink)]">{opt.label}</span>
                      <span className="ml-2 text-[color:var(--ink)]/50">{opt.sub}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {placing ? 'Processing…' : paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Place Order & Pay'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6">
        <h2 className="font-serif text-xl text-[color:var(--ink)]">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-[color:var(--ink)]/70">
              <span>{item.item?.name} × {item.quantity}</span>
              <span>₹{(item.quantity * (item.variant?.selling_price ?? item.item?.selling_price ?? 0)).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-[color:var(--border)] pt-3 text-sm">
          <div className="flex justify-between text-[color:var(--ink)]/70">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {selectedOption && (
            <div className="flex justify-between text-[color:var(--ink)]/70">
              <span>Shipping ({selectedOption.label})</span>
              <span>{selectedOption.rate > 0 ? `₹${selectedOption.rate.toLocaleString('en-IN')}` : 'Free'}</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 text-base font-semibold text-[color:var(--ink)]">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-[color:var(--ink)]/40">Plus applicable GST, calculated at checkout.</p>
        </div>
        {address.pincode.length > 0 && !/^\d{6}$/.test(address.pincode) && (
          <p className="mt-2 text-xs text-[color:var(--ink)]/40">Enter a 6-digit pincode to see the shipping estimate.</p>
        )}
        {couponFromCart && <p className="mt-2 text-xs text-[color:var(--ink)]/50">Coupon "{couponFromCart}" will be applied at checkout.</p>}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="mb-8 font-serif text-3xl text-[color:var(--ink)]">Checkout</h1>
      <Suspense fallback={null}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
