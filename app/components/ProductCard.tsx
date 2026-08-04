'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import type { Product } from '@/lib/dristaService';
import { productUrl } from '@/lib/dristaService';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const image = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const price = product.selling_price ?? product.base_price;
  const mrp = product.base_price;
  const hasDiscount = mrp !== undefined && price !== undefined && mrp > price;
  const discountPct = hasDiscount ? Math.round(((mrp! - price!) / mrp!) * 100) : 0;
  const wishlisted = isWishlisted(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    toggle(product.id).catch(() => {});
  };

  return (
    <Link
      href={productUrl(product)}
      className="group block overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[color:var(--cream)]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">
            No image yet
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-0 top-3 rounded-r-full bg-[color:var(--accent)] py-1 pl-2.5 pr-3 text-[11px] font-bold tracking-wide text-white shadow-sm">
            {discountPct}% OFF
          </span>
        )}

        {user && (
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[color:var(--ink)]/60 shadow-sm transition-colors hover:text-[color:var(--accent)]"
          >
            <Heart size={16} fill={wishlisted ? 'var(--accent)' : 'none'} className={wishlisted ? 'text-[color:var(--accent)]' : ''} />
          </button>
        )}
      </div>
      <div className="p-3 text-center">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-[color:var(--ink)]">{product.name}</h3>
        {price !== undefined && (
          <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
            <p className="text-base font-bold text-[color:var(--ink)]">₹{price.toLocaleString('en-IN')}</p>
            {hasDiscount && (
              <>
                <p className="text-xs text-[color:var(--ink)]/40 line-through">₹{mrp!.toLocaleString('en-IN')}</p>
                <p className="text-xs font-semibold text-[color:var(--accent)]">{discountPct}% off</p>
              </>
            )}
          </div>
        )}
        <p className="mt-1.5 text-xs font-semibold text-[color:var(--accent)]">View Details</p>
      </div>
    </Link>
  );
}
