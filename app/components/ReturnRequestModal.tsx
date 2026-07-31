'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { OrderLineItem, ProductVariant } from '@/lib/dristaService';

const REASONS = [
  'Size/fit issue',
  'Color different from image',
  'Quality issue',
  'Wrong item received',
  'Damaged in transit',
  'Changed my mind',
  'Other',
];

export default function ReturnRequestModal({
  orderId,
  item,
  onClose,
  onSuccess,
}: {
  orderId: string;
  item: OrderLineItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [requestType, setRequestType] = useState<'return' | 'exchange'>('return');
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(item.quantity);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [exchangeVariantId, setExchangeVariantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestType !== 'exchange' || !item.item?.id || variants.length > 0) return;
    fetch(`/api/products/${item.item.id}`)
      .then((res) => res.json())
      .then((payload) => {
        const opts = (payload.product?.variants || []).filter((v: ProductVariant) => v.id !== item.variant?.id && v.is_active);
        setVariants(opts);
      })
      .catch(() => {});
  }, [requestType, item.item?.id, item.variant?.id, variants.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestType === 'exchange' && !exchangeVariantId) {
      setError('Please select what you would like to exchange this for.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order_id: orderId,
          sales_order_item_id: item.id,
          request_type: requestType,
          reason,
          reason_notes: notes || undefined,
          quantity,
          exchange_variant_id: requestType === 'exchange' ? exchangeVariantId : undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to submit request');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[color:var(--ink)]">Request Return / Exchange</h2>
          <button onClick={onClose} className="text-[color:var(--ink)]/40 hover:text-[color:var(--ink)]">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-[color:var(--ink)]/60">{item.item?.name}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Request Type</label>
            <div className="mt-2 flex gap-2">
              {(['return', 'exchange'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRequestType(t)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                    requestType === t
                      ? 'bg-[color:var(--primary)] text-white'
                      : 'border border-[color:var(--border)] text-[color:var(--ink)]/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {requestType === 'exchange' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Exchange For</label>
              <select
                value={exchangeVariantId}
                onChange={(e) => setExchangeVariantId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
              >
                <option value="">Select an option…</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' · ') || v.sku}
                  </option>
                ))}
              </select>
              {variants.length === 0 && (
                <p className="mt-1 text-xs text-[color:var(--ink)]/40">No other options currently available for this item.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Quantity</label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Additional Notes (optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us more…"
              className="mt-2 w-full rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
