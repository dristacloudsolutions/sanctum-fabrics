'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin, Home, Briefcase, Star, Trash2, Plus, Map as MapIcon, CheckCircle2, User } from 'lucide-react';
import type { AddressDetails, CustomerAddress } from '@/lib/dristaService';
import { INDIAN_STATES, COUNTRIES, ADDRESS_TYPES } from '@/lib/addressData';
import AddressMapPicker from '@/app/components/AddressMapPicker';
import { useAuth } from '@/app/contexts/AuthContext';

const inputCls = 'w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]/20';

const TYPE_ICON: Record<string, typeof Home> = { Home, Work: Briefcase, Other: MapPin };
const MAPS_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const emptyDraft = (): AddressDetails & { address_type: string } => ({
  address_type: 'Home', name: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '',
});

// Saved-address picker for checkout — lets a signed-in customer reuse a
// previously saved address (with a Home/Work/Other label) or add a new one,
// optionally picked straight off a map instead of typed by hand.
//
// Also reused standalone on the "My Addresses" account page (see
// app/addresses/page.tsx) — `onSelect` is optional there since that page is
// pure management (add/remove), not picking an address for an in-progress
// order, and `heading` swaps the checkout-specific copy for that context.
export default function AddressBook({
  onSelect,
  heading = 'Choose a Delivery Address',
}: {
  onSelect?: (details: AddressDetails) => void;
  heading?: string;
}) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const reload = () => {
    setLoading(true);
    fetch('/api/addresses')
      .then((res) => res.json())
      .then((payload) => {
        const list: CustomerAddress[] = payload.addresses || [];
        setAddresses(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetch('/api/addresses')
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        const list: CustomerAddress[] = payload.addresses || [];
        setAddresses(list);
        const preferred = list.find((a) => a.is_default) || list[0];
        if (preferred) {
          setSelectedId(preferred.id);
          onSelectRef.current?.(preferred.details);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectAddress = (addr: CustomerAddress) => {
    setSelectedId(addr.id);
    setShowForm(false);
    onSelectRef.current?.(addr.details);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Remove this address?')) return;
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      reload();
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save address';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[color:var(--ink)]/40">Loading saved addresses…</p>;

  return (
    <div className="space-y-4">
      {addresses.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[color:var(--ink)]">{heading}</h2>
            <span className="text-xs font-medium text-[color:var(--ink)]/50">{addresses.length} saved</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
                  className={`relative flex flex-col justify-between cursor-pointer rounded-2xl border p-4 text-left text-sm transition-all duration-200 shadow-xs ${
                    isSelected
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5 ring-1 ring-[color:var(--accent)]'
                      : 'border-[color:var(--border)] bg-white hover:border-[color:var(--ink)]/30 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pr-7">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isSelected ? 'bg-[color:var(--accent)] text-white' : 'bg-[color:var(--cream)] text-[color:var(--accent)]'}`}>
                          <Icon size={13} />
                        </span>
                        <span>{addr.address_type}</span>
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                            <Star size={9} className="fill-amber-500 text-amber-500" /> Default
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-[color:var(--accent)] shrink-0" />
                      )}
                    </div>
                    {(addr.details.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null)) && (
                      <p className="mt-2 text-xs font-semibold text-[color:var(--ink)]">
                        {addr.details.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
                      </p>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink)]/80">
                      {[addr.details.line1, addr.details.line2, addr.details.city, addr.details.state, addr.details.pincode].filter(Boolean).join(', ')}
                    </p>
                    {addr.details.phone && (
                      <p className="mt-1.5 text-[11px] font-medium text-[color:var(--ink)]/60">
                        Phone: {addr.details.phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, addr.id)}
                    aria-label="Remove address"
                    className="absolute right-3.5 top-3.5 text-[color:var(--ink)]/30 hover:text-red-500 transition-colors p-1"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:var(--border)] bg-white/60 py-3.5 text-sm font-semibold text-[color:var(--accent)] hover:border-[color:var(--accent)] hover:bg-[color:var(--cream)]/60 transition-all"
        >
          <Plus size={16} /> Add a new delivery address
        </button>
      ) : (
        <div className="space-y-3.5 rounded-2xl border border-[color:var(--border)] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="font-serif text-base font-semibold text-[color:var(--ink)]">Add New Address</p>
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

          <input
            placeholder="Recipient Full Name (optional)"
            value={draft.name || ''}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={inputCls}
          />
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
