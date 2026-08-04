'use client';

import { useEffect, useState } from 'react';
import { MapPin, Home, Briefcase, Star, Trash2, Plus, Map as MapIcon } from 'lucide-react';
import type { AddressDetails, CustomerAddress } from '@/lib/dristaService';
import { INDIAN_STATES, COUNTRIES, ADDRESS_TYPES } from '@/lib/addressData';
import AddressMapPicker from '@/app/components/AddressMapPicker';

const inputCls = 'w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]';

const TYPE_ICON: Record<string, typeof Home> = { Home, Work: Briefcase, Other: MapPin };
const MAPS_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const emptyDraft = (): AddressDetails & { address_type: string } => ({
  address_type: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '',
});

// Saved-address picker for checkout — lets a signed-in customer reuse a
// previously saved address (with a Home/Work/Other label) or add a new one,
// optionally picked straight off a map instead of typed by hand.
export default function AddressBook({ onSelect }: { onSelect: (details: AddressDetails) => void }) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/addresses')
      .then((res) => res.json())
      .then((payload) => {
        const list: CustomerAddress[] = payload.addresses || [];
        setAddresses(list);
        const preferred = list.find((a) => a.is_default) || list[0];
        if (preferred) {
          setSelectedId(preferred.id);
          onSelect(preferred.details);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  useEffect(load, []);

  const selectAddress = (addr: CustomerAddress) => {
    setSelectedId(addr.id);
    setShowForm(false);
    onSelect(addr.details);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Remove this address?')) return;
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      load();
    } catch {
      setError('Failed to remove address');
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { address_type, ...details } = draft;
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_type, is_default: addresses.length === 0, details }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to save address');
      setShowForm(false);
      setDraft(emptyDraft());
      setAddresses((prev) => [...prev, payload.address]);
      selectAddress(payload.address);
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[color:var(--ink)]/40">Loading saved addresses…</p>;

  return (
    <div className="space-y-3">
      {addresses.length > 0 && (
        <>
          <h2 className="font-serif text-xl text-[color:var(--ink)]">Choose a Delivery Address</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {addresses.map((addr) => {
              const Icon = TYPE_ICON[addr.address_type] || MapPin;
              const isSelected = selectedId === addr.id;
              return (
                <div
                  key={addr.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectAddress(addr)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAddress(addr); } }}
                  className={`relative cursor-pointer rounded-xl border p-3.5 text-left text-sm transition-colors ${
                    isSelected ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5' : 'border-[color:var(--border)] hover:border-[color:var(--ink)]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink)]">
                    <Icon size={13} className="text-[color:var(--accent)]" />
                    {addr.address_type}
                    {addr.is_default && <Star size={11} className="fill-[color:var(--accent)] text-[color:var(--accent)]" />}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[color:var(--ink)]/70">
                    {[addr.details.line1, addr.details.line2, addr.details.city, addr.details.state, addr.details.pincode].filter(Boolean).join(', ')}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, addr.id)}
                    aria-label="Remove address"
                    className="absolute right-2.5 top-2.5 text-[color:var(--ink)]/30 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent)] hover:underline"
        >
          <Plus size={15} /> Add a new address
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-[color:var(--border)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--ink)]">New Address</p>
            {MAPS_ENABLED && (
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--ink)]/70 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                <MapIcon size={13} /> Pick on Map
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {ADDRESS_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDraft({ ...draft, address_type: t })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  draft.address_type === t ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white' : 'border-[color:var(--border)] text-[color:var(--ink)]/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input placeholder="Address line 1" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} className={inputCls} />
          <input placeholder="Address line 2 (optional)" value={draft.line2} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className={inputCls} />
            <select value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} className={inputCls}>
              <option value="" disabled>State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Pincode" value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value })} className={inputCls} />
            <select value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input type="tel" placeholder="Contact phone (optional)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputCls} />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !draft.line1 || !draft.city || !draft.state || !draft.pincode}
              className="rounded-full bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setDraft(emptyDraft()); }} className="text-sm font-semibold text-[color:var(--ink)]/60">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showMap && MAPS_ENABLED && (
        <AddressMapPicker
          onClose={() => setShowMap(false)}
          onConfirm={(resolved) => {
            setDraft({ ...draft, ...resolved, line2: resolved.line2 || '' });
            setShowMap(false);
          }}
        />
      )}
    </div>
  );
}
