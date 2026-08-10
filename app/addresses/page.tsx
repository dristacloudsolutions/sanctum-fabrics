'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import AddressBook from '@/app/checkout/AddressBook';

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Addresses</h1>
        <p className="mt-3 text-[color:var(--ink)]/60">Sign in to manage your saved addresses.</p>
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
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">My Addresses</h1>
      <div className="mt-8">
        {/* No onSelect — this page is pure management (add/remove saved
            addresses), not picking one for an in-progress order. */}
        <AddressBook heading="Saved Addresses" />
      </div>
    </div>
  );
}
