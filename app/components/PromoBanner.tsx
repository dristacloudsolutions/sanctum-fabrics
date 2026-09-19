'use client';

import { usePathname } from 'next/navigation';
import type { Promotion } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

function formatPromo(promo: Promotion): string {
  const discount = promo.discount_type === 'percentage' ? `${Number(promo.discount_value)}% OFF` : `₹${formatINR(promo.discount_value)} OFF`;
  const parts = [discount, promo.name];
  if (promo.min_order_amount) parts.push(`on orders above ₹${formatINR(promo.min_order_amount)}`);
  return parts.join(' — ');
}

export default function PromoBanner({ promotions }: { promotions: Promotion[] }) {
  const pathname = usePathname();
  const promo = promotions?.[0];
  const countdown = useCountdown(promo?.end_date);

  if (!promotions || promotions.length === 0) return null;
  if (pathname?.startsWith('/checkout')) return null;
  if (!promo) return null;

  return (
    <div className="bg-[color:var(--accent)] px-5 py-2 text-center text-xs font-semibold uppercase tracking-widest text-white sm:text-sm">
      {formatPromo(promo)}
      {' · '}
      {promo.code ? (
        <>Use code <span className="font-mono tracking-normal">{promo.code}</span> at checkout</>
      ) : (
        'Applied automatically at checkout'
      )}
      {countdown && !countdown.expired && (
        <span className="ml-2 font-mono normal-case tracking-normal text-white/85">
          · Ends in {countdown.days > 0 && `${countdown.days}d `}{String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m
        </span>
      )}
    </div>
  );
}
