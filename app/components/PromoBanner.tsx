'use client';

import { usePathname } from 'next/navigation';
import type { Promotion } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

// One short line: "10% OFF above ₹500 · Code SANCTUM10".
function formatPromo(promo: Promotion): string {
  const discount = promo.discount_type === 'percentage' ? `${Number(promo.discount_value)}% OFF` : `₹${formatINR(promo.discount_value)} OFF`;
  return promo.min_order_amount ? `${discount} above ₹${formatINR(promo.min_order_amount)}` : discount;
}

export default function PromoBanner({ promotions }: { promotions: Promotion[] }) {
  const pathname = usePathname();
  const promo = promotions?.[0];
  const countdown = useCountdown(promo?.end_date);

  if (!promotions || promotions.length === 0) return null;
  if (pathname?.startsWith('/checkout')) return null;
  if (!promo) return null;

  return (
    <div className="truncate bg-[color:var(--accent)] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
      {formatPromo(promo)}
      {' · '}
      {promo.code ? (
        <>Code <span className="font-mono">{promo.code}</span></>
      ) : (
        'auto-applied'
      )}
      {countdown && !countdown.expired && countdown.days < 3 && (
        <span className="ml-2 font-mono normal-case tracking-normal text-white/85">
          · Ends in {countdown.days > 0 && `${countdown.days}d `}{String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m
        </span>
      )}
    </div>
  );
}
