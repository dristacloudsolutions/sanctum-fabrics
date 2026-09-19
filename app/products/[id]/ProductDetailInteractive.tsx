'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import type { Product } from '@/lib/dristaService';
import { buildWhatsAppLink, productOrderMessage } from '@/lib/whatsapp';
import ProductGallery from './ProductGallery';
import AddToCartPanel from './AddToCartPanel';

export default function ProductDetailInteractive({ product }: { product: Product }) {
  const [variantImageUrl, setVariantImageUrl] = useState<string | undefined>(undefined);
  const price = product.selling_price ?? product.base_price;
  // Set on the product card link (see productUrl) so the same variant whose
  // photo was shown/clicked on the card is what opens pre-selected here,
  // instead of the shopper landing on no selection / a different variant.
  const initialVariantId = useSearchParams().get('variant') || undefined;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery images={product.images || []} videos={product.videos || []} productName={product.name} overrideImageUrl={variantImageUrl} />

      <div>
        {(product.sku || product.item_code) && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/40">
            {product.sku}
            {product.sku && product.item_code && <span className="mx-1.5">·</span>}
            {product.item_code && <span>Item Code: {product.item_code}</span>}
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">{product.name}</h1>
        {product.description && (
          <p className="mt-4 leading-relaxed text-[color:var(--ink)]/70">{product.description}</p>
        )}

        <AddToCartPanel product={product} onVariantImageChange={setVariantImageUrl} initialVariantId={initialVariantId} />

        <a
          href={buildWhatsAppLink(productOrderMessage(product.name, price))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-6 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <MessageCircle size={16} /> Order on WhatsApp instead
        </a>
        <p className="mt-3 text-xs text-[color:var(--ink)]/40">
          Prefer WhatsApp? This opens a chat with the item pre-filled — confirm size, quantity, and delivery details there.
        </p>
      </div>
    </div>
  );
}
