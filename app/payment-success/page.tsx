'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PaymentSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = new URLSearchParams(searchParams.toString());
    if (!query.get('method')) {
      query.set('method', 'online');
    }
    router.replace(`/order-success?${query.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="text-[color:var(--ink)]/60">Processing your order confirmation...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessRedirect />
    </Suspense>
  );
}
