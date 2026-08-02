'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/dristaService';

export default function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={trackRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 sm:w-[30%] lg:w-[calc(100%/6-14px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink)] shadow-md transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
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
