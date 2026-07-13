import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getProduct } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import { buildWhatsAppLink, productOrderMessage } from '@/lib/whatsapp';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const liveProduct = await getProduct(id);
  const product = liveProduct || sampleProducts.find((p) => p.id === id);

  if (!product) notFound();

  const image = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const price = product.selling_price ?? product.base_price;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]">
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--cream)]">
          {image?.url ? (
            <Image src={image.url} alt={product.name} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">
              No image yet
            </div>
          )}
        </div>

        <div>
          {product.sku && (
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/40">
              {product.sku}
            </p>
          )}
          <h1 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">{product.name}</h1>
          {price !== undefined && (
            <p className="mt-3 text-2xl font-semibold text-[color:var(--accent)]">
              ₹{price.toLocaleString('en-IN')}
            </p>
          )}
          {product.description && (
            <p className="mt-6 leading-relaxed text-[color:var(--ink)]/70">{product.description}</p>
          )}

          <a
            href={buildWhatsAppLink(productOrderMessage(product.name, price))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <MessageCircle size={16} /> Order on WhatsApp
          </a>
          <p className="mt-3 text-xs text-[color:var(--ink)]/40">
            Opens WhatsApp with this item pre-filled — confirm size, quantity, and delivery details there.
          </p>
        </div>
      </div>
    </div>
  );
}
