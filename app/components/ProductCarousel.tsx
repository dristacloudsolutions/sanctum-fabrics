'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { expandProductsByColor, type Product } from '@/lib/dristaService';

const AUTO_SCROLL_INTERVAL_MS = 3000;
const RESUME_AFTER_INTERACTION_MS = 5000;

export default function ProductCarousel({ products }: { products: Product[] }) {
  // Each product-color combination gets its own card — see expandProductsByColor.
  const entries = expandProductsByColor(products);
  const trackRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<1 | -1>(1);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  const pauseThenResume = () => {
    setPaused(true);
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_INTERACTION_MS);
  };

  const handleManualScroll = (dir: 1 | -1) => {
    dirRef.current = dir;
    scrollBy(dir);
    pauseThenResume();
  };

  useEffect(() => {
    if (paused || entries.length <= 3) return;
    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 4) dirRef.current = -1;
      else if (track.scrollLeft <= 4) dirRef.current = 1;
      scrollBy(dirRef.current);
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, entries.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => pauseThenResume()}
    >
      {/* Card widths match the Featured Pieces grid (2 / 3 / 4 per row; gap-4, sm:gap-6),
          so both sections show the same card size. Snapping keeps the 80% scroll steps aligned. */}
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map((entry) => (
          <div key={`${entry.product.id}-${entry.variant?.id ?? 'base'}`} className="w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]">
            <ProductCard product={entry.product} variant={entry.variant} colorLabel={entry.colorLabel} />
          </div>
        ))}
      </div>

      {entries.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => handleManualScroll(-1)}
            aria-label="Previous"
            className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink)] shadow-md transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleManualScroll(1)}
            aria-label="Next"
            className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink)] shadow-md transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
