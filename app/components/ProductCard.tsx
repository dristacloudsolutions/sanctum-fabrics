'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2 } from 'lucide-react';
import type { Product } from '@/lib/dristaService';
import { productUrl } from '@/lib/dristaService';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { formatINR } from '@/lib/format';

const MAX_THUMBS = 3;

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();

  const allImages = (product.images ?? []).filter((i) => i.url);
  const primary = allImages.find((i) => i.is_primary) ?? allImages[0];
  const rest = allImages.filter((i) => i !== primary);
  const thumbs = rest.slice(0, MAX_THUMBS);
  const overflowCount = rest.length - MAX_THUMBS;

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

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = typeof window !== 'undefined' ? `${window.location.origin}${productUrl(product)}` : productUrl(product);
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <Link
      href={productUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden border border-[color:var(--ink)]/8 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(42,36,32,0.18)]"
    >
      {/* Brand strip */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <span className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-[color:var(--ink)]/10">
          <Image src="/sanctum_logo_card.jpg" alt="" fill unoptimized className="object-cover" />
        </span>
        <span className="font-serif text-[11px] uppercase tracking-[0.15em] text-[color:var(--ink)]/70">
          Sanctum Collections
        </span>
      </div>

      {/* Image block: main + stacked thumbnails, LimeRoad-style */}
      <div className="relative mt-2.5 flex aspect-[4/5] w-full gap-1 overflow-hidden bg-[color:var(--cream)] px-3">
        <div className="relative h-full flex-[7] overflow-hidden bg-[color:var(--cream)]">
          {primary?.url ? (
            <Image
              src={primary.url}
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
        </div>

        {thumbs.length > 0 && (
          <div className="flex h-full flex-[3] flex-col gap-1">
            {thumbs.map((img, idx) => {
              const isLast = idx === thumbs.length - 1;
              const showOverlay = isLast && overflowCount > 0;
              return (
                <div key={img.url ?? idx} className="relative flex-1 overflow-hidden bg-white">
                  {img.url && (
                    <Image src={img.url} alt="" fill unoptimized className="object-cover" />
                  )}
                  {showOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--ink)]/60">
                      <span className="font-serif text-base font-bold text-white">+{overflowCount + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-3.5 pb-3.5 pt-2.5">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-[color:var(--ink)]">{product.name}</h3>
        {price !== undefined && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-base font-bold text-[color:var(--ink)]">₹{formatINR(price)}</p>
            {hasDiscount && (
              <>
                <p className="text-xs text-[color:var(--ink)]/40 line-through">₹{formatINR(mrp!)}</p>
                <p className="text-xs font-semibold text-[color:var(--accent)]">{discountPct}% off</p>
              </>
            )}
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between border-t border-[color:var(--ink)]/8 pt-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--accent)]">
            View Details
          </span>
          <div className="flex items-center gap-1">
            {user && (
              <button
                type="button"
                onClick={handleWishlistClick}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink)]/50 transition-colors hover:text-[color:var(--accent)]"
              >
                <Heart size={15} fill={wishlisted ? 'var(--accent)' : 'none'} className={wishlisted ? 'text-[color:var(--accent)]' : ''} />
              </button>
            )}
            <button
              type="button"
              onClick={handleShareClick}
              aria-label="Share this product"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink)]/50 transition-colors hover:text-[color:var(--accent)]"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
