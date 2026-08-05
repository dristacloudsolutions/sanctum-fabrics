import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getProduct, getProducts } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import { buildWhatsAppLink, productOrderMessage } from '@/lib/whatsapp';
import { formatINR } from '@/lib/format';
import ProductDetailInteractive from './ProductDetailInteractive';
import ProductCarousel from '@/app/components/ProductCarousel';
import Reveal from '@/app/components/Reveal';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const liveProduct = await getProduct(id);
  const product = liveProduct || sampleProducts.find((p) => p.id === id);

  if (!product) notFound();

  const allProducts = liveProduct ? await getProducts() : sampleProducts;
  const similarProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      {liveProduct ? (
        <ProductDetailInteractive product={liveProduct} />
      ) : (
        <SampleProductDetail product={product} />
      )}

      {similarProducts.length > 0 && (
        <section className="mt-16 border-t border-[color:var(--border)] pt-12">
          <Reveal>
            <h2 className="text-center font-serif text-2xl text-[color:var(--ink)] md:text-3xl">You May Also Like</h2>
            <div className="mx-auto my-4 flex max-w-[160px] items-center gap-3">
              <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
              <span className="text-[color:var(--accent)]">&#10048;</span>
              <span className="h-px flex-1 bg-[color:var(--accent)]/40" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ProductCarousel products={similarProducts} />
          </Reveal>
        </section>
      )}
    </div>
  );
}

// Sample catalog has no cart/variants — kept as a simple static layout,
// separate from the live-product interactive gallery + add-to-cart flow.
function SampleProductDetail({ product }: { product: NonNullable<ReturnType<typeof sampleProducts.find>> }) {
  const image = product.images?.find((i) => i.is_primary) || product.images?.[0];
  const price = product.selling_price ?? product.base_price;

  return (
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--ink)]/40">{product.sku}</p>
        )}
        <h1 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">{product.name}</h1>
        {product.description && (
          <p className="mt-4 leading-relaxed text-[color:var(--ink)]/70">{product.description}</p>
        )}
        {price !== undefined && (
          <p className="mt-3 text-2xl font-semibold text-[color:var(--accent)]">₹{formatINR(price)}</p>
        )}

        <a
          href={buildWhatsAppLink(productOrderMessage(product.name, price))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-600"
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
