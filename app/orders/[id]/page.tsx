'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { OrderDetail } from '@/lib/dristaService';

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

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setOrder(payload.order);
      })
      .catch((err) => setError(err.message || 'Order not found'));
  }, [user, orderId]);

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-[color:var(--ink)]/60">Sign in to view this order.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/orders" className="mt-6 inline-flex items-center gap-2 text-sm text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]">
          <ArrowLeft size={15} /> Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-[color:var(--ink)]/50">Loading…</div>;

  const status = STATUS_LABEL[order.payment_status] || { label: order.payment_status, cls: 'bg-zinc-100 text-zinc-500' };
  const address = order.shipping_address as Record<string, string> | undefined;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/orders" className="mb-8 inline-flex items-center gap-2 text-sm text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[color:var(--ink)]">{order.so_number}</h1>
          {(order.order_date || order.created_at) && (
            <p className="mt-1 text-sm text-[color:var(--ink)]/50">
              {new Date((order.order_date || order.created_at)!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
          {order.fulfillment_status && order.fulfillment_status !== 'pending' && FULFILLMENT_LABEL[order.fulfillment_status] && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${FULFILLMENT_LABEL[order.fulfillment_status].cls}`}>
              {FULFILLMENT_LABEL[order.fulfillment_status].label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--cream)]">
              {item.variant?.image_url && (
                <Image src={item.variant.image_url} alt={item.item?.name || ''} fill unoptimized className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[color:var(--ink)]">{item.item?.name}</p>
              {item.variant?.attributes && (
                <p className="mt-0.5 text-xs text-[color:var(--ink)]/50">
                  {Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </p>
              )}
              <p className="mt-1 text-xs text-[color:var(--ink)]/50">Qty {item.quantity} × ₹{Number(item.rate).toLocaleString('en-IN')}</p>
            </div>
            <p className="text-sm font-semibold text-[color:var(--ink)]">₹{Number(item.amount).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-end gap-1.5 text-sm">
        <div className="flex justify-between w-full max-w-xs text-[color:var(--ink)]/70">
          <span>Subtotal</span>
          <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between w-full max-w-xs text-emerald-600">
            <span>Discount</span>
            <span>−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between w-full max-w-xs border-t border-[color:var(--border)] pt-2 text-base font-semibold text-[color:var(--ink)]">
          <span>Total</span>
          <span>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {(order.courier_name || order.tracking_number || order.awb_number) && (
        <div className="mt-10 rounded-2xl border border-[color:var(--border)] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Delivery Tracking</h2>
          <div className="mt-2 space-y-1 text-sm text-[color:var(--ink)]/70">
            {order.courier_name && <p>Courier: <span className="font-medium text-[color:var(--ink)]">{order.courier_name}</span></p>}
            {(order.tracking_number || order.awb_number) && (
              <p>Tracking / AWB: <span className="font-medium text-[color:var(--ink)]">{order.tracking_number || order.awb_number}</span></p>
            )}
            {order.shipped_at && (
              <p className="text-xs text-[color:var(--ink)]/50">Shipped on {new Date(order.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
            {order.delivered_at && (
              <p className="text-xs text-[color:var(--ink)]/50">Delivered on {new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
        </div>
      )}

      {order.fulfillment_history && order.fulfillment_history.length > 0 && (
        <div className="mt-10 rounded-2xl border border-[color:var(--border)] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Order Timeline</h2>
          <ol className="mt-4 space-y-4">
            {order.fulfillment_history.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--primary)]" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink)]">
                    {FULFILLMENT_LABEL[h.to_status]?.label || h.to_status}
                  </p>
                  <p className="text-xs text-[color:var(--ink)]/50">
                    {new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {h.note && <p className="mt-0.5 text-xs text-[color:var(--ink)]/60">{h.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {address && (
        <div className="mt-10 rounded-2xl border border-[color:var(--border)] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Shipping Address</h2>
          <p className="mt-2 text-sm text-[color:var(--ink)]/70">
            {[address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
