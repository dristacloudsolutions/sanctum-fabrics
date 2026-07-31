import type { Promotion } from '@/lib/dristaService';

function formatPromo(promo: Promotion): string {
  const discount = promo.discount_type === 'percentage' ? `${Number(promo.discount_value)}% OFF` : `₹${Number(promo.discount_value).toLocaleString('en-IN')} OFF`;
  const parts = [discount, promo.name];
  if (promo.min_order_amount) parts.push(`on orders above ₹${Number(promo.min_order_amount).toLocaleString('en-IN')}`);
  return parts.join(' — ');
}

export default function PromoBanner({ promotions }: { promotions: Promotion[] }) {
  if (!promotions || promotions.length === 0) return null;
  const promo = promotions[0];

  return (
    <div className="bg-[color:var(--accent)] px-5 py-2 text-center text-xs font-semibold uppercase tracking-widest text-white sm:text-sm">
      {formatPromo(promo)}
      {' · '}
      {promo.code ? (
        <>Use code <span className="font-mono tracking-normal">{promo.code}</span> at checkout</>
      ) : (
        'Applied automatically at checkout'
      )}
    </div>
  );
}
