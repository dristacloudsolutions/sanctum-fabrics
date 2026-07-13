import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import ProductCard from './components/ProductCard';
import config from './config/config';
import { getProducts } from '@/lib/dristaService';
import { sampleProducts } from '@/lib/sampleProducts';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export default async function Home() {
  const liveProducts = await getProducts();
  const products = liveProducts.length > 0 ? liveProducts : sampleProducts;
  const featured = products.slice(0, 4);
  const usingSample = liveProducts.length === 0;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[color:var(--border)] bg-[color:var(--cream)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Handloom &amp; Artisan Textiles
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[color:var(--ink)] md:text-5xl">
              {config.business.tagline}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[color:var(--ink)]/70">
              {config.business.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Browse the Catalog <ArrowRight size={16} />
              </Link>
              <a
                href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to know more about your collection.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary)] hover:text-white"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--primary)] to-[#1a2340]">
            <div className="flex h-full items-center justify-center px-8 text-center">
              <p className="font-serif text-2xl text-[#e8c88a]/90">
                Every weave tells
                <br />a story
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[color:var(--ink)] md:text-3xl">Featured Pieces</h2>
            {usingSample && (
              <p className="mt-1 text-xs text-[color:var(--ink)]/40">
                Sample catalog shown — connect the live catalog in lib/dristaService.ts once onboarded.
              </p>
            )}
          </div>
          <Link href="/products" className="text-sm font-semibold text-[color:var(--accent)] hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand story */}
      <section className="border-t border-[color:var(--border)] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-serif text-2xl text-[color:var(--ink)] md:text-3xl">
            Crafted by hand, chosen with care
          </h2>
          <p className="mt-5 leading-relaxed text-[color:var(--ink)]/70">
            Each piece at {config.business.name} is sourced directly from artisan clusters, preserving
            traditional techniques passed down through generations. When you order with us, you&apos;re
            supporting the hands behind every thread.
          </p>
          <a
            href={buildWhatsAppLink("Hi Sanctum Fabrics, I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle size={16} /> Order on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
