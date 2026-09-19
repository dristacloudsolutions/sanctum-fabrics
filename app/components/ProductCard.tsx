'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/dristaService';
import { productUrl } from '@/lib/dristaService';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWishlist } from '@/app/contexts/WishlistContext';
import { formatINR } from '@/lib/format';

const CAROUSEL_INTERVAL_MS = 900;

export default function ProductCard({
  product,
  variant,
  colorLabel,
}: {
  product: Product;
  /** The one color this card represents — see expandProductsByColor. When
   * given, the card shows and links to this variant specifically, instead of
   * cycling through every color the product has. */
  variant?: ProductVariant;
  colorLabel?: string;
}) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();

  const productImages = (product.images ?? []).filter((i) => i.url);
  const primaryUrl = productImages.find((i) => i.is_primary)?.url ?? productImages[0]?.url;
  const seenUrls = new Set<string>();
  const carouselUrls = (
    variant?.image_url
      // A color-specific card cycles through that color's own photo plus the
      // product's shared/general photos only — other colors' photos belong
      // to their own separate cards now, not mixed into this one.
      ? [variant.image_url, ...productImages.map((i) => i.url!)]
      : [
          ...(primaryUrl ? [primaryUrl] : []),
          ...productImages.map((i) => i.url!).filter((u) => u !== primaryUrl),
          ...(product.variants ?? []).filter((v) => v.is_active && v.image_url).map((v) => v.image_url!),
        ]
  ).filter((url) => {
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  // Carries this specific variant through the link (see productUrl) so the
  // details page opens pre-selected to the same color shown here.
  const linkHref = productUrl(product, variant?.id);
  const displayName = colorLabel ? `${product.name} - ${colorLabel}` : product.name;

  const [hovering, setHovering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hovering && carouselUrls.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((i) => (i + 1) % carouselUrls.length);
      }, CAROUSEL_INTERVAL_MS);
    } else {
      setActiveIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hovering, carouselUrls.length]);

  const displayUrl = carouselUrls[activeIndex] ?? carouselUrls[0];

  const price = variant?.selling_price ?? product.selling_price ?? product.base_price;
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
    const url = typeof window !== 'undefined' ? `${window.location.origin}${linkHref}` : linkHref;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: displayName, url }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <Link
      href={linkHref}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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

      {/* Image block: single hero photo — on hover it auto-cycles through
          this card's photos (with pagination dots), and snaps back to the
          one still image the instant the pointer leaves. */}
      <div className="relative mt-2.5 aspect-[3/4] w-full overflow-hidden bg-[color:var(--cream)]">
        {displayUrl ? (
          <Image
            key={displayUrl}
            src={displayUrl}
            alt={displayName}
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

        {/* Pagination dots — only while actively cycling on hover; the idle
            card is a single still photo, not something to page through. */}
        {hovering && carouselUrls.length > 1 && (
          <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1">
            {carouselUrls.map((url, i) => (
              <span
                key={url + i}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? 'w-3.5 bg-[color:var(--accent)]' : 'w-1.5 bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-3.5 pb-3.5 pt-2.5">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-[color:var(--ink)]">{displayName}</h3>
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
