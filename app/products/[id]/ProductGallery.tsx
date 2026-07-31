'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import type { ProductImage } from '@/lib/dristaService';

export default function ProductGallery({
  images,
  productName,
  overrideImageUrl,
}: {
  images: ProductImage[];
  productName: string;
  overrideImageUrl?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // A selected variant's own photo takes priority over the gallery selection —
  // it's what the customer is actually about to buy.
  const activeUrl = overrideImageUrl || images[activeIndex]?.url;

  if (!activeUrl && images.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--cream)]">
        <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">
          No image yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => activeUrl && setLightboxOpen(true)}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[color:var(--cream)]"
        aria-label="Zoom image"
      >
        {activeUrl && (
          <>
            <Image src={activeUrl} alt={productName} fill unoptimized className="object-cover transition-transform group-hover:scale-[1.03]" />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn size={13} /> Zoom
            </span>
          </>
        )}
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url || i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                !overrideImageUrl && activeIndex === i ? 'border-[color:var(--accent)]' : 'border-transparent'
              }`}
            >
              {img.url && <Image src={img.url} alt={img.alt_text || productName} fill unoptimized className="object-cover" />}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && activeUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl">
            <Image src={activeUrl} alt={productName} fill unoptimized className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
