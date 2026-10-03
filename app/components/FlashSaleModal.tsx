'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import type { Promotion } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

const SEEN_KEY_PREFIX = 'sanctum_flashsale_seen_';
// Shown once a shopper is browsing (not the moment they land): after 20 s on the
// page or once they've scrolled halfway, on the home and catalogue pages only.
const SHOW_DELAY_MS = 20000;
const SHOW_AT_SCROLL = 0.5;
const SHOW_ON = (path?: string | null) => path === '/' || path === '/products';
/** A countdown only adds urgency in the last few days. */
const COUNTDOWN_DAYS = 3;

export default function FlashSaleModal({ promotions }: { promotions: Promotion[] }) {
  const pathname = usePathname();
  const promo = promotions?.[0];
  const [open, setOpen] = useState(false);
  const countdown = useCountdown(promo?.end_date);

  // Once per browser session per promotion — reappears for a new promo or a
  // new tab/session, but doesn't nag on every internal page navigation. Marked
  // "seen" immediately (not after the delay) so a quick nav away during the
  // delay window doesn't re-arm it on the next page.
  useEffect(() => {
    if (!promo || !SHOW_ON(pathname)) return;
    const key = `${SEEN_KEY_PREFIX}${promo.id}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage blocked */ }
    const show = () => {
      try { sessionStorage.setItem(key, '1'); } catch { /* storage blocked */ }
      setOpen(true);
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SHOW_AT_SCROLL) show();
    };
    const timer = setTimeout(show, SHOW_DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
    return cleanup;
  }, [promo, pathname]);

  if (!promo || !open || countdown?.expired || !SHOW_ON(pathname)) return null;

  const discountLabel = promo.discount_type === 'percentage'
    ? `${Number(promo.discount_value)}% OFF`
    : `₹${formatINR(promo.discount_value)} OFF`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <X size={16} />
        </button>

        {promo.image_url ? (
          <div className="relative aspect-[4/3] w-full">
            <Image src={promo.image_url} alt={promo.name} fill unoptimized className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-10">
              <p className="text-3xl font-black text-white">{discountLabel}</p>
            </div>
          </div>
        ) : (
          <div className="bg-[color:var(--accent)] px-6 py-7 text-center">
            <p className="font-serif text-4xl text-white">{discountLabel}</p>
          </div>
        )}

        <div className="p-6 text-center">
          <h2 className="font-serif text-xl text-[color:var(--ink)]">{promo.name}</h2>
          {promo.description && <p className="mt-2 text-sm text-[color:var(--ink)]/60">{promo.description}</p>}

          {promo.code ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--accent)] bg-[color:var(--accent)]/5 px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Use code</p>
              <p className="font-mono text-lg font-bold text-[color:var(--accent)]">{promo.code}</p>
            </div>
          ) : (
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/50">Applied automatically at checkout</p>
          )}

          {countdown && countdown.days < COUNTDOWN_DAYS && (
            <p className="mt-4 font-mono text-sm font-semibold text-[color:var(--ink)]/70">
              Ends in {countdown.days > 0 && `${countdown.days}d `}
              {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </p>
          )}

          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}
