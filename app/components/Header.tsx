'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ShoppingBag, User, Heart, Search, LogOut } from 'lucide-react';
import config from '@/app/config/config';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Catalog' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { itemIds: wishlistIds } = useWishlist();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--cream)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-xl tracking-wide text-[color:var(--ink)]">
          {config.business.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/70 transition-colors hover:text-[color:var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/products" method="get" className="hidden max-w-xs flex-1 items-center md:mx-6 md:flex">
          <div className="relative w-full">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
            <input
              type="text"
              name="q"
              placeholder="Search sarees, fabrics…"
              className="w-full rounded-full border border-[color:var(--border)] bg-white py-2 pl-9 pr-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:border-[color:var(--accent)] focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/wishlist" aria-label="Wishlist" className="relative text-[color:var(--ink)] hover:text-[color:var(--accent)]">
                <Heart size={22} />
                {wishlistIds.size > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-bold text-white">
                    {wishlistIds.size}
                  </span>
                )}
              </Link>
              <Link href="/orders" aria-label="My Orders" className="text-[color:var(--ink)] hover:text-[color:var(--accent)]">
                <User size={22} />
              </Link>
              <button
                onClick={() => logout()}
                aria-label="Log out"
                className="text-[color:var(--ink)] hover:text-[color:var(--accent)]"
              >
                <LogOut size={22} />
              </button>
            </>
          )}

          <Link href="/cart" aria-label="Cart" className="relative text-[color:var(--ink)] hover:text-[color:var(--accent)]">
            <ShoppingBag size={22} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            aria-label="Toggle menu"
            className="text-[color:var(--ink)] md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <form action="/products" method="get" className="border-t border-[color:var(--border)] px-5 py-3 md:hidden">
        <div className="relative w-full">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
          <input
            type="text"
            name="q"
            placeholder="Search sarees, fabrics…"
            className="w-full rounded-full border border-[color:var(--border)] bg-white py-2 pl-9 pr-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:border-[color:var(--accent)] focus:outline-none"
          />
        </div>
      </form>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-[color:var(--border)] px-5 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
