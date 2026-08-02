'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ShoppingBag, User, Heart, Search, LogOut, ChevronDown } from 'lucide-react';
import config from '@/app/config/config';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { CategoryGroup } from '@/lib/dristaService';

// lucide-react dropped brand icons — inline SVGs, shared shape with Footer.
function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5C10 9 9.5 7.8 9.3 7.3c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
    </svg>
  );
}

// Decorative diamond/flower mark for the logo lockup — not brand artwork,
// just a simple motif in the accent colour.
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="20" y="2" width="18" height="18" rx="5" transform="rotate(45 20 2)" fill="var(--accent)" opacity="0.15" />
      <path
        d="M20 6 L26 14 L20 34 L14 14 Z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="13" r="2.5" fill="var(--accent)" />
    </svg>
  );
}

export default function Header({ categories = [] }: { categories?: CategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { itemIds: wishlistIds } = useWishlist();
  const { business } = config;

  // "Sanctum Fabrics" → "Sanctum" (bold navy) / "Fabrics" (tracked accent) —
  // a styling split of the real business name, not invented copy.
  const nameParts = business.name.trim().split(/\s+/);
  const nameFirst = nameParts[0] || business.name;
  const nameRest = nameParts.slice(1).join(' ');

  // First few real categories shown as flat nav links (matching the flat
  // Sarees/Churidars/Tops layout of the reference); the rest live in the
  // "Collections" dropdown so this never breaks for tenants with more (or
  // differently named) categories.
  const flatCategories = categories.slice(0, 3);
  const dropdownCategories = categories.slice(3);

  return (
    <header className="sticky top-0 z-50 bg-[color:var(--cream)]/95 backdrop-blur">
      {/* Welcome / social top bar */}
      <div className="hidden bg-[color:var(--ink)] px-5 py-2 text-white sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs">
          <p className="font-medium tracking-wide">
            Welcome to {business.name} — {business.tagline}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-white/50">Follow Us:</span>
            {business.social.facebook && (
              <a href={business.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/70 hover:text-white">
                <FacebookIcon />
              </a>
            )}
            {business.social.instagram && (
              <a href={business.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/70 hover:text-white">
                <InstagramIcon />
              </a>
            )}
            <a href={buildWhatsAppLink(`Hi ${business.name}, I'd like to know more.`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white/70 hover:text-white">
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Main row */}
      <div className="border-b border-[color:var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <span>
              <span className="block font-serif text-xl font-bold leading-tight text-[color:var(--ink)]">
                {nameFirst}
                {nameRest && <span className="ml-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">{nameRest}</span>}
              </span>
              <span className="block text-[11px] text-[color:var(--ink)]/50">{business.tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/" className="border-b-2 border-[color:var(--accent)] pb-0.5 text-sm font-medium text-[color:var(--accent)]">
              Home
            </Link>

            {dropdownCategories.length > 0 && (
              <div className="group relative">
                <button className="flex items-center gap-1 text-sm font-medium text-[color:var(--ink)]/80 transition-colors hover:text-[color:var(--accent)]">
                  Collections <ChevronDown size={13} />
                </button>
                <div className="invisible absolute left-0 top-full w-56 rounded-xl border border-[color:var(--border)] bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                  {dropdownCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-[color:var(--ink)]/80 hover:bg-[color:var(--cream)] hover:text-[color:var(--accent)]"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {flatCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="text-sm font-medium text-[color:var(--ink)]/80 transition-colors hover:text-[color:var(--accent)]"
              >
                {cat.name}
              </Link>
            ))}

            <Link href="/products" className="text-sm font-medium text-[color:var(--ink)]/80 transition-colors hover:text-[color:var(--accent)]">
              New Arrivals
            </Link>
            <Link href="/#story" className="text-sm font-medium text-[color:var(--ink)]/80 transition-colors hover:text-[color:var(--accent)]">
              About Us
            </Link>
            <Link href="/contact" className="text-sm font-medium text-[color:var(--ink)]/80 transition-colors hover:text-[color:var(--accent)]">
              Contact
            </Link>
          </nav>

          <form action="/products" method="get" className="hidden max-w-[220px] flex-1 items-center xl:flex">
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
                  <Heart size={20} />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-bold text-white">
                      {wishlistIds.size}
                    </span>
                  )}
                </Link>
                <Link href="/orders" aria-label="My Orders" className="text-[color:var(--ink)] hover:text-[color:var(--accent)]">
                  <User size={20} />
                </Link>
                <button onClick={() => logout()} aria-label="Log out" className="text-[color:var(--ink)] hover:text-[color:var(--accent)]">
                  <LogOut size={20} />
                </button>
              </>
            )}

            <Link href="/cart" aria-label="Cart" className="relative text-[color:var(--ink)] hover:text-[color:var(--accent)]">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/products"
              className="hidden shrink-0 rounded-full bg-[color:var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-transform hover:-translate-y-0.5 sm:inline-block"
            >
              Shop Now
            </Link>

            <button aria-label="Toggle menu" className="text-[color:var(--ink)] lg:hidden" onClick={() => setOpen((v) => !v)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <form action="/products" method="get" className="border-t border-[color:var(--border)] px-5 py-3 lg:hidden">
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
          <nav className="flex flex-col gap-1 border-t border-[color:var(--border)] px-5 py-3 lg:hidden">
            <Link href="/" onClick={() => setOpen(false)} className="py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80">
              Home
            </Link>
            {categories.length > 0 && (
              <button
                onClick={() => setCollectionsOpen((v) => !v)}
                className="flex items-center justify-between py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80"
              >
                Collections <ChevronDown size={14} className={collectionsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            )}
            {collectionsOpen && (
              <div className="ml-3 flex flex-col gap-1 border-l border-[color:var(--border)] pl-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    onClick={() => setOpen(false)}
                    className="py-1.5 text-sm text-[color:var(--ink)]/70"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/products" onClick={() => setOpen(false)} className="py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80">
              New Arrivals
            </Link>
            <Link href="/#story" onClick={() => setOpen(false)} className="py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80">
              About Us
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="py-2 text-sm font-medium uppercase tracking-widest text-[color:var(--ink)]/80">
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
