'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, MessageCircle, Share2 } from 'lucide-react';
import { productUrl, sortAttributeKeys, type Product, type ProductVariant } from '@/lib/dristaService';
import { buildWhatsAppLink, productOrderMessage } from '@/lib/whatsapp';
import ProductGallery from './ProductGallery';
import AddToCartPanel from './AddToCartPanel';

export default function ProductDetailInteractive({ product }: { product: Product }) {
  const [variantImageUrl, setVariantImageUrl] = useState<string | undefined>(undefined);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [copied, setCopied] = useState(false);
  const price = variant?.selling_price ?? product.selling_price ?? product.base_price;
  const productCode = product.item_code || variant?.sku || product.sku;
  // "Color: Maroon, Length: 2.4 Meters" — hex companions of colour names left out.
  const variantText = variant
    ? sortAttributeKeys(Object.keys(variant.attributes || {}), product.metadata?.attribute_order)
        .map((k) => [k, (variant.attributes || {})[k]] as [string, unknown])
        .filter(([k, v]) => !k.trim().toLowerCase().endsWith(' hex') && v !== null && v !== undefined && String(v).trim() !== '')
        .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: ${v}`)
        .join(', ')
    : null;
  const pageUrl = () => (typeof window === 'undefined' ? '' : `${window.location.origin}${productUrl(product, variant?.id)}`);
  const orderMessage = () => productOrderMessage(product.name, price, { productCode, variant: variantText, url: pageUrl() });

  // Phone share sheet where available (WhatsApp, Instagram...), else copy the link.
  const share = async () => {
    const url = pageUrl();
    const text = [product.name, variantText, price ? `₹${price.toLocaleString('en-IN')}` : null].filter(Boolean).join(' · ');
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url });
        return;
      }
    } catch {
      return; // the shopper closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };
  // Set on the product card link (see productUrl) so the same variant whose
  // photo was shown/clicked on the card is what opens pre-selected here,
  // instead of the shopper landing on no selection / a different variant.
  const initialVariantId = useSearchParams().get('variant') || undefined;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery
        images={product.images || []}
        videos={product.videos || []}
        variants={product.variants || []}
        productName={product.name}
        overrideImageUrl={variantImageUrl}
      />

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

        <AddToCartPanel product={product} onVariantImageChange={setVariantImageUrl} onVariantChange={setVariant} initialVariantId={initialVariantId} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={buildWhatsAppLink(orderMessage())}
            onClick={(e) => { e.currentTarget.href = buildWhatsAppLink(orderMessage()); }}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-6 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <MessageCircle size={16} /> Order on WhatsApp instead
          </a>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)]/70 transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />} {copied ? 'Link copied' : 'Share'}
          </button>
        </div>
        <p className="mt-3 text-xs text-[color:var(--ink)]/40">
          Prefer WhatsApp? This opens a chat with the item pre-filled — confirm size, quantity, and delivery details there.
        </p>
      </div>
    </div>
  );
}
