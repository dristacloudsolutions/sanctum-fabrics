'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { SalesOrder } from '@/lib/dristaService';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Payment Pending', cls: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Payment Failed', cls: 'bg-red-50 text-red-600' },
};

const FULFILLMENT_LABEL: Record<string, { label: string; cls: string }> = {
  processing: { label: 'Processing', cls: 'bg-amber-50 text-amber-700' },
  shipped: { label: 'Shipped', cls: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600' },
};

export default function OrdersPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/orders')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setOrders(payload.orders);
      })
      .catch((err) => setError(err.message || 'Failed to load orders'));
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Orders</h1>
        <p className="mt-3 text-[color:var(--ink)]/60">Sign in to see your order history.</p>
        <Link
          href="/checkout"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Orders</h1>
        <button
          onClick={() => logout()}
          className="text-sm font-medium text-[color:var(--ink)]/60 underline-offset-2 hover:text-[color:var(--accent)] hover:underline"
        >
          Log out
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {orders === null && !error ? (
        <p className="mt-8 text-sm text-[color:var(--ink)]/50">Loading…</p>
      ) : orders && orders.length === 0 ? (
        <div className="mt-12 text-center">
          <Package size={40} className="mx-auto text-[color:var(--ink)]/30" />
          <p className="mt-4 text-[color:var(--ink)]/60">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform"
          >
            Browse the Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
          {orders?.map((order) => {
            const status = STATUS_LABEL[order.payment_status] || { label: order.payment_status, cls: 'bg-zinc-100 text-zinc-500' };
            const fulfillment = order.fulfillment_status && order.fulfillment_status !== 'pending' ? FULFILLMENT_LABEL[order.fulfillment_status] : null;
            const date = order.order_date || order.created_at;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 py-5 hover:bg-[color:var(--cream)]/60 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-[color:var(--ink)]">{order.so_number}</p>
                  {date && (
                    <p className="mt-0.5 text-xs text-[color:var(--ink)]/50">
                      {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
                  {fulfillment && <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${fulfillment.cls}`}>{fulfillment.label}</span>}
                </div>
                <p className="w-28 text-right text-sm font-semibold text-[color:var(--ink)]">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                <ChevronRight size={16} className="text-[color:var(--ink)]/30" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
