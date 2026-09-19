'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  // Cash on Delivery reaches this same page with no online payment ever having
  // happened — claiming "your payment was successful" there would be false.
  const isCod = searchParams.get('method') === 'cod';

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
      <h1 className="mt-6 font-serif text-3xl text-[color:var(--ink)]">Thank you for your order!</h1>
      <p className="mt-3 text-[color:var(--ink)]/60">
        {isCod ? 'Your order is confirmed — pay in cash when it arrives.' : 'Your payment was successful and your order is confirmed.'}
        {orderId && <> Order reference: <span className="font-mono text-sm">{orderId.slice(0, 8).toUpperCase()}</span></>}
      </p>
      <p className="mt-2 text-sm text-[color:var(--ink)]/50">We&apos;ll reach out with delivery details shortly.</p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
        >
          Continue Shopping
        </Link>
        {orderId && (
          <Link
            href={`/orders/${orderId}`}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)]/20 px-6 py-3 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--ink)]/40"
          >
            View Order
          </Link>
        )}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
